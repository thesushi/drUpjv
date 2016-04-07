<?php

/**
 * @file
 * Contains \Drupal\authorization\AuthorizationProfileListBuilder.
 */

namespace Drupal\authorization;

use Drupal\Core\Config\Entity\ConfigEntityListBuilder;
use Drupal\Core\Entity\EntityInterface;

/**
 * Provides a listing of Authorization profile entities.
 */
class AuthorizationProfileListBuilder extends ConfigEntityListBuilder {
  /**
   * {@inheritdoc}
   */
  public function buildHeader() {
    $header['label'] = $this->t('Profile');
    // $header['id'] = $this->t('Machine name');
    $header['provider'] = $this->t('Provider');
    $header['consumer'] = $this->t('Consumer');
    $header['enabled'] = $this->t('Enabled');
    return $header + parent::buildHeader();
  }

  /**
   * {@inheritdoc}
   */
  public function buildRow(EntityInterface $entity) {
    $row['label'] = $this->getLabel($entity);
    $row['provider'] = $entity->get('provider');
    $row['consumer'] = $entity->get('consumer');
    $row['enabled'] = $entity->get('status') ? 'Yes' : 'No';
    // You probably want a few more properties here...
    return $row + parent::buildRow($entity);
  }

}
