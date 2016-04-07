<?php

/**
 * @file
 * Contains \Drupal\authorization\Form\AuthorizationProfileForm.
 */

namespace Drupal\authorization\Form;

use Drupal\Component\Utility\Html;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\Entity\EntityForm;
use Drupal\Core\Entity\EntityManagerInterface;
use Drupal\Core\Form\FormStateInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

use Drupal\authorization\AuthorizationProfileInterface;
use Drupal\authorization\Provider\ProviderPluginManager;
use Drupal\authorization\Consumer\ConsumerPluginManager;

/**
 * Class AuthorizationProfileForm.
 *
 * @package Drupal\authorization\Form
 */
class AuthorizationProfileForm extends EntityForm {

  /**
   * Constructs a AuthorizationProfileForm object.
   *
   * @param \Drupal\Core\Entity\EntityManagerInterface $entity_manager
   *   The entity manager.
   * @param \Drupal\authorization\Provider\ProviderPluginManager $provider_plugin_manager
   *   The Provider plugin manager.
   * @param \Drupal\authorization\Consumer\ConsumerPluginManager $consumer_plugin_manager
   *   The Consumer plugin manager.
   */
  public function __construct(EntityManagerInterface $entity_manager, ProviderPluginManager $provider_plugin_manager, ConsumerPluginManager $consumer_plugin_manager) {
    $this->storage = $entity_manager->getStorage('authorization_profile');
    $this->ProviderPluginManager = $provider_plugin_manager;
    $this->ConsumerPluginManager = $consumer_plugin_manager;
    // if ( $this->ConsumerPluginManager->allowConsumerTargetCreation() ) {
    //   drupal_set_message("Can create objects");
    // } else {
    //   drupal_set_message("Can't create objects", "error");
    // }
  }


  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    /** @var \Drupal\Core\Entity\EntityManagerInterface $entity_manager */
    $entity_manager = $container->get('entity.manager');
    /** @var \Drupal\authorization\Backend\BackendPluginManager $backend_plugin_manager */
    $provider_plugin_manager = $container->get('plugin.manager.authorization.provider');
    $consumer_plugin_manager = $container->get('plugin.manager.authorization.consumer');
    return new static($entity_manager, $provider_plugin_manager, $consumer_plugin_manager);
  }

  /**
   * Retrieves the Provider plugin manager.
   *
   * @return \Drupal\authorization\Provider\ProviderPluginManager
   *   The Provider plugin manager.
   */
  protected function getProviderPluginManager() {
    return $this->providerPluginManager ?: \Drupal::service('plugin.manager.authorization.provider');
  }

  /**
   * Retrieves the Consumer plugin manager.
   *
   * @return \Drupal\authorization\Consumer\ConsumerPluginManager
   *   The Consumer plugin manager.
   */
  protected function getConsumerPluginManager() {
    return $this->consumerPluginManager ?: \Drupal::service('plugin.manager.authorization.consumer');
  }

  /**
   * {@inheritdoc}
   */
  public function form(array $form, FormStateInterface $form_state) {
    $form = parent::form($form, $form_state);

    $authorization_profile = $this->entity;

    $this->buildEntityForm($form, $form_state, $authorization_profile);
    // Skip adding the plugin config forms if we cleared the server form due to
    // an error.
    if ($form) {
      $this->buildProviderConfigForm($form, $form_state, $authorization_profile);
      $this->buildConsumerConfigForm($form, $form_state, $authorization_profile);
      $this->buildConditionsForm($form, $form_state, $authorization_profile);
      $this->buildMappingForm($form, $form_state, $authorization_profile);
      $form['#prefix'] = "<div id='authorization-profile-form'>";
      $form['#suffix'] = "</div>";
    }

    return $form;
  }


  /**
   * Builds the form for the basic server properties.
   *
   * @param \Drupal\authorization\AuthorizationProfileInterface $authorization_profile
   *   The profile that is being created or edited.
   */
  public function buildEntityForm(array &$form, FormStateInterface $form_state, AuthorizationProfileInterface $authorization_profile) {
    $form['label'] = array(
      '#type' => 'textfield',
      '#title' => $this->t('Label'),
      '#maxlength' => 255,
      '#default_value' => $authorization_profile->label(),
      '#description' => $this->t("Label for the Authorization profile."),
      '#required' => TRUE,
    );

    $form['id'] = array(
      '#type' => 'machine_name',
      '#default_value' => $authorization_profile->id(),
      '#machine_name' => array(
        'exists' => '\Drupal\authorization\Entity\AuthorizationProfile::load',
      ),
      '#disabled' => !$authorization_profile->isNew(),
    );

    /* You will need additional form elements for your custom properties. */
    $form['status'] = array(
      '#type' => 'checkbox',
      '#title' => $this->t('Enabled'),
      '#default_value' => $authorization_profile->get('status'),
      '#description' => $this->t("Enable this profile."),
    );

    $provider_options = $this->getProviderOptions();
    if ($provider_options) {
      if (count($provider_options) == 1) {
        $authorization_profile->set('provider', key($provider_options));
      }
      // Once we've chosen one we can't change our minds
      if ( $authorization_profile->getProviderId() ) {
        $disabled = TRUE;
      } else {
        $disabled = FALSE;
      }
      $form['provider'] = array(
        '#type' => 'radios',
        '#title' => $this->t('Provider'),
        '#description' => $this->t('Choose an authorization provider to use for this profile.'),
        '#options' => $provider_options,
        '#default_value' => $authorization_profile->getProviderId(),
        '#required' => TRUE,
        '#disabled' => $disabled,
        '#ajax' => array(
          'callback' => array(get_class($this), 'buildAjaxProviderConfigForm'),
          'wrapper' => 'authorization-profile-form',
          'method' => 'replace',
          'effect' => 'fade',
        ),
      );
    }
    else {
      drupal_set_message($this->t('There are no provider plugins available for the Authorization.'), 'error');
      $form = array();
    }

    $consumer_options = $this->getConsumerOptions();
    if ($consumer_options) {
      if (count($consumer_options) == 1) {
        $authorization_profile->set('consumer', key($consumer_options));
      }
      if ( $authorization_profile->getConsumerId() && !$authorization_profile->isNew()) {
        $disabled = TRUE;
      } else {
        $disabled = FALSE;
      }
      $form['consumer'] = array(
        '#type' => 'radios',
        '#title' => $this->t('Consumer'),
        '#description' => $this->t('Choose a consumer to use with this profile.'),
        '#options' => $consumer_options,
        '#default_value' => $authorization_profile->getConsumerId(),
        '#required' => TRUE,
        '#disabled' => $disabled,
        '#ajax' => array(
          'callback' => array(get_class($this), 'buildAjaxConsumerConfigForm'),
          'wrapper' => 'authorization-profile-form',
          'method' => 'replace',
          'effect' => 'fade',
        ),
      );
    }
    else {
      drupal_set_message($this->t('There are no consumer plugins available for the Authorization.'), 'error');
      $form = array();
    }
  }

  /**
   * Returns all available Provider plugins, as an options list.
   *
   * @return string[]
   *   An associative array mapping Provider plugin IDs to their (HTML-escaped)
   *   labels.
   */
  protected function getProviderOptions() {
    $options = array();
    foreach ($this->getProviderPluginManager()->getDefinitions() as $plugin_id => $plugin_definition) {
      $options[$plugin_id] = Html::escape($plugin_definition['label']);
    }
    return $options;
  }


  /**
   * Builds the provider-specific configuration form.
   *
   * @param \Drupal\authorization\AuthorizationProfileInterface $authorization_profile
   *   The profile that is being created or edited.
   */
  public function buildProviderConfigForm(array &$form, FormStateInterface $form_state, AuthorizationProfileInterface $authorization_profile) {
    $form['provider_config'] = array(
      '#type' => 'container',
      '#attributes' => array(
        'id' => 'authorization-provider-config-form',
      ),
      '#tree' => TRUE,
    );

    if ($authorization_profile->hasValidProvider()) {
      $provider = $authorization_profile->getProvider();
      if (($provider_form = $provider->buildConfigurationForm(array(), $form_state))) {
        // If the provider plugin changed, notify the user.
        if (!empty($form_state->getValues()['provider'])) {
          drupal_set_message($this->t('Please configure the used provider_form.'), 'warning');
        }

        // Modify the provider plugin configuration container element.
        $form['provider_config']['#type'] = 'details';
        $form['provider_config']['#title'] = $this->t('Configure %plugin provider', array('%plugin' => $provider->label()));
        $form['provider_config']['#description'] = $provider->getDescription();
        $form['provider_config']['#open'] = TRUE;
        // Attach the provider plugin configuration form.
        $form['provider_config'] += $provider_form;
      }
    }
    // Only notify the user of a missing provider plugin if we're editing an
    // existing server.
    elseif (!$authorization_profile->isNew()) {
      drupal_set_message($this->t('The provider plugin is missing or invalid.'), 'error');
    }
  }

  /**
   * Builds the consumer-specific configuration form.
   *
   * @param \Drupal\authorization\AuthorizationProfileInterface $authorization_profile
   *   The profile that is being created or edited.
   */
  public function buildConsumerConfigForm(array &$form, FormStateInterface $form_state, AuthorizationProfileInterface $authorization_profile) {
    $form['consumer_config'] = array(
      '#type' => 'container',
      '#attributes' => array(
        'id' => 'authorization-consumer-config-form',
      ),
      '#tree' => TRUE,
    );

    if ($authorization_profile->hasValidConsumer()) {
      $consumer = $authorization_profile->getConsumer();
      if (($consumer_form = $consumer->buildConfigurationForm(array(), $form_state))) {
        // If the consumer plugin changed, notify the user.
        if (!empty($form_state->getValues()['consumer'])) {
          drupal_set_message($this->t('Please configure the used consumer_form.'), 'warning');
        }

        // Modify the consumer plugin configuration container element.
        $form['consumer_config']['#type'] = 'details';
        $form['consumer_config']['#title'] = $this->t('Configure %plugin consumer', array('%plugin' => $consumer->label()));
        $form['consumer_config']['#description'] = $consumer->getDescription();
        $form['consumer_config']['#open'] = TRUE;
        // Attach the consumer plugin configuration form.
        $form['consumer_config'] += $consumer_form;
      }
    }
    // Only notify the user of a missing consumer plugin if we're editing an
    // existing server.
    elseif (!$authorization_profile->isNew()) {
      drupal_set_message($this->t('The consumer plugin is missing or invalid.'), 'error');
    }
  }

  /**
   * Returns all available Consumer plugins, as an options list.
   *
   * @return string[]
   *   An associative array mapping Consumer plugin IDs to their (HTML-escaped)
   *   labels.
   */
  protected function getConsumerOptions() {
    $options = array();
    foreach ($this->getConsumerPluginManager()->getDefinitions() as $plugin_id => $plugin_definition) {
      $options[$plugin_id] = Html::escape($plugin_definition['label']);
    }
    return $options;
  }


  /**
   * Handles switching the selected provider plugin.
   */
  public static function buildAjaxProviderConfigForm(array $form, FormStateInterface $form_state) {
    // The work is already done in form(), where we rebuild the entity according
    // to the current form values and then create the provider configuration form
    // based on that. So we just need to return the relevant part of the form
    // here.
    return $form;
  }

  /**
   * Handles switching the selected provider plugin.
   */
  public static function buildAjaxProviderRowForm(array $form, FormStateInterface $form_state) {
    return $form['provider_mappings'];
  }

  /**
   * Handles switching the selected consumer plugin.
   */
  public static function buildAjaxConsumerConfigForm(array $form, FormStateInterface $form_state) {
    // The work is already done in form(), where we rebuild the entity according
    // to the current form values and then create the consumer configuration form
    // based on that. So we just need to return the relevant part of the form
    // here.
    return $form;
  }

  /**
   * Handles switching the selected consumer plugin.
   */
  public static function buildAjaxConsumerRowForm(array $form, FormStateInterface $form_state) {
    return $form['consumer_mappings'];
  }

  public function buildConditionsForm(array &$form, FormStateInterface $form_state, AuthorizationProfileInterface $authorization_profile) {
    if ( ! $authorization_profile->hasValidProvider() || ! $authorization_profile->hasValidConsumer() ) {
      return;
    }
    if ( ! $this->provider ) {
      $this->provider = $authorization_profile->getProvider();
    }
    if ( ! $this->consumer ) {
      $this->consumer = $authorization_profile->getConsumer();
    }

    $tokens = array();

    $tokens += $authorization_profile->getProvider()->getTokens();
    $tokens += $authorization_profile->getConsumer()->getTokens();

    $form['conditions'] = array(
      '#type' => 'details',
      '#title' => t('Configure conditions'),
      '#open' => TRUE,
    );

    $synchronization_modes = array();
    if ($this->synchOnLogon)  {
      $synchronization_modes[] = 'user_logon';
    }

    $form['conditions']['synchronization_modes'] = array(
      '#type' => 'checkboxes',
      '#title' => t('When should <em>!consumer_namePlural</em> be granted/revoked from user?', $tokens),
      '#options' => array(
          'user_logon' => t('When a user logs on via <em>!provider_name</em>.', $tokens),
      ),
      '#default_value' => $authorization_profile->get('synchronization_modes'),
      '#description' => '',
    );

    $synchronization_actions = array();
    if ($this->provider->revokeProviderProvisioned)  {
      $synchronization_actions[] = 'revoke_provider_provisioned';
    }
    if ($this->consumer->createConsumerTargets())  {
      $synchronization_actions[] = 'create_consumers';
    }
    if ($this->provider->regrantProviderProvisioned)  {
      $synchronization_actions[] = 'regrant_provider_provisioned';
    }

    $options =  array(
      'revoke_provider_provisioned' => t('Revoke <em>!consumer_namePlural</em> previously granted by <em>!provider_name</em> but no longer valid.', $tokens),
      'regrant_provider_provisioned' => t('Re grant <em>!consumer_namePlural</em> previously granted by <em>!provider_name</em> but removed manually.', $tokens),
    );
    if ($this->consumer->allowConsumerTargetCreation) {
      $options['create_consumers'] = t('Create <em>!consumer_namePlural</em> if they do not exist.', $tokens);
    }

    $form['conditions']['synchronization_actions'] = array(
      '#type' => 'checkboxes',
      '#title' => t('What actions would you like performed when <em>!consumer_namePlural</em> are granted/revoked from user?', $tokens),
      '#options' => $options,
      '#default_value' => $authorization_profile->get('synchronization_actions'),
    );
    /**
     * @todo  some general options for an individual mapping (perhaps in an advance tab).
     *
     * - on synchronization allow: revoking authorizations made by this module, authorizations made outside of this module
     * - on synchronization create authorization contexts not in existance when needed (drupal roles etc)
     * - synchronize actual authorizations (not cached) when granting authorizations
     */
  }

  public function buildMappingForm(array &$form, FormStateInterface $form_state, AuthorizationProfileInterface $authorization_profile) {
    if (
      ( $authorization_profile->hasValidProvider() || $form_state->getValue('provider') )
      &&
      ($authorization_profile->hasValidConsumer()  || $form_state->getValue('consumer') )
    ) {
      $provider = $authorization_profile->getProvider();
      $consumer = $authorization_profile->getConsumer();

      $tokens = array();

      $tokens += $provider->getTokens();
      $tokens += $consumer->getTokens();

      $form['mappings'] = array(
        '#type' => 'table',
        '#responsive' => TRUE,
        '#weight' => 100,
        '#title' => t('Configure mapping from !provider_name to !consumer_name', $tokens),
        '#header' => array($provider->label(), $consumer->label()),
        '#footer' => 'foo',
      );

      for ( $i = 0; $i <= 4; $i++ ) {
        $provider_row_form = $provider->buildRowForm($form, $form_state, $i);
        $form['mappings'][$i]['provider_mappings'] = $provider_row_form;
        $consumer_row_form = $consumer->buildRowForm($form, $form_state, $i);
        $form['mappings'][$i]['consumer_mappings'] = $consumer_row_form;
      }

      $form['mappings_provider_help'] = array(
        '#type' => 'markup',
        '#markup' => $provider->buildRowDescription($form, $form_state),
        '#weight' => 101,
      );
      $form['mappings_consumer_help'] = array(
        '#type' => 'markup',
        '#markup' => $consumer->buildRowDescription($form, $form_state),
        '#weight' => 102,
      );
    }
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    parent::validateForm($form, $form_state);
    $authorization_profile = $this->getEntity();

    $provider_id = $authorization_profile->getProviderId();
    // Only when the profile is new. Afterward we can't change provider.
    if ($provider_id !== $form_state->getValues()['provider']) {
      $input = $form_state->getUserInput();
      $input['provider_config'] = array();
      $form_state->set('input', $input);
    }
    elseif ($form['provider_config']['#type'] == 'details' && $authorization_profile->hasValidProvider()) {
      $provider_form_state = new SubFormState($form_state, array('provider_config'));
      $authorization_profile->getProvider()->validateConfigurationForm($form['provider_config'], $provider_form_state);
    }

    $consumer_id = $authorization_profile->getConsumerId();
    // Only when the profile is new. Afterward we can't change consumer.
    if ($consumer_id !== $form_state->getValues()['consumer']) {
      $input = $form_state->getUserInput();
      $input['consumer_config'] = array();
      $form_state->set('input', $input);
    }
    elseif ($form['consumer_config']['#type'] == 'details' && $authorization_profile->hasValidConsumer()) {
      $consumer_form_state = new SubFormState($form_state, array('consumer_config'));
      $authorization_profile->getConsumer()->validateConfigurationForm($form['consumer_config'], $consumer_form_state);
    }

  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    parent::submitForm($form, $form_state);

    /** @var \Drupal\search_api\ServerInterface $server */
    $authorization_profile = $this->getEntity();
    // Check before loading the provider plugin so we don't throw an exception.
    if ($form['provider_config']['#type'] == 'details' && $authorization_profile->hasValidProvider()) {
      $provider_form_state = new SubFormState($form_state, array('provider_config'));
      $authorization_profile->getProvider()->submitConfigurationForm($form['provider_config'], $provider_form_state);
    }
    // Check before loading the consumer plugin so we don't throw an exception.
    if ($form['consumer_config']['#type'] == 'details' && $authorization_profile->hasValidConsumer()) {
      $consumer_form_state = new SubFormState($form_state, array('consumer_config'));
      $authorization_profile->getConsumer()->submitConfigurationForm($form['consumer_config'], $consumer_form_state);
    }
    // @TODO Submit Row forms
    if ( $form['mappings'] ) {
      $mappings_form_state = new SubFormState($form_state, array('mappings'));
      $authorization_profile->getConsumer()->submitRowForm($form['mappings'], $mappings_form_state);
      $authorization_profile->getProvider()->submitRowForm($form['mappings'], $mappings_form_state);

      // Move provider_mappings to the top level
      // @TODO fix this. Why do we have to do it? Why doesn't it work?
      $values = $form_state->getValues();
      
      $values['provider_mappings'] = $values['mappings']['provider_mappings'];
      unset($values['mappings']['provider_mappings']);
      $values['consumer_mappings'] = $values['mappings']['consumer_mappings'];
      unset($values['mappings']['consumer_mappings']);
      $form_state->setValues($values);

      // @TODO shouldn't have to do this. Though the above doesn't work either.
      // @TODO should validate beforehand to make sure that we have mappings.
      if ( $values['provider_mappings'] ) {
        $authorization_profile->setProviderMappings($values['provider_mappings']);
      }
      if ( $values['consumer_mappings'] ) {
        $authorization_profile->setConsumerMappings($values['consumer_mappings']);
      }
    }

    return $authorization_profile;
  }

  /**
   * {@inheritdoc}
   */
  public function save(array $form, FormStateInterface $form_state) {
    $authorization_profile = $this->entity;
    $status = $authorization_profile->save();

    switch ($status) {
      case SAVED_NEW:
        drupal_set_message($this->t('Created the %label Authorization profile.', [
          '%label' => $authorization_profile->label(),
        ]));
        break;

      default:
        drupal_set_message($this->t('Saved the %label Authorization profile.', [
          '%label' => $authorization_profile->label(),
        ]));
    }
    $form_state->setRedirectUrl($authorization_profile->urlInfo('collection'));
  }

}
