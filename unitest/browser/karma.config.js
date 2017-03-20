import path              from 'path';
import { TARGET_FOLDER } from './variables';
import * as VARS         from '../../src/conf/variables';
import webpackConf       from './webpack.config';

module.exports = function (config) {
  let entryFile = path.join(__dirname, 'browser.spec.js');

  config.set({
    basePath   : TARGET_FOLDER,
    browsers   : ['PhantomJS'],
    frameworks : ['mocha', 'chai', 'sinon'],
    files      : [entryFile],
    client     : {
      captureConsole: true,
      chai: {
        includeStack: true,
      },
    },
    reporters: [
      'mocha',
      'coverage',
    ],
    preprocessors: {
      [entryFile]: [
        'webpack',
        'sourcemap',
      ],
    },
    coverageReporter: {
      type   : 'lcov',
      subdir : '.',
      dir    : path.join(VARS.ROOT_PATH, VARS.COVERAGE_FOLDER_NAME, 'browser'),
    },
    webpack: webpackConf,
    webpackMiddleware: {
      noInfo : false,
      stats  : true,
    },
    failOnEmptyTestSuite : false,
    colors               : true,
    autoWatch            : false,
    singleRun            : true,
    plugins              : [
      'karma-phantomjs-launcher',
      'karma-webpack',
      'karma-chai',
      'karma-sinon',
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-sourcemap-loader',
      'karma-coverage',
    ],
  });
};
