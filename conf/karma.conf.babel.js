import fs                 from 'fs-extra';
import path               from 'path';
import webpackConf        from './webpack.unitest.config.babel';
import { CallbackPlugin } from './webpack.common.config.babel';
import {
  ROOT_PATH,
  SRC_DIR,
  TEST_DIR,
  TMP_DIR,
  COVERAGE_DIR,
}                         from './config';

/**
 * Unified entrance
 * find out all files end in '.spec.js'
 * import these files to the entrance,
 * because karma will split different
 * modules and sessions.
 * And it will excute webpack compile for once.
 */
const TEST_ENTRY = path.join(ROOT_PATH, TMP_DIR, TEST_DIR, SRC_DIR, '.bootstrap.spec.js');
const TEST_DIR   = path.join(ROOT_PATH, TEST_DIR, SRC_DIR);

let specFiles  = findFiles(TEST_DIR, /^[^\.]+\.spec\.js$/);
let depsSource = specFiles.map(function (file) {
  return `import '${file}';\n`;
})
.join('');

fs.ensureFileSync(TEST_ENTRY);
fs.writeFileSync(TEST_ENTRY, depsSource);

export default function (config) {
  config.set({
    browsers   : ['PhantomJS'],
    frameworks : ['mocha', 'chai', 'sinon'],
    files      : [
      TEST_ENTRY,
    ],
    client: {
      chai: {
        includeStack: true,
      },
    },
    reporters: [
      'mocha',
      'coverage',
    ],
    preprocessors: {
      [TEST_ENTRY]: [
        'webpack',
      ],
      [`${TEST_DIR}/**/*.spec.js`]: [
        'webpack',
        'sourcemap',
      ],
    },
    coverageReporter: {
      type : 'html',
      dir  : COVERAGE_DIR,
    },
    webpack: webpackConf,
    webpackMiddleware: {
      noInfo : false,
      stats  : 'errors-only',
    },
    autoWatch : false,
    singleRun : true,
    plugins   : [
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
}

/**
 * find out scripts files
 * @param  {String} dir    test folder
 * @param  {Regexp} regexp match regexp
 * @param  {Array}  files  output files variables
 * @return {Array}
 */
function findFiles (dir, regexp, files = []) {
  fs
  .readdirSync(dir)
  .forEach((name) => {
    let file = path.join(dir, name);

    if (fs.statSync(file).isDirectory()) {
      findFiles(file, regexp, files);
    }
    else if (regexp instanceof RegExp) {
      regexp.test(name) && files.push(file);
    }
    else {
      files.push(file);
    }
  });

  return files;
}
