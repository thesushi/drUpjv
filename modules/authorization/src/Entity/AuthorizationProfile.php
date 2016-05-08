<?php

/**
 * @file
 * Contains \Drupal\authorization\Entity\AuthorizationProfile.
 */

namespace Drupal\authorization\Entity;

use Drupal\Core\Config\Entity\ConfigEntityBase;
use Drupal\authorization\AuthorizationProfileInterface;

/**
 * Defines the Authorization profile entity.
 *
 * @ConfigEntityType(
 *   id = "authorization_profile",
 *   label = @Translation("Authorization profile"),
 *   handlers = {
 *     "list_builder" = "Drupal\authorization\AuthorizationProfileListBuilder",
 *     "form" = {
 *       "add" = "Drupal\authorization\Form\AuthorizationProfileForm",
 *       "edit" = "Drupal\authorization\Form\AuthorizationProfileForm",
 *       "delete" = "Drupal\authorization\Form\AuthorizationProfileDeleteForm"
 *     }
 *   },
 *   config_prefix = "authorization_profile",
 *   admin_permission = "administer site configuration",
 *   entity_keys = {
 *     "id" = "id",
 *     "label" = "label",
 *     "uuid" = "uuid"
 *   },
 *   links = {
 *     "canonical" = "/admin/structure/authorization_profile/{authorization_profile}",
 *     "edit-form" = "/admin/structure/authorization_profile/{authorization_profile}/edit",
 *     "delete-form" = "/admin/structure/authorization_profile/{authorization_profile}/delete",
 *     "collection" = "/admin/structure/visibility_group"
 *   }
 * )
 */
class AuthorizationProfile extends ConfigEntityBase implements AuthorizationProfileInterface {
  /**
   * The Authorization profile ID.
   *
   * @var string
   */
  protected $id;

  /**
   * The Authorization profile label.
   *
   * @var string
   */
  protected $label;

  /**
   * The id of the Authorization provider.
   *
   * @var string
   */
  protected $provider;

  /**
   * The id of the Authorization consumer.
   *
   * @var string
   */
  protected $consumer;

  /**
   * The provider plugin configuration.
   *
   * @var array
   */
  protected $provider_config = array();

  /**
   * The provider plugin mappings.
   *
   * @var array
   */
  protected $provider_mappings = array();

  /**
   * The provider plugin instance.
   *
   * @var \Drupal\authorization\provider\ProviderInterface
   */
  protected $providerPlugin;

  /**
   * The consumer plugin configuration.
   *
   * @var array
   */
  protected $consumer_config = array();

  /**
   * The consumer plugin mappings.
   *
   * @var array
   */
  protected $consumer_mappings = array();

  /**
   * The consumer plugin instance.
   *
   * @var \Drupal\authorization\consumer\ConsumerInterface
   */
  protected $consumerPlugin;

  /**
   * {@inheritdoc}
   */
  public function getDescription() {
    return $this->description;
  }

  /**
   * {@inheritdoc}
   */
  public function getProviderId() {
    return $this->provider;
  }

  /**
   * {@inheritdoc}
   */
  public function getConsumerId() {
    return $this->consumer;
  }

