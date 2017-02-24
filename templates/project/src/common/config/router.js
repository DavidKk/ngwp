import angular from 'angular';

export default angular.module('common.conf.router', [])
.config(function ($locationProvider, $urlRouterProvider) {
  /**
   * Lock UI-Router
   * As configure with ajax before parse url,
   * we must lock parsing first so that it can resolve
   * much async problems.
   *
   * Docs:
   * http://stackoverflow.com/questions/29012982/angularjs-ui-router-how-to-redirect-to-the-needed-state-after-adding-them-dy?answertab=active#tab-top
   */
  $urlRouterProvider.deferIntercept();

  /**
   * HTML5 Mode
   * Do not use hash.
   *
   * Docs:
   * https://docs.angularjs.org/api/ng/provider/$locationProvider
   */
  $locationProvider.html5Mode(true);

  /**
   * Auto add trailing slash after url.
   *
   * Example:
   * /path/to/url to be /path/to/url/
   */
  $urlRouterProvider.rule(function () {
    let docLocation      = document.location;
    let path             = docLocation.pathname;
    let hasTrailingSlash = '/' === path.substr(-1, 1);

    if (!hasTrailingSlash) {
      if (docLocation.search) {
        let index = path.indexOf('?');
        let full  = docLocation.href.replace(docLocation.origin, '');

        return `${path}/${full.substr(index, full.length)}`;
      }

      return `${path}/`;
    }
  });

  /**
   * Configure not match url.
   */
  $urlRouterProvider.otherwise(() => {
    let docLocation = document.location;
    let fromPath    = window.location.href;
    let fromName    = fromPath.split('\/').splice(1, 1).pop();
    let toUrl       = docLocation.href.replace(docLocation.origin, '');
    let toPath      = docLocation.pathname;
    let toName      = toPath.split('\/').splice(1, 1).pop();

    if (fromName && toName && fromName !== toName) {
      window.location.href = toUrl;
    }
  });
})
.name;
