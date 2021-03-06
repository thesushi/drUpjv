<?php
namespace Drupal\ldap_authentication;
/**
 *
 */
class LdapAuthenticationTestCase extends LdapTestCase {

  /**
   *
   */
  public static function getInfo() {
    return array(
      'name' => 'LDAP Authentication Tests',
      'description' => 'Test ldap authentication.',
      'group' => 'LDAP Authentication',
    );
  }

  /**
   *
   */
  function __construct($test_id = NULL) {
    parent::__construct($test_id);
  }

  public $module_name = 'ldap_authentication';
  protected $ldap_test_data;

  /**
   *
   */
  function setUp() {
    parent::setUp(array(
      'ldap_authentication',
      'ldap_authorization',
      'ldap_authorization_drupal_role',
      'ldap_test',
    // don't need any real servers, configured, just ldap_servers code base.
    ));
    // @FIXME
    // // @FIXME
    // // This looks like another module's variable. You'll need to rewrite this call
    // // to ensure that it uses the correct configuration object.
    // variable_set('ldap_simpletest', 2);.
  }

  /**
   *
   */
  function tearDown() {
    parent::tearDown();
    // @FIXME
    // // @FIXME
    // // This looks like another module's variable. You'll need to rewrite this call
    // // to ensure that it uses the correct configuration object.
    // variable_del('ldap_help_watchdog_detail');
    // @FIXME
    // // @FIXME
    // // This looks like another module's variable. You'll need to rewrite this call
    // // to ensure that it uses the correct configuration object.
    // variable_del('ldap_simpletest');
  }

  /**
   * Difficult to test install and uninstall since setUp does module enabling and installing.
   */
  function testInstall() {
    $testid = $this->module_name . ': setup success';
    $setup_success = (
        \Drupal::moduleHandler()->moduleExists('ldap_authentication') &&
        \Drupal::moduleHandler()->moduleExists('ldap_servers')
      );

    $this->assertTrue($setup_success, ' ldap_authentication setup successful', $testid);
  }

  /**
   * LDAP Authentication Mixed Mode User Logon Test (ids = LDAP_authen.MM.ULT.*)
   */
  function testMixedModeUserLogon() {
    $sid = 'activedirectory1';
    $testid = 'MixedModeUserLogon3';
    $sids = array($sid);
    $this->prepTestData(
      LDAP_TEST_LDAP_NAME,
      $sids,
      'provisionToDrupal',
      'MixedModeUserLogon3',
      'drupal_role_authentication_test'
    );

    $ldap_servers = ldap_servers_get_servers($sid, 'enabled');
    $this->assertTrue(count($ldap_servers) == 1, ' ldap_authentication test server setup successful', $testid);

    /**
     * LDAP_authen.MM.ULT.user1.goodpwd -- result: Successful logon as user 1
     */

    $user1 = \Drupal::entityManager()->getStorage('user')->load(1);
    $password = $this->randomString(20);
    require_once \Drupal::root() . '/includes/password.inc';
    $account = array(
      'name' => $user1->name,
      'pass' => user_hash_password(trim($password)),
    );
    db_update('users')
      ->fields($account)
      ->condition('uid', 1)
      ->execute();

    $edit = array(
      'name' => $user1->name,
      'pass' => $password,
    );

    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Member for'), 'User 1 successfully authenticated', $testid);
    $this->drupalGet('user/logout');

    /** LDAP_authen.MM.ULT.user1.badpwd  -- result: Drupal logon error message. **/

    $edit = array(
      'name' => $user1->name,
      'pass' => 'mydabpassword',
    );

    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Sorry, unrecognized username or password'), 'User 1 failed with bad password', $testid);
    $this->drupalLogout();

    /** LDAP_authen.MM.ULT.drupal.goodpwd - result: Successful logon **/

    $drupal_user = $this->drupalCreateUser();
    $raw_pass = $drupal_user->pass_raw;
    $edit = array(
      'name' => $drupal_user->name,
      'pass' => $raw_pass,
    );
    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Member for'), 'Drupal user (not ldap associated) successfully authenticated', $testid);
    $this->drupalGet('user/logout');

    /** LDAP_authen.MM.ULT.drupal.badpwd - result: Drupal logon error message. **/
    $edit = array(
      'name' => $drupal_user->name,
      'pass' => 'mydabpassword',
    );
    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Sorry, unrecognized username or password'), 'Drupal user  (not ldap associated) with bad password failed to authenticate.', $testid);
    $this->drupalGet('user/logout');

    /** LDAP_authen.MM.ULT.ldap.newaccount.badpwd - result: Drupal logon error message. **/
    $edit = array(
      'name' => 'hpotter',
      'pass' => 'mydabpassword',
    );
    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Sorry, unrecognized username or password'), 'New Ldap user with bad password failed to authenticate.', $testid);
    $this->drupalGet('user/logout');

    /** LDAP_authen.MM.ULT.ldap.newaccount.goodpwd - result: Successful logon, with user record created and authmapped to ldap **/
    $edit = array(
      'name' => 'hpotter',
      'pass' => 'goodpwd',
    );
    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Member for'), 'New Ldap user with good password authenticated.');
    $this->assertTrue($this->testFunctions->ldapUserIsAuthmapped('hpotter'), 'Ldap user properly authmapped.', $testid);
    $this->drupalGet('user/logout');

    /** LDAP_authen.MM.ULT.existingacct.badpwd - result: Drupal logon error message. **/
    $edit = array(
      'name' => 'hpotter',
      'pass' => 'mydabpassword',
    );
    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Sorry, unrecognized username or password'), 'Existing Ldap user with bad password failed to authenticate.', $testid);
    $this->drupalGet('user/logout');

    /** LDAP_authen.MM.ULT.existingacct.goodpwd - result: Successful logon. **/
    $edit = array(
      'name' => 'hpotter',
      'pass' => 'goodpwd',
    );
    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Member for'), 'Existing Ldap user with good password authenticated.');
    $this->assertTrue($this->testFunctions->ldapUserIsAuthmapped('hpotter'), 'Existing Ldap user still properly authmapped.', $testid);
    $this->drupalGet('user/logout');

  }

