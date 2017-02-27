import 'lodash';
import angular         from 'angular';

// Vendors
import angularSanitize from 'angular-sanitize';
import UIRouter        from 'angular-ui-router';
import ngTouch         from 'angular-touch';

// Helpers
import './spreads';

// Public
import Service         from './services';
import Filter          from './filters';
import Config          from './config';

export default angular.module('library', [
  angularSanitize,
  UIRouter,
  ngTouch,

  Service,
  Filter,
  Config,
])
.name;
