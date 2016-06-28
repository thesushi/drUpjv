<?php

  use Drupal\user\entity\User;

  function _authorizations_user_authorizations(User &$user, $op, $profile_id, $context) {
    /* @var \Drupal\authorization\Entity\AuthorizationProfile $profile */
    $profile = \Drupal::entityManager()->getStorage('authorization_profile')->load($profile_id);

    $authorizations = array();
    $notifications = array();
    $watchdog_tokens = array('%username' => $user->getDisplayName());

    /**
     * User 1 not used in ldap authorization. This is a design decision.
     * @TODO have this configurable per provider or per profile.
     */
    if ( $user->id() == 1 ) {
      if (\Drupal::config('ldap_help.settings')->get('watchdog_detail')) {
      \Drupal::logger('authorization')->debug('%username : authorization not applied to user 1', $watchdog_tokens);
      }
      $notifications['all'] = AUTHORIZATION_NOT_APPLY_USER_1;
      return array($authorizations, $notifications);
    }

    //@FIXME: All three parameters are unused, are they needed for  the missing values?
    $uid = $user->id();
    $provider = $profile->getProvider();
    $consumer = $profile->getConsumer();

    if ( $profile->checkConditions($user, $op) ) {
      $user_save = TRUE;
      // Apply the profile map to the user
      //@FIXME: The default values for $user_auth_data and $identifier were only added due to errors.
      $user_auth_data = array();
      $identifier = '';
      list($authorizations, $notifications) = $profile->grantsAndRevokes($op, $user, $user_auth_data, $identifier, $user_save);
    }

    return array($authorizations, $notifications);

  }
