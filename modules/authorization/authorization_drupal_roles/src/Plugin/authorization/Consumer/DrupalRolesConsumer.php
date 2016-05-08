<?php

/**
 * @file
 * Contains \Drupal\authorization_drupal_roles\Plugin\authorization\consumer\DrupalRolesConsumer.
 */

namespace Drupal\authorization_drupal_roles\Plugin\authorization\consumer;

use Drupal\Core\Form\FormStateInterface;

use Drupal\authorization\Consumer\ConsumerPluginBase;
/**
 * @AuthorizationConsumer(
 *   id = "authorization_drupal_roles",
 *   label = @Translation("Drupal Roles"),
 *   description = @Translation("Add users to roles.")
 * )
 */
class DrupalRolesConsumer extends ConsumerPluginBase {

  public $allowConsumerTargetCreation = TRUE;

  public function buildConfigurationForm(array $form, FormStateInterface $form_state) {
    $form['description'] = array(
      '#type' => 'markup',
      '#markup' => t('There are no settings for Drupal roles.'),
    );
    return $form;
  }

  public function buildRowForm(array $form, FormStateInterface $form_state, $index) {
    $row = array();
    $mappings = $this->configuration['profile']->getConsumerMappings();
    $role_options = array();
    $roles = user_roles(TRUE);
    foreach ( $roles as $key => $role ) {
      if ( $key != 'authenticated' ) {
        $role_options[$key] = $role->label();
      }
    }
    $row['role'] = array(
      '#type' => 'select',
      '#title' => t('Role'),
      '#options' => $role_options,
      '#default_value' => $mappings[$index]['role'],
      '#description' => 'Choose the Drupal role to apply to the user.',
    );
    return $row;
  }

  public function submitRowForm(array &$form, FormStateInterface $form_state) {
    $values = $form_state->getValues();
    // Create an array of just the provider values
    $consumer_mappings = array();
    foreach ($values as $key => $value) {
      $consumer_mappings[] = $value['consumer_mappings'];
    }
    // Nuke our form_state leaving just the mapping
    // $form_state->setValues(array('consumer_mappings' => $consumer_mappings));
    $form_state->setValue('consumer_mappings', $consumer_mappings);

    parent::submitRowForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function validateConfigurationForm(array &$form, FormStateInterface $form_state) {
    parent::validateConfigurationForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitConfigurationForm(array &$form, FormStateInterface $form_state) {
    parent::submitConfigurationForm($form, $form_state);
  }

  public function getTokens() {
    $tokens = array();
    $tokens['!' . $this->getType() . '_namePlural'] = $this->label();
    $tokens['!' . $this->getType() . '_name'] = 'Drupal role';
    $tokens['!' . $this->getType() . '_mappingDirections'] = '';
    $tokens['!examples'] = '';
    return $tokens;
  }

  /**
   * extends revokeSingleAuthorization()
   * {@inheritdoc}
   */
  public function revokeSingleAuthorization(&$user, $op, $incoming, $consumer_mapping, &$user_auth_data, $user_save=FALSE, $reset=FALSE) {
    $user->removeRole($consumer_mapping['role']);
    if ( $user_save ) {
      $user->save();
    }
  }

  /**
   * extends grantSingleAuthorization()
   * {@inheritdoc}
   */
  public function grantSingleAuthorization(&$user, $op, $incoming, $consumer_mapping, &$user_auth_data, $user_save=FALSE, $reset=FALSE) {
    $user->addRole($consumer_mapping['role']);
    if ( $user_save ) {
      $user->save();
    }
  }

  /**
   * extends createConsumerTarget()
   * {@inheritdoc}
   */
  public function createConsumerTarget($consumer_id, $consumer) {
    //  @TODO
  }

}