  /**
   * LDAP Authentication Exclusive Mode User Logon Test (ids = LDAP_authen.EM.ULT.*)
   */
  function testExclusiveModeUserLogon() {

    $sid = 'activedirectory1';
    $testid = 'ExclusiveModeUserLogon3';
    $sids = array($sid);
    $this->prepTestData(
      LDAP_TEST_LDAP_NAME,
      $sids,
      'ad_authentication',
      'ExclusiveModeUserLogon3',
      'drupal_role_authentication_test'
      );

    $ldap_servers = ldap_servers_get_servers($sid, 'enabled');
    $this->assertTrue(count($ldap_servers) == 1, ' ldap_authentication test server setup successful', $testid);

    /**
     * LDAP_authen.EM.ULT.user1.goodpwd -- result: Successful logon as user 1
     */

    $user1 = \Drupal::entityManager()->getStorage('user')->load(1);
    $password = $this->randomString(20);
    require_once \Drupal::root() . '/includes/password.inc';
    $account = array(
      'name' => $user1->name,
      'pass' => user_hash_password(trim($password)),
    );
    db_update('users')
      ->fields($account)
      ->condition('uid', 1)
      ->execute();

    $edit = array(
      'name' => $user1->name,
      'pass' => $password,
    );

    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Member for'), 'User 1 successfully authenticated', $testid);
    $this->drupalGet('user/logout');

    /** LDAP_authen.EM.ULT.user1.badpwd  -- result: Drupal logon error message. **/

    $edit = array(
      'name' => $user1->name,
      'pass' => 'mydabpassword',
    );

    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Sorry, unrecognized username or password'), 'User 1 failed with bad password', $testid);
    $this->drupalLogout();

    /** LDAP_authen.EM.ULT.drupal.goodpwd - result: failed logon **/

    $drupal_user = $this->drupalCreateUser();
    $raw_pass = $drupal_user->pass_raw;
    $edit = array(
      'name' => $drupal_user->name,
      'pass' => $raw_pass,
    );
    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Sorry, unrecognized username or password'), 'Drupal user successfully authenticated', $testid);
    $this->drupalGet('user/logout');

    /** LDAP_authen.EM.ULT.drupal.badpwd - result: Drupal logon error message. **/
    $edit = array(
      'name' => $drupal_user->name,
      'pass' => 'mydabpassword',
    );
    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Sorry, unrecognized username or password'), 'Drupal user with bad password failed to authenticate.', $testid);
    $this->drupalGet('user/logout');

    /** LDAP_authen.EM.ULT.ldap.newaccount.badpwd - result: Drupal logon error message. **/
    $edit = array(
      'name' => 'hpotter',
      'pass' => 'mydabpassword',
    );
    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Sorry, unrecognized username or password'), 'New Ldap user with bad password failed to authenticate.', $testid);
    $this->drupalGet('user/logout');

    /** LDAP_authen.EM.ULT.ldap.newaccount.goodpwd - result: Successful logon, with user record created and authmapped to ldap **/
    $edit = array(
      'name' => 'hpotter',
      'pass' => 'goodpwd',
    );
    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Member for'), 'New Ldap user with good password authenticated.');
    $this->assertTrue($this->testFunctions->ldapUserIsAuthmapped('hpotter'), 'Ldap user properly authmapped.', $testid);
    $this->drupalGet('user/logout');

    /** LDAP_authen.EM.ULT.existingacct.badpwd - result: Drupal logon error message. **/
    $edit = array(
      'name' => 'hpotter',
      'pass' => 'mydabpassword',
    );
    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Sorry, unrecognized username or password'), 'Existing Ldap user with bad password failed to authenticate.', $testid);
    $this->drupalGet('user/logout');

    /** LDAP_authen.MM.ULT.existingacct.goodpwd - result: Successful logon. **/
    $edit = array(
      'name' => 'hpotter',
      'pass' => 'goodpwd',
    );
    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Member for'), 'Existing Ldap user with good password authenticated.');
    $this->assertTrue($this->testFunctions->ldapUserIsAuthmapped('hpotter'), 'Existing Ldap user still properly authmapped.', $testid);
    $this->drupalGet('user/logout');

  }

