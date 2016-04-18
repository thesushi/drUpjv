<?php

/**
 * @file
 * Contains \Drupal\xmlsitemap\Controller\XmlSitemapController.
 */

namespace Drupal\xmlsitemap_engines_test\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Drupal\Component\Utility\UrlHelper;

/**
 * Returns responses for xmlsitemap_engines_test.ping route.
 */
class XmlSitemapEnginesTestController extends ControllerBase {

  /**
   * Response for the xmlsitemap_engines_test.ping route.
   *
   * @throws NotFoundHttpException
   *   Throw a NotFoundHttpException if query url is not valid.
   *
   * @return \Symfony\Component\HttpFoundation\Response
   *   A response with 200 code if the url query is valid.
   */
  public function render() {
    $query = \Drupal::request()->query->get('sitemap');
    if (empty($query) || !UrlHelper::isValid($query)) {
      $message = t('No valid sitemap parameter provided.');
      \Drupal::logger('xmlsitemap')->debug($message);
      // @todo Remove this? Causes an extra watchdog error to be handled.
      throw new NotFoundHttpException();
    }
    else {
      $message = t('Recieved ping for @sitemap.', array('@sitemap' => $query));
      \Drupal::logger('xmlsitemap')->debug($message);
    }
    return new Response('', 200);
  }

}
