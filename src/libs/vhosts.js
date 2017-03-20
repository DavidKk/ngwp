import _            from 'lodash';
import fs           from 'fs-extra';
import path         from 'path';
import handlebars   from 'handlebars';
import * as utils   from '../libs/utils';
import * as VARS    from '../conf/variables';
import OptionMerger from './option_merger';

/**
 * Register Handlebars helpers
 * @docs: http://handlebarsjs.com/block_helpers.html
 */

/**
 * Compare number and type-equals with variables
 */
handlebars.registerHelper('compare', compare);

/**
 * Separate Array to some string.
 * [value1, value2, value3] => 'value1 value2 value3';
 */
handlebars.registerHelper('separate', separate);

/**
 * build nginx vhosts
 * @param  {Array}    modules  module setting
 * @param  {Object}   options  setting
 * @param  {Function} callback result callback function
 */
export function mkVhost (modules, options, callback) {
  if (!_.isFunction(callback)) {
    throw new Error('Callback is not provided.');
  }

  let basePath = options.basePath || process.cwd();

  options = _.defaultsDeep(options, {
    trace    : false,

    distFile : path.join(basePath, 'vhosts/nginx.conf'),
    template : path.join(OptionMerger.EXEC_PATH, './templates/vhosts/nginx.conf.hbs'),
    rootPath : path.join(basePath, VARS.DISTRICT_FOLDER_NAME),
    logsPath : path.join(basePath, VARS.LOGGER_FOLDER_NAME),
    useHttps : _.isBoolean(options.useHttps) ? options.useHttps : false,
  });

  if (!fs.existsSync(options.template)) {
    callback(new Error(`Template '${options.template}' is not exists.`));
    return;
  }

  let template = fs.readFileSync(options.template, 'utf-8');
  let compile  = handlebars.compile(template);

  modules = _.cloneDeep(modules);

  for (let module of modules) {
    if (!(_.isString(module.domain) || _.isArray(module.domain)) && _.isEmpty(module.domain)) {
      callback(new Error('Domain is not provided.'));
      return;
    }

    if ('proxy' === module.type) {
      if (!(_.isArray(module.entries) && 0 < module.entries.length)) {
        callback(new Error('Entries is not provided.'));
        return;
      }

      if (!(_.isString(module.proxy) && /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.exec(module.proxy))) {
        callback(new Error('Proxy is not provided or invalid. (Proxy is a ip address, eg: 127.0.0.1)'));
        return;
      }

      if (!_.isNumber(module.proxyPort)) {
        callback(new Error('ProxyPort is not provided or invalid. (ProxyPort must be a port number)'));
        return;
      }
    }

    if (true === options.useHttps && true === module.useHttps) {
      if (!module.certFile) {
        callback(new Error('CertFile is not provided when use https'));
        return;
      }

      let certFile = utils.resolvePath(module.certFile, options.certPath);
      if (!fs.existsSync(certFile)) {
        callback(new Error(`CertFile ${certFile} is not found`));
        return;
      }

      if (!module.certKey) {
        callback(new Error('CertKey is not provided when use https'));
        return;
      }

      let certKey = utils.resolvePath(module.certKey, options.certPath);
      if (!fs.existsSync(certKey)) {
        callback(new Error(`CertKey ${certKey} is not found`));
        return;
      }

      module.certFile = certFile;
      module.certKey  = certKey;
    }

    if (_.isArray(module.entries)) {
      Object.assign(module, {
        division : module.entries.join('|'),
        logger   : _.isArray(module.domain) ? module.domain[0] : module.domain,
      });
    }
  }

  fs.ensureDirSync(options.logsPath);

  let source = compile({
    rootPath : options.rootPath,
    logsPath : options.logsPath,
    modules  : modules,
  });

  fs.ensureDir(options.distFile.replace(path.basename(options.distFile), ''));
  fs.writeFile(options.distFile, source, function (error) {
    if (error) {
      callback(error);
      return;
    }

    callback(null, { file: options.distFile, modules });
  });
}

/**
 * compare values
 * @param  {String} lvalue   first value
 * @param  {String} operator operator symbol
 * @param  {String} rvalue   second value
 * @param  {Object} options
 */
function compare (lvalue, operator, rvalue, options) {
  let operators;
  let result;

  if (3 > arguments.length) {
    throw new Error('Handlerbars Helper "compare" needs 2 parameters');
  }

  if (undefined === options) {
    options  = rvalue;
    rvalue   = operator;
    operator = '===';
  }

  operators = {
    '==' (l, r) {
      /* eslint eqeqeq:off */
      return l == r;
    },
    '===' (l, r) {
      return l === r;
    },
    '!=' (l, r) {
      /* eslint eqeqeq:off */
      return l != r;
    },
    '!==' (l, r) {
      return l !== r;
    },
    '<' (l, r) {
      return l < r;
    },
    '>' (l, r) {
      return l > r;
    },
    '<=' (l, r) {
      return l <= r;
    },
    '>=' (l, r) {
      return l >= r;
    },
    'typeof' (l, r) {
      /* eslint eqeqeq:off */
      return typeof l == r;
    },
  };

  if (!operators[operator]) {
    throw new Error(`Handlerbars Helper 'compare' doesn't know the operator ${operator}`);
  }

  result = operators[operator](lvalue, rvalue);
  return result ? options.fn(this) : options.inverse(this);
}

/**
 * separate array
 * @param  {String|Array} value     input value
 * @param  {String}       separator separate symbol
 * @return {String}
 */
function separate (value, separator) {
  if (3 > arguments.length) {
    separator = ' ';
  }

  if (_.isString(value)) {
    return value;
  }

  if (_.isArray(value)) {
    return value.join(separator);
  }
}