  /**
   * {@inheritdoc}
   */
  public function hasValidProvider() {
    $provider_plugin_definition = \Drupal::service('plugin.manager.authorization.provider')->getDefinition($this->getProviderId(), FALSE);
    return !empty($provider_plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public function getProvider() {
    if (!$this->providerPlugin || $this->getProviderId() != $this->providerPlugin->label() ) {
      $provider_plugin_manager = \Drupal::service('plugin.manager.authorization.provider');
      $config = $this->provider_config;
      $config['profile'] = $this;
      if (!($this->providerPlugin = $provider_plugin_manager->createInstance($this->getProviderId(), $config))) {
        $args['@provider'] = $this->getProviderId();
        $args['%profile'] = $this->label();
        // throw new SearchApiException(new FormattableMarkup('The provider with ID "@provider" could not be retrieved for profile %profile.', $args));
      }
    }

    return $this->providerPlugin;
  }

  /**
   * {@inheritdoc}
   */
  public function getProviderConfig() {
    return $this->provider_config;
  }

  /**
   * {@inheritdoc}
   */
  public function setProviderConfig(array $provider_config) {
    $this->provider_config = $provider_config;
    $this->getProvider()->setConfiguration($provider_config);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getProviderMappings() {
    return $this->provider_mappings;
  }

  /**
   * {@inheritdoc}
   */
  public function setProviderMappings(array $provider_mappings) {
    $this->provider_mappings = $provider_mappings;
    $this->getProvider()->setConfiguration($provider_mappings);
    return $this;
  }


  /**
   * {@inheritdoc}
   */
  public function hasValidConsumer() {
    $consumer_plugin_definition = \Drupal::service('plugin.manager.authorization.consumer')->getDefinition($this->getconsumerId(), FALSE);
    return !empty($consumer_plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public function getConsumer() {
    if (!$this->consumerPlugin || $this->getConsumerId() != $this->consumerPlugin->label() ) {
      $consumer_plugin_manager = \Drupal::service('plugin.manager.authorization.consumer');
      $config = $this->consumer_config;
      $config['profile'] = $this;
      if (!($this->consumerPlugin = $consumer_plugin_manager->createInstance($this->getConsumerId(), $config))) {
        $args['@consumer'] = $this->getConsumerId();
        $args['%profile'] = $this->label();
        throw new Exception(new FormattableMarkup('The consumer with ID "@consumer" could not be retrieved for server %server.', $args));
      }
    }
    return $this->consumerPlugin;
  }

  /**
   * {@inheritdoc}
   */
  public function getConsumerConfig() {
    return $this->consumer_config;
  }

  /**
   * {@inheritdoc}
   */
  public function setConsumerConfig(array $consumer_config) {
    $this->consumer_config = $consumer_config;
    $this->getConsumer()->setConfiguration($consumer_config);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getConsumerMappings() {
    return $this->consumer_mappings;
  }

  /**
   * {@inheritdoc}
   */
  public function setConsumerMappings(array $consumer_mappings) {
    $this->consumer_mappings = $consumer_mappings;
    $this->getConsumer()->setConfiguration($consumer_mappings);
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function getTokens() {
    $tokens = array();
    $tokens['!profile_name'] = $this->label;
    return $tokens;
  }

  /**
   * {@inheritdoc}
   */
  public function checkConditions($user=NULL, $op=NULL) {
    // Check if the profile is enabled.
    if ( ! $this->get('status') ) {
      return FALSE;
    }
    // @TODO
    // Check other conditions.
    return TRUE;
  }

  /**
   * {@inheritdoc}
   */
  public function grantsAndRevokes($op=NULL, &$user=NULL, &$user_auth_data, $identifier=NULL, $user_save=TRUE) {
    $provider = $this->getProvider();
    $consumer = $this->getConsumer();
    $provider_mappings = $this->getProviderMappings();
    $consumer_mappings = $this->getConsumerMappings();

    // Provider Proposals are proposed authorizations (eg: groups)
    $proposals = $provider->getProposals($user, $op, $identifier);
    // @TODO Then they should be filtered or mapped by the mapping.
    //   Filtering is currently is done by the provider.
    //   To follow the old pattern it should be done in the profile.
    // Then applied to the Consumer.
    // @TODO In 7.x all the proposals were given to the consumer as a group.

    // Iterate through the mappings
    foreach ( $provider_mappings as $i => $provider_mapping ) {
      $consumer_mapping = $consumer_mappings[$i];
      $filtered_proposals = $provider->filterProposals($proposals, $op, $provider_mapping);
      if ( count($filtered_proposals) ) {
        $create = $this->get('synchronization_actions')['create_consumers'] ? TRUE : FALSE;
        $filtered_proposals = $provider->sanitizeProposals($filtered_proposals);
        $outgoing = $consumer->grantSingleAuthorization($user, $op, $filtered_proposals, $consumer_mapping, $user_auth_data, $user_save, $reset, $create);
      } else if ( $this->get('revoke_provider_provisioned') ) {
        $outgoing = $consumer->revokeSingleAuthorization($user, $op, $proposals, $consumer_mapping);
      }
      $needs_save = TRUE;
    }
    if ( $needs_save && $user_save ) {
      $user->save();
    }
    return array(array($this->label), array("Done with " . $this->label));
  }

}