  /**
   * Set mock server variables for sso tests.
   *
   * @param object $drupal_user
   *   in drupal stdClass format
   * @param array $ldap_user
   *   array
   * @param enum ldap implementation type
   */
  private function setSsoServerEnvironment(
    $server_var_key = 'REMOTE_USER',
    $sso_name = 'hpotter',
    $ldapImplementation = 'mod_auth_sspi',
    $seamlessLogin = TRUE
  ) {

    // Clear past environment.
    ldap_servers_delete_globals('_SERVER', 'REMOTE_USER', TRUE);
    ldap_servers_delete_globals('_SERVER', 'REDIRECT_REMOTE_USER', TRUE);

    $authenticationConf = new \LdapAuthenticationConfAdmin();

    $authenticationConf->ssoEnabled = TRUE;
    $authenticationConf->ssoRemoteUserStripDomainName = FALSE;
    $authenticationConf->ssoExcludedPaths = array();
    $authenticationConf->ssoExcludedHosts = array();
    $authenticationConf->seamlessLogin = $seamlessLogin;
    $authenticationConf->ldapImplementation = $ldapImplementation;

    if ($sso_name !== FALSE) {
      if (strpos($sso_name, '@')) {
        $sso_name_parts = explode('@', $sso_name);
        $sso_name = $sso_name_parts[0];
        $authenticationConf->ssoRemoteUserStripDomainName = TRUE;
      }
      ldap_servers_set_globals('_SERVER', $server_var_key, $sso_name);
    }
    $authenticationConf->save();
    return ldap_authentication_get_valid_conf(TRUE);

  }

