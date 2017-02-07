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
 * 统一入口
 * 通过查找 spec.js 结尾的文件
 * 获取所有的测试用例文件
 * 然后通过统一入口加载到文件中
 * 否则 karma 配置项 files 中
 * 每一个匹配的文件都会各自执行一次
 * webpack 打包
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
