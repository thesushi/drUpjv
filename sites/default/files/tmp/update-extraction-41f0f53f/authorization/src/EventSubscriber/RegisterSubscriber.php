<?php /**
 * @file
 * Contains \Drupal\authorization\EventSubscriber\RegisterSubscriber.
 */

namespace Drupal\authorization\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Drupal\externalauth\Event\ExternalAuthEvents;

class RegisterSubscriber implements EventSubscriberInterface {

  public function onRegister() {

  }

  /**
   * {@inheritdoc}
   */
  static function getSubscribedEvents() {
    $events[ExternalAuthEvents::REGISTER][] = array('onRegister');
    return $events;
  }

}