  /**
   * LDAP Authentication Exclusive Mode User Logon Test (ids = LDAP_authen.EM.ULT.*)
   */
  function testSSOUserLogon() {

    module_enable(array('ldap_sso', 'ldap_help'));

    $sid = 'activedirectory1';
    $testid = 'SSOUserLogon3';
    $sids = array($sid);
    $this->prepTestData(
      LDAP_TEST_LDAP_NAME,
      $sids,
      'ad_authentication',
      'SSOUserLogon'
      );

    $this->setSsoServerEnvironment('REMOTE_USER', 'hpotter', 'mod_auth_sspi', TRUE);
    $this->drupalGet('user/logout');
    $this->drupalGet('user');

    // Just test that the setup works.
    $authenticationConf = new \LdapAuthenticationConfAdmin();
    $this->assertTrue(ldap_servers_get_globals('_SERVER', 'REMOTE_USER', TRUE) == 'hpotter',
       '$_SERVER[REMOTE_USER] and $_SERVER[REDIRECT_REMOTE_USER] set properly for test with remote server ' . ldap_servers_get_globals('_SERVER', 'REMOTE_ADDR'), $testid);

    $setup_success = ($authenticationConf->ssoEnabled == TRUE &&
      $authenticationConf->ssoRemoteUserStripDomainName == FALSE &&
      $authenticationConf->seamlessLogin == TRUE &&
      $authenticationConf->ldapImplementation == 'mod_auth_sspi');

    $this->assertTrue($setup_success, 'setup ldap sso test worked ', $testid);
    if (!$setup_success) {
      debug('authenticationConf'); debug($authenticationConf);
    }

    $ldap_servers = ldap_servers_get_servers($sid, 'enabled');
    $this->assertTrue(count($ldap_servers) == 1, ' ldap_authentication test server setup successful', $testid);
    $hpotter_drupal = user_load_by_name('hpotter');
    $ldap_user_conf = ldap_user_conf('admin', TRUE);
    $hpotter_ldap = $ldap_user_conf->getProvisionRelatedLdapEntry($hpotter_drupal);
    debug('hpotter ldap entry'); debug($hpotter_drupal);

    $tests = array(
      'dontstripnames' => array('sso_name' => 'hpotter'),
      'stripnames' => array('sso_name' => 'hpotter@hogwarts'),

    );

    foreach ($tests as $testid => $conf) {
      foreach (array('REMOTE_USER') as $server_var_key) {
        // ,'user/login/sso'.
        foreach (array('user') as $test_path) {
          // , 'mod_auth_kerb'.
          foreach (array('mod_auth_sspi', 'mod_auth_kerb') as $ldapImplementation) {
            // , FALSE.
            foreach (array(TRUE, FALSE) as $seamlessLogin) {
              $sso_name = $conf['sso_name'];
              $this->ldapTestId = "testSSO._SERVER-key=$server_var_key sso_name=$sso_name path=$test_path ldapImplementation=$ldapImplementation seamlessLogin=$seamlessLogin";
              $ldapAuthenticationConf = $this->setSsoServerEnvironment($server_var_key, $sso_name, $ldapImplementation, $seamlessLogin);
              $this->drupalGet($test_path);
              $this->assertText(t('Member for'), 'Successful logon.', $this->ldapTestId);
              $this->drupalGet('user/logout');
            }
          }
        }
      }
    }
  }

