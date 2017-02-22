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
import Component       from './components';
import Config          from './conf';
import Model           from './models';
import Bootstrap       from './bootstrap';

export default angular.module('common', [
  angularSanitize,
  UIRouter,
  ngTouch,

  Service,
  Filter,
  Component,
  Config,
  Model,
  Bootstrap,
])
.name;
