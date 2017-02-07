'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = function (_ref) {
  var LOG_PATH = _ref.LOG_PATH;
  var ROOT_PATH = _ref.ROOT_PATH;
  var DIST_PATH = _ref.DIST_PATH;
  var MODULES = _ref.MODULES;

  var TMPL_FILE = _path2.default.join(ROOT_PATH, 'generator/templates/vhosts/nginx.conf.hbs');
  var OUTPUT_FILE = _path2.default.join(ROOT_PATH, 'vhosts/nginx.conf');

  var template = _fsExtra2.default.readFileSync(TMPL_FILE, 'utf-8');
  var fn = _handlebars2.default.compile(template);

  var exists = [];
  var datas = MODULES.filter(function (row) {
    if (-1 !== _lodash2.default.indexOf(exists, row.domain)) {
      console.error(('Module ' + row.domain + ' is already exists.').red);
      return false;
    }

    if (!_lodash2.default.isString(row.domain) && !_lodash2.default.isArray(row.domain)) {
      console.error('Module domain must be a string or array'.red);
      return false;
    }

    if ('proxy' === row.type) {
      if (!(_lodash2.default.isArray(row.entries) && row.entries.length > 0)) {
        console.error('Entries must be a array, and size not less than 1.'.red);
        return false;
      }

      if (!(_lodash2.default.isString(row.proxy) && /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.exec(row.proxy))) {
        console.warn('Proxy is requied, and must be proxy ip address. it would auto set proxy to 127.0.0.1'.yellow);
        row.proxy = '127.0.0.1';
      }

      if (!_lodash2.default.isNumber(row.proxyPort)) {
        console.warn('Proxy port is requied, and must be a number it would auto set proxy port to 3030'.yellow);
        row.proxyPort = 3030;
      }
    }

    if (_lodash2.default.isArray(row.domain)) {
      _lodash2.default.forEach(row.domain, function (domain) {
        console.log(('Server config ' + domain + ' is ok.\n').green);
      });
    } else {
      console.log(('Server config ' + row.domain + ' is ok.\n').green);
    }

    exists.push(row.domain);
    return true;
  }).map(function (row) {
    if (_lodash2.default.isArray(row.entries)) {
      return Object.assign({}, row, {
        division: row.entries.join('|')
      });
    }

    return row;
  });

  var logsDir = _path2.default.join(ROOT_PATH, LOG_PATH);
  _fsExtra2.default.ensureDirSync(logsDir);

  var source = fn({
    rootDir: _path2.default.join(ROOT_PATH, DIST_PATH),
    logsDir: logsDir,
    modules: datas
  });

  _fsExtra2.default.ensureDir(OUTPUT_FILE.replace(_path2.default.basename(OUTPUT_FILE), ''));
  _fsExtra2.default.writeFileSync(OUTPUT_FILE, source);

  console.log(('Nginx config file ' + OUTPUT_FILE + ' is generated successfully').green);
  console.log('Remember reload/restart yr nginx server.'.yellow);
};

require('colors');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _handlebars = require('handlebars');

var _handlebars2 = _interopRequireDefault(_handlebars);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_handlebars2.default.registerHelper('compare', function (lvalue, operator, rvalue, options) {
  var operators = void 0;
  var result = void 0;

  if (3 > arguments.length) {
    throw new Error('Handlerbars Helper "compare" needs 2 parameters');
  }

  if (undefined === options) {
    options = rvalue;
    rvalue = operator;
    operator = '===';
  }

  operators = {
    '==': function _(l, r) {
      return l == r;
    },
    '===': function _(l, r) {
      return l === r;
    },
    '!=': function _(l, r) {
      return l != r;
    },
    '!==': function _(l, r) {
      return l !== r;
    },
    '<': function _(l, r) {
      return l < r;
    },
    '>': function _(l, r) {
      return l > r;
    },
    '<=': function _(l, r) {
      return l <= r;
    },
    '>=': function _(l, r) {
      return l >= r;
    },
    'typeof': function _typeof(l, r) {
      return (typeof l === 'undefined' ? 'undefined' : _typeof2(l)) == r;
    }
  };

  if (!operators[operator]) {
    throw new Error('Handlerbars Helper \'compare\' doesn\'t know the operator ' + operator);
  }

  result = operators[operator](lvalue, rvalue);
  return result ? options.fn(this) : options.inverse(this);
});

_handlebars2.default.registerHelper('domain', function (value) {
  if (_lodash2.default.isString(value)) {
    return value;
  }

  if (_lodash2.default.isArray(value)) {
    return value.join(' ');
  }
});
//# sourceMappingURL=vhosts.js.map