  /**
   *
   */
  function testAuthenticationWhitelistTests() {
    require_once drupal_get_path('module', 'ldap_authentication') . '/LdapAuthenticationConfAdmin.class.php';

    $sid = 'activedirectory1';
    $testid = 'WL3';
    $sids = array($sid);
    $this->prepTestData(
      'hogwarts',
      array($sid),
      'provisionToDrupal',
      'WL3',
      'drupal_role_authentication_test'
      );

    // debug($this->testFunctions);.
    $ldap_servers = ldap_servers_get_servers($sid, 'enabled');
    $this->assertTrue(count($ldap_servers) == 1, ' ldap_authentication test server setup successful', $testid);

    // These 2 modules are configured in setup, but disabled for most authentication tests.
    module_disable(array('ldap_authorization_drupal_role', 'ldap_authorization'));

    /**
     * LDAP_authen.WL.user1  test for user 1 being excluded from white and black list tests
     */

    $user1 = \Drupal::entityManager()->getStorage('user')->load(1);
    $password = $this->randomString(20);
    require_once \Drupal::root() . '/includes/password.inc';
    $account = array(
      'name' => $user1->name,
      'pass' => user_hash_password(trim($password)),
    );
    db_update('users')
      ->fields($account)
      ->condition('uid', 1)
      ->execute();

    $edit = array(
      'name' => $user1->name,
      'pass' => $password,
    );

    $this->drupalPost('user', $edit, t('Log in'));
    $this->assertText(t('Member for'), 'User 1 successfully authenticated in LDAP_authen.WL.user1', $testid);
    $this->drupalGet('user/logout');

    module_enable(array('ldap_authorization'));
    module_enable(array('ldap_authorization_drupal_role'));

    /**
     * prep LDAP_authen.WL.allow
     */
    $authenticationConf = new \LdapAuthenticationConfAdmin();
    $authenticationConf->allowOnlyIfTextInDn = array('pot');
    $authenticationConf->save();
    $authenticationConf = ldap_authentication_get_valid_conf(TRUE);

    /**
    * LDAP_authen.WL.allow.match -- desirect_result: authenticate success
    */

    $this->AttemptLogonNewUser('hpotter');
    $this->assertText(t('Member for'), 'User able to authenticate because in white list (allowOnlyIfTextInDn).', $testid);

    /**
    *  LDAP_authen.WL.allow.miss -- desirect_result: authenticate fail
    */

    $this->AttemptLogonNewUser('ssnape');
    $this->assertText(t('User disallowed'), 'User unable to authenticate because not in white list (allowOnlyIfTextInDn).', $testid);

    /**
    * undo LDAP_authen.WL.allow settings
    */

    $authenticationConf = new \LdapAuthenticationConfAdmin();
    $authenticationConf->allowOnlyIfTextInDn = array();
    $authenticationConf->save();
    $authenticationConf = ldap_authentication_get_valid_conf(TRUE);
    /**
    * prep LDAP_authen.WL.exclude
    */
    $authenticationConf = new \LdapAuthenticationConfAdmin();
    $authenticationConf->excludeIfTextInDn = array('cn=ssnape');
    $authenticationConf->save();
    $authenticationConf = ldap_authentication_get_valid_conf(TRUE);

    /**
    * LDAP_authen.WL.exclude.match -- desirect_result: authenticate fail
    */

    $this->AttemptLogonNewUser('ssnape');
    $this->assertText(t('User disallowed'), 'User unable to authenticate in exclude list (excludeIfTextInDn).', $testid);

    /**
    *  LDAP_authen.WL.exclude.miss-- desirect_result: authenticate success
    */

    $this->AttemptLogonNewUser('hpotter');
    $this->assertText(t('Member for'), 'Able to authenticate because not in exclude list (allowOnlyIfTextInDn).', $testid);

    /**
    * undo LDAP_authen.WL.allow settings
    */

    $authenticationConf = new \LdapAuthenticationConfAdmin();
    $authenticationConf->excludeIfTextInDn = array();
    $authenticationConf->save();
    $authenticationConf = ldap_authentication_get_valid_conf(TRUE);

    /**
    * prep LDAP_authen.WL.php
    */
    $authenticationConf = new \LdapAuthenticationConfAdmin();
    $authenticationConf->allowTestPhp = "\n
      //exclude users with dumb in email address \n
      if (strpos(\$_ldap_user_entry['attr']['mail'][0], 'dumb') === FALSE) {\n
        print 1;\n
      }\n
      else {
        print 0;\n
      }
      ";

    $authenticationConf->save();
    $authenticationConf = ldap_authentication_get_valid_conf(TRUE);
    /**
    * LDAP_authen.WL.php.php disabled -- desired result: authenticate fail with warning the authentication disabled
    */
    module_disable(array('php'));
    $this->AttemptLogonNewUser('adumbledore');
    $this->assertText(
      LDAP_AUTHENTICATION_DISABLED_FOR_BAD_CONF_MSG,
      'With php disabled and php code in whitelist, refuse authentication. (allowTestPhp).',
      $testid
    );
    module_enable(array('php'));

    /**
    * LDAP_authen.WL.php.true -- desired result: authenticate success
    */
    $this->AttemptLogonNewUser('hpotter');
    $this->assertText(t('Member for'), 'Able to authenticate because php returned true (allowTestPhp).', $testid);

    /**
    *  LDAP_authen.WL.php.false-- desired result: authenticate fail
    */

    $this->AttemptLogonNewUser('adumbledore');
    $this->assertText(
      t('User disallowed'),
      'User unable to authenticate because php returned false (allowTestPhp).',
      $testid
    );

    /**
    * clear LDAP_authen.WL.php
    */
    $authenticationConf = new \LdapAuthenticationConfAdmin();
    $authenticationConf->allowTestPhp = '';
    $authenticationConf->save();
    $authenticationConf = ldap_authentication_get_valid_conf(TRUE);

    /**
   * need to test username changes with PUID
   *   - given a user exists
   *   - change samaccountname in ldap server
   *   - have user logon
   *   - make sure old user and new user have same puid
   *
   */

    /***  multiple options used in whitelist **/

    /**
    * LDAP_authen.WL.allow[match].exclude[match] -- desired result: authenticate fail
    */

    /**
    *  LDAP_authen.WL.allow[match].exclude[miss] -- desired result: authenticate success
    */

    /**
    * LDAP_authen.WL.exclude[match].*-- desirect_result: authenticate fail
    */

    /**
    *  LDAP_authen.WL.exclude[match].php[false] -- desired result: authenticate fail
    */

    /**
     * LDAP_authen.WL1.excludeIfNoAuthorizations.hasAuthorizations
     * test for excludeIfNoAuthorizations set to true and consumer granted authorizations
     */

    // These 2 modules are configured in setup, but disabled for most authentication tests.
    module_disable(array('ldap_authorization_drupal_role', 'ldap_authorization'));
    $authenticationConf = new \LdapAuthenticationConfAdmin();
    $authenticationConf->excludeIfNoAuthorizations = 1;
    $authenticationConf->save();
    $authenticationConf = ldap_authentication_get_valid_conf(TRUE);
    /**
     * LDAP_authen.WL1.excludeIfNoAuthorizations.failsafe
     * test for excludeIfNoAuthorizations set to true and ldap_authorization disabled
     * to make sure authentication fails completely
     */

    $this->AttemptLogonNewUser('hpotter');
    $this->assertText(
      LDAP_AUTHENTICATION_DISABLED_FOR_BAD_CONF_MSG,
      t('Authentication prohibited when excludeIfNoAuthorizations =
        true and LDAP Authorization disabled.
        LDAP_authen.WL1.excludeIfNoAuthorizations.failsafe'),
      $testid
    );

    module_enable(array('ldap_authorization'), TRUE);
    module_enable(array('ldap_authorization_drupal_role'), TRUE);
    // Clear static cache.
    $consumer = ldap_authorization_get_consumers('drupal_role', TRUE, TRUE);

    $this->AttemptLogonNewUser('hpotter');
    $this->assertText(
      t('Member for'),
      'User able to authenticate because of excludeIfNoAuthorizations setting.',
      $testid
    );

    /**
     * LDAP_authen.WL1.excludeIfNoAuthorizations.hasNoAuthorizations
     * test for excludeIfNoAuthorizations set to true and No consumer
     * granted authorizations
     */

    $this->AttemptLogonNewUser('ssnape');
    $this->assertText(
      t('User disallowed'),
      'User unable to authenticate because of excludeIfNoAuthorizations setting.',
      $testid
    );

    $authenticationConf = new \LdapAuthenticationConfAdmin();
    $authenticationConf->excludeIfNoAuthorizations = 0;
    $authenticationConf->save();
    $authenticationConf = ldap_authentication_get_valid_conf(TRUE);
    module_disable(array('ldap_authorization_drupal_role', 'ldap_authorization'));

  }

  /**
   * Make sure user admin interface works.
   */
  function testUI() {

    // Just to give warning if setup doesn't succeed.  may want to take these out at some point.
    // @FIXME
    // // @FIXME
    // // This looks like another module's variable. You'll need to rewrite this call
    // // to ensure that it uses the correct configuration object.
    // $setup_success = (
    //         module_exists('ldap_user') &&
    //         module_exists('ldap_servers') &&
    //         module_exists('ldap_authentication') &&
    //         (variable_get('ldap_simpletest', 2) > 0)
    //       );.
    $this->assertTrue($setup_success, ' ldap_authentication UI setup successful', $this->testId('user interface tests'));

    $sid = 'activedirectory1';
    $sids = array('activedirectory1');
    $this->prepTestData(LDAP_TEST_LDAP_NAME, $sids, 'provisionToDrupal', 'default');

    $this->privileged_user = $this->drupalCreateUser(array(
      'administer site configuration',
    ));

    $this->drupalLogin($this->privileged_user);

    $ldap_authentication_conf_pre = ldap_authentication_get_valid_conf();

    $this->drupalGet('admin/config/people/ldap/authentication');

    $form_tests = array(
      'authenticationMode' => array(
        'property' => 'authenticationMode',
        'values' => array(
          LDAP_AUTHENTICATION_MIXED,
          LDAP_AUTHENTICATION_EXCLUSIVE,
        ),
        'required' => TRUE,
      ),
      'authenticationServers[' . $sid . ']' => array(
        'property' => 'enabledAuthenticationServers',
        'values' => array(
          TRUE,
          TRUE,
        ),
        'desired_result' => array(
          array($sid),
          array($sid),
        ),
      ),
      'loginUIUsernameTxt' =>
        array(
          'property' => 'loginUIUsernameTxt',
          'values' => array(
            '',
            'Hogwarts UserID',
          ),
        ),
      'loginUIPasswordTxt' =>
        array(
          'property' => 'loginUIPasswordTxt',
          'values' => array(
            '',
            'Hogwarts UserID Password',
          ),
        ),
      'ldapUserHelpLinkUrl' =>
        array(
          'property' => 'ldapUserHelpLinkUrl',
          'values' => array(
            '',
            'http://passwords.hogwarts.edu',
          ),
        ),
      'ldapUserHelpLinkText' =>
        array(
          'property' => 'ldapUserHelpLinkText',
          'values' => array(
            'Hogwarts Password Management Page',
            'Hogwarts Password Management Page',
          ),
        ),
      'allowOnlyIfTextInDn' => array(
        'property' => 'allowOnlyIfTextInDn',
        'values' => array(
          'witch\nwarlord\nwisecracker',
          "witch\nwarlord\nwisecracker",
        ),
        'desired_result' => array(
          array('witch', 'warlord', 'wisecracker'),
          array('witch', 'warlord', 'wisecracker'),
        ),
      ),
      'excludeIfTextInDn' => array(
        'property' => 'excludeIfTextInDn',
        'values' => array(
          "muggle\nmuddle\nmummy",
          "muggle\nmuddle\nmummy",
        ),
        'desired_result' => array(
          array('muggle', 'muddle', 'mummy'),
          array('muggle', 'muddle', 'mummy'),
        ),
      ),
      'excludeIfNoAuthorizations' => array(
        'property' => 'excludeIfNoAuthorizations',
        'values' => array(
          array(TRUE),
          array(TRUE),
        ),
      ),
      'emailOption' => array(
        'property' => 'emailOption',
        'values' => array(
          LDAP_AUTHENTICATION_EMAIL_FIELD_REMOVE,
          LDAP_AUTHENTICATION_EMAIL_FIELD_DISABLE,
        ),
        'required' => TRUE,
      ),
      'emailUpdate' => array(
        'property' => 'emailUpdate',
        'values' => array(
          LDAP_AUTHENTICATION_EMAIL_UPDATE_ON_LDAP_CHANGE_ENABLE,
          LDAP_AUTHENTICATION_EMAIL_UPDATE_ON_LDAP_CHANGE_DISABLE,
        ),
        'required' => TRUE,
      ),
      'allowTestPhp' => array(
        'property' => 'allowTestPhp',
        'values' => array(
          'pretend php',
          'pretend php',
        ),
      ),
    );

    module_enable(array('php'));
    foreach (array(0, 1) as $i) {
      $edit = array();
      foreach ($form_tests as $field_name => $conf) {
        $value = $conf['values'][$i];
        $property = isset($conf['property']) ? $conf['property'] : $field_name;
        $edit[$field_name] = $value;
        // debug("$field_name $value"); debug($conf);debug($edit);
      }
      // debug($edit);
      $this->drupalPost('admin/config/people/ldap/authentication', $edit, t('Save'));
      $ldap_authentication_conf_post = ldap_authentication_get_valid_conf(TRUE);

      foreach ($form_tests as $field_name => $conf) {
        $property = isset($conf['property']) ? $conf['property'] : $field_name;
        $desired = isset($conf['desired_result']) ? isset($conf['desired_result'][$i]) : $conf['values'][$i];

        if (is_array($desired)) {
          $success = count($desired) == count($ldap_authentication_conf_post->{$property});
        }
        else {
          $success = ($ldap_authentication_conf_post->{$property} == $desired);
        }
        $this->assertTrue(
          $success,
          $property . ' ' . t('field set correctly'),
          $this->testId('ldap authentication user interface tests')
        );
        if (!$success) {
          debug("fail $i $property");
          debug("desired:"); debug($desired);
          debug("actual:");  debug($ldap_authentication_conf_post->{$property});
        }
      }
    }
  }

}
