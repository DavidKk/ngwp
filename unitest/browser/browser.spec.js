/* eslint max-nested-callbacks: off */
/* eslint-env mocha */
/* global expect */

import angular from 'angular';
import 'angular-mocks';

import pname from 'app/home/index.js';

describe('Running In Browser', function () {
  describe('Base Module', function () {
    beforeEach(angular.mock.module(pname));

    it('can run the entry module', function () {
      expect(pname).to.equal('home');

      angular.mock.inject(function ($rootScope, $state, $location) {
        let state = $state.get(pname);
        expect(state.abstract).to.be.true;
        expect(state.template).to.be.a('function');

        $location.path('/');
        $rootScope.$apply();

        expect($location.path()).to.equal(`/${pname}/`);
      });
    });
  });
});
