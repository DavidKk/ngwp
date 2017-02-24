import _       from 'lodash';
import angular from 'angular';

export default angular.module('conf.core', [])
/**
 * In AngularJS@1.5.9 (or some beta version), `$q.reject` will
 * throw error `Possibly unhandled rejection: {}`
 * We can use '$qProvider.errorOnUnhandledRejections(false)' ignore
 * this error
 *
 * version known
 * - ^1.5.8
 * - 1.5.5-pre-release
 *
 * issue:
 * https://github.com/angular-ui/ui-router/issues/2889
 * https://github.com/angular-ui/ui-router/issues/2699
 */
.config(function ($qProvider) {
  'ngInject';

  /**
   * As some version do not have this fucntion,
   * check function exists first
   */
  if ($qProvider && _.isFunction($qProvider.errorOnUnhandledRejections)) {
    $qProvider.errorOnUnhandledRejections(false);
  }
})
.name;
