'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _handlebars = require('handlebars');

var _handlebars2 = _interopRequireDefault(_handlebars);

var _config = require('../conf/config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pkgFile = _path2.default.join(_config.ROOT_PATH, './package.json');
var source = _fsExtra2.default.readJSONSync(pkgFile);

_commander2.default.version(source.version).on('--version', function () {
  console.log(source.version);
}).on('--help', function () {
  console.log('  Examples:');
  console.log('    # Create Module/Router');
  console.log('    $ generate router module/componentA/componentB/...');
  console.log('');
}).arguments('<cmd> [argv]').action(function (cmd, argv) {
  switch (cmd) {
    case 'router':
      generateRouter(argv);
      break;
  }
}).parse(process.argv);

/**
 * 创建模块与组件
 * @param  {String} argv 指令
 */
function generateRouter(argv) {
  var components = _lodash2.default.trim(argv, '\/').split('\/');
  var moduleName = components.shift();

  var moduleDir = _path2.default.join(_config.ENTRY_DIR, moduleName);
  if (generateModule(moduleName, { ingoreExists: false })) {
    (function () {
      var family = [moduleName];
      var dir = _path2.default.join(moduleDir, 'components');

      _lodash2.default.forEach(components, function (name) {
        if (false === generateComponent(name, family)) {
          return false;
        }

        family.push(name);
      });
    })();
  }
}

/**
 * 生成模块
 * @param  {string}  name    模块名称
 * @param  {Object}  datas   数据
 * @param  {Boolean} isForce 是否强制
 * @return {Boolean}
 */
function generateModule(name, options) {
  /**
   * 检查模板是否存在, 不存在则报错并退出
   * check moudle template exists and exist process when template not exists.
   */
  var templateDir = _path2.default.join(_config.ROOT_PATH, 'generator/templates/module');
  if (!_fsExtra2.default.existsSync(templateDir)) {
    logger('error', 'Module template is not found, see ' + _colors2.default.bold(templateDir) + '.');
    return false;
  }

  options = _lodash2.default.defaults(options, { ingoreExists: false });

  var names = convertName(name);
  var fileName = names.underscore;
  var moduleDir = _path2.default.join(_config.ENTRY_DIR, fileName);

  /**
   * 检查是否已经存在, 如果模块已经存在则直接退出
   * check module exists and exit process when file is exists.
   */
  if (_fsExtra2.default.existsSync(moduleDir)) {
    true !== options.ingoreExists && logger('warn', 'Module ' + _colors2.default.bold(name) + ' is already exists.');
    return true;
  }

  /**
   * 复制并渲染模板文件
   * copy and render file with data.
   */
  logger('Starting to generate ' + _colors2.default.bold(name) + ' module.');

  _fsExtra2.default.ensureDirSync(moduleDir);

  var templateFiles = _fsExtra2.default.readdirSync(templateDir);
  copyAndRender(templateFiles, { names: names }, templateDir, moduleDir);
  logger('info', 'Module ' + _colors2.default.bold(name) + ' is generated successfully.\n');

  return true;
}

/**
 * 创建组件
 * @param  {String} name   组件名称
 * @param  {Array}  family 模块关系
 * @param  {Object} datas  数据
 * @return {Boolean}
 */
function generateComponent(name, family, options) {
  /**
   * 检查模板是否存在, 不存在则报错并退出
   * check component template exists and exist process when template not exists.
   */
  var templateDir = _path2.default.join(_config.ROOT_PATH, 'generator/templates/component');
  if (!_fsExtra2.default.existsSync(templateDir)) {
    logger('error', 'Component template is not found, see ' + _colors2.default.bold(templateDir) + '.');
    return false;
  }

  options = _lodash2.default.defaults(options, { ingoreExists: false });

  var names = convertName(name);
  var pwd = _lodash2.default.map(family, function (name) {
    return name + '/components/';
  });

  var dist = _path2.default.join(_config.ENTRY_DIR, pwd.join('\/'), name);
  if (_fsExtra2.default.existsSync(dist)) {
    true !== options.ingoreExists && logger('warn', 'Component ' + _colors2.default.bold(name) + ' is already exists.');
    return true;
  }

  /**
   * 复制并渲染模板文件
   * copy and render file with data.
   */
  logger('Starting to generate ' + _colors2.default.bold(name) + ' component.');

  _fsExtra2.default.ensureDirSync(dist);

  var nsNames = _lodash2.default.map(family, convertName);
  var ns = {
    camelcase: _lodash2.default.map(nsNames, 'camelcase').join('.'),
    underscore: _lodash2.default.map(nsNames, 'underscore').join('/'),
    hyphen: _lodash2.default.map(nsNames, 'hyphen').join(' '),
    cssFamily: _lodash2.default.map(nsNames, function (_ref) {
      var hyphen = _ref.hyphen;

      return hyphen + '-viewport';
    })
  };

  var templateFiles = _fsExtra2.default.readdirSync(templateDir);
  copyAndRender(templateFiles, { names: names, ns: ns }, templateDir, dist);
  logger('info', 'Component ' + _colors2.default.bold(name) + ' is generated successfully.\n');

  return true;
}

/**
 * 复制并渲染
 * @param {Array}  files   文件集合
 * @param {Object} datas   渲染的数据
 * @param {String} fromDir 资源所在路径
 * @param {String} toDir   目标路径
 */
function copyAndRender(files) {
  var datas = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var fromDir = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
  var toDir = arguments.length <= 3 || arguments[3] === undefined ? '' : arguments[3];

  files.forEach(function (fileName) {
    var file = _path2.default.join(fromDir, fileName);

    /**
     * 判断文件目录是否为文件夹, 如果为文件夹则创建文件夹并将
     * 里面的文件全部复制到目标相应目录
     * 这里使用地推方法, 当所有文件都复制完毕会退出递归
     */
    if (_fsExtra2.default.statSync(file).isDirectory()) {
      var targetDir = _path2.default.join(toDir, fileName);
      _fsExtra2.default.ensureDirSync(targetDir);

      var others = _fsExtra2.default.readdirSync(file);
      copyAndRender(others, datas, file, targetDir);
      return;
    }

    /**
     * 模板文件不是 handlebars 文件则退出,
     * 目前暂只支持 handlebars 的模板引擎.
     */
    if ('.hbs' !== _path2.default.extname(file)) {
      return false;
    }

    /**
     * 如果目标文件已经存在, 则退出不做任何操作,
     * 因此请确定文件是否存在, 若存在则无办法继续执行复制.
     */
    var targetFile = _path2.default.join(toDir, fileName);
    if (_fsExtra2.default.existsSync(targetFile)) {
      logger('warn', 'File ' + _colors2.default.bold(targetFile) + ' is already exists.');
      return false;
    }

    /**
     * 编译文件并保存到相应的文件目录
     */
    var template = _fsExtra2.default.readFileSync(file, 'utf-8');
    var fn = _handlebars2.default.compile(template);
    var source = fn(datas);
    var doneFile = targetFile.replace(_path2.default.extname(targetFile), '');

    _fsExtra2.default.writeFileSync(doneFile, source);
    logger(_colors2.default.bold(doneFile) + ' is generated successfully.');
  });
}

/**
 * 转化名字
 * @param  {String} name 名字
 * @return {Object}
 * @description
 * 将名字转化成各种格式名字包括 "-", "_", "camelName", "NAME", "name"
 * "-" 一般给 class 使用
 * "_" 一般给 filename
 * "camelName" 一般给JS使用
 */
function convertName(name) {
  var camelcase = name.replace(/[- _]([\w])/g, function ($all, $1) {
    return $1.toUpperCase();
  }).replace(/^[A-Z]/, function ($all) {
    return $all.toLowerCase();
  });

  var underscore = camelcase.replace(/[A-Z]/g, function ($all) {
    return '_' + $all.toLowerCase();
  });

  var hyphen = camelcase.replace(/[A-Z]/g, function ($all) {
    return '-' + $all.toLowerCase();
  });

  var blank = camelcase.replace(/[A-Z]/g, function ($all) {
    return ' ' + $all.toLowerCase();
  }).replace(/^[a-z]/, function ($all) {
    return $all.toUpperCase();
  });

  var upCamelcase = camelcase.replace(/^[a-z]/, function ($all) {
    return $all.toUpperCase();
  });

  return {
    camelcase: camelcase,
    upCamelcase: upCamelcase,
    underscore: underscore,
    hyphen: hyphen,
    blank: blank
  };
}

/**
 * log
 * @param  {String} type    类型
 * @param  {String} content 内容
 */
function logger(type, content) {
  if (2 > arguments.length) {
    return logger(null, type);
  }

  switch (type) {
    case 'info':
      content = _colors2.default.green(content);
      break;
    case 'warn':
      content = _colors2.default.yellow(content);
      break;
    case 'error':
      content = _colors2.default.red(content);
      break;
  }

  console.log('[' + _colors2.default.cyan('Generator') + '] ' + content);
}
//# sourceMappingURL=module.js.map