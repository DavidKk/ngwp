import 'lodash';
import angular         from 'angular';

// 第三方库
import angularSanitize from 'angular-sanitize';
import UIRouter        from 'angular-ui-router';
import ngTouch         from 'angular-touch';

// 辅助函数
import './spreads';

// 公共库
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
