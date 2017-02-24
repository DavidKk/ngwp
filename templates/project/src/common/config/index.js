import angular from 'angular';
import Core    from './core';
import Router  from './router';

export default angular.module('common.config', [
  Core,
  Router,
])
.name;
