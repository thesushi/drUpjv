<?php

/**
 * @file
 * Contains \Drupal\authorization\Provider\ProviderPluginBase.
 */

namespace Drupal\authorization\Provider;

use Drupal\authorization\Plugin\ConfigurablePluginBase;
use Drupal\authorization\Provider\ProviderInterface;
use Drupal\authorization\Form\SubFormState;

/**
 * Base class for Authorization provider plugins.
 */
abstract class ProviderPluginBase extends ConfigurablePluginBase implements ProviderInterface {

  public $type = 'provider';
  public $handlers = array();

  public function submitRowForm(array &$form, SubFormState $form_state) {
    $values = $form_state->getValues();
    // Create an array of just the provider values
    $provider_mappings = array();
    foreach ($values as $key => $value) {
      $provider_mappings[] = $value['provider_mappings'];
    }
    $form_state->setValue('provider_mappings', $provider_mappings);

    parent::submitRowForm($form, $form_state);
  }

  public function getHandlers() {
    return $this->handlers;
  }

  public function getProposals($user, $op, $provider_mapping) {
    return NULL;
  }

  public function filterProposals($proposals, $op, $provider_mapping) {
    return array();
  }

  public function sanitizeProposals($proposals, $op) {}

}
