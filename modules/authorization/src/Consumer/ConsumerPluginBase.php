<?php

/**
 * @file
 * Contains \Drupal\authorization\Consumer\ConsumerPluginBase.
 */

namespace Drupal\authorization\Consumer;

use Drupal\authorization\Plugin\ConfigurablePluginBase;
use Drupal\authorization\Consumer\ConsumerInterface;
use Drupal\authorization\Form\SubFormState;

/**
 * Base class for Authorization consumer plugins.
 */
abstract class ConsumerPluginBase extends ConfigurablePluginBase implements ConsumerInterface {

  public $type = 'consumer';
  protected $allowConsumerTargetCreation = NULL;

  public function submitRowForm(array &$form, SubFormState $form_state) {
    $values = $form_state->getValues();
    $consumer_mappings = array();
    foreach ($values as $key => $value) {
      $consumer_mappings[] = $value['consumer_mappings'];
    }
    $form_state->setValue('consumer_mappings', $consumer_mappings);

    parent::submitRowForm($form, $form_state);
  }

  /**
   * @TODO fix the documentation
   * @param drupal user object $user to have $consumer_id revoked
   * @param string lower case $consumer_id $consumer_id such as drupal role name, og group name, etc.
   * @param mixed $consumer.  depends on type of consumer.  Drupal roles are strings, og groups are ??
   * @param array $user_auth_data array of $user data specific to this consumer type.
   *   stored in $user->data['ldap_authorizations'][<consumer_type>] array
   * @param boolean $reset signifying if caches associated with $consumer_id should be invalidated.
   *
   * @return boolean TRUE on success, FALSE on fail.  If user save is FALSE, the user object will
   *   not be saved and reloaded, so a returned TRUE may be misleading.
   *   $user_auth_data should have successfully revoked consumer id removed
   */
   public function revokeSingleAuthorization(&$user, $op, $incoming, $consumer_mapping, &$user_auth_data, $user_save=FALSE, $reset=FALSE) {
     // method must be overridden
  }

  /**
   * @TODO fix the documentation
   * @param stdClass $user as drupal user object to have $consumer_id granted
   * @param string lower case $consumer_id $consumer_id such as drupal role name, og group name, etc.
   * @param mixed $consumer.  depends on type of consumer.  Drupal roles are strings, og groups are ??
   * @param array $user_auth_data in form
   *   array('my drupal role' =>
   *     'date_granted' => 1351814718,
   *     'consumer_id_mixed_case' => 'My Drupal Role',
   *     )
   * @param boolean $reset signifying if caches associated with $consumer_id should be invalidated.
   *
   * @return boolean FALSE on failure or TRUE on success
   */
  public function grantSingleAuthorization(&$user, $op, $incoming, $consumer_mapping, &$user_auth_data, $user_save=FALSE, $reset=FALSE) {
     // method must be overridden
  }

  /*
   * Are we allowed to create things (roles for example)?
   */
  public function createConsumerTargets() {
    return $this->allowConsumerTargetCreation;
  }

  /**
   *
   * Create authorization consumer targets
   *
   * @param string (lowercase) $consumer_id
   * @param array $consumer as associative array with the following key/values
   *   'value' => NULL | mixed consumer such as drupal role name, og group entity, etc.
   *   'name' => name of consumer for UI, logging etc.
   *   'map_to_string' => string mapped to in ldap authorization.  mixed case string
   *   'exists' => TRUE indicates consumer is known to exist,
   *               FALSE indicates consumer is known to not exist,
   *               NULL indicate consumer's existance not checked yet
   *
   */
  public function createConsumerTarget($consumer_id, $consumer) {
    // method must be overridden
  }

}
