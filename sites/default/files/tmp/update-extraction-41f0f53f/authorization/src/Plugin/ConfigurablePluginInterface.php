<?php

/**
 * @file
 * Contains \Drupal\authorization\Plugin\ConfigurablePluginInterface.
 */

namespace Drupal\authorization\Plugin;

use Drupal\Component\Plugin\ConfigurablePluginInterface as DrupalConfigurablePluginInterface;
use Drupal\Component\Plugin\DerivativeInspectionInterface;
use Drupal\Component\Plugin\PluginInspectionInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Plugin\PluginFormInterface;

/**
 * Describes a configurable Authorization plugin.
 */
interface ConfigurablePluginInterface extends PluginInspectionInterface, DerivativeInspectionInterface, DrupalConfigurablePluginInterface, PluginFormInterface, ContainerFactoryPluginInterface {

  /**
   * Returns the label for use on the administration pages.
   *
   * @return string
   *   The administration label.
   */
  public function label();

  /**
   * Returns the plugin's description.
   *
   * @return string
   *   A string describing the plugin. Might contain HTML and should be already
   *   sanitized for output.
   */
  public function getDescription();

}
