<?php /**
 * @file
 * Contains \Drupal\authorization\EventSubscriber\LoginSubscriber.
 */

namespace Drupal\authorization\EventSubscriber;

use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class LoginSubscriber implements EventSubscriberInterface {

  public function onRequest() {

  }

  public function onLogin() {

  }

  /**
   * {@inheritdoc}
   */
  static function getSubscribedEvents() {
    $events[KernelEvents::REQUEST][] = array('onRequest');
    return $events;
  }

}
