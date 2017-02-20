import _          from 'lodash';
import fs         from 'fs-extra';
import path       from 'path';
import handlebars from 'handlebars';
import {
  DIST_DIR,
  LOG_DIR,
}                 from '../../conf/config';

/**
 * Register Handlebars helpers
 * @docs: http://handlebarsjs.com/block_helpers.html
 */

/**
 * Compare number and type-equals with variables
 */
handlebars.registerHelper('compare', function (lvalue, operator, rvalue, options) {
  let operators;
  let result;

  /* istanbul ignore if */
  if (3 > arguments.length) {
    throw new Error('Handlerbars Helper "compare" needs 2 parameters');
  }

  /* istanbul ignore if */
  if (undefined === options) {
    options  = rvalue;
    rvalue   = operator;
    operator = '===';
  }

  /* istanbul ignore next */
  operators = {
    '==' (l, r) {
      /* eslint eqeqeq: off */
      return l == r;
    },
    '===' (l, r) {
      return l === r;
    },
    '!=' (l, r) {
      /* eslint eqeqeq: off */
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
      return typeof l == r;
    },
  };

  /* istanbul ignore if */
  if (!operators[operator]) {
    throw new Error(`Handlerbars Helper 'compare' doesn't know the operator ${operator}`);
  }

  result = operators[operator](lvalue, rvalue);
  return result ? options.fn(this) : options.inverse(this);
});

/**
 * Separate Array to some string.
 * [value1, value2, value3] => 'value1 value2 value3';
 */
handlebars.registerHelper('separate', function (value, separator) {
  if (3 > arguments.length) {
    separator = ' ';
  }

  if (_.isString(value)) {
    return value;
  }

  if (_.isArray(value)) {
    return value.join(separator);
  }
});

/**
 * build nginx vhosts
 * @param  {Array}    modules  module setting
 * @param  {Object}   options  setting
 * @param  {Function} callback result callback function
 */
export function mkVhost (modules, options, callback) {
  /* istanbul ignore if */
  if (!_.isFunction(callback)) {
    throw new Error('callback is not provided.');
  }

  let basePath = options.basePath || process.cwd();

  options = _.defaultsDeep(options, {
    ignoreTrace  : false,
    distFile     : path.join(basePath, 'vhosts/nginx.conf'),
    templateFile : path.join(__dirname, './templates/vhosts/nginx.conf.hbs'),
    variables    : {
      rootPath : path.join(basePath, DIST_DIR),
      logsPath : path.join(basePath, LOG_DIR),
    },
  });

  /* istanbul ignore if */
  if (!fs.existsSync(options.templateFile)) {
    throw new Error(`vhost template '${options.templateFile}' is not exists.`);
  }

  let template  = fs.readFileSync(options.templateFile, 'utf-8');
  let compile   = handlebars.compile(template);

  modules = _.clone(modules);

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

    if (_.isArray(module.entries)) {
      Object.assign(module, { division: module.entries.join('|') });
    }
  }

  fs.ensureDirSync(options.variables.logsPath);

  let source = compile({
    rootPath : options.variables.rootPath,
    logsPath : options.variables.logsPath,
    modules  : modules,
  });

  fs.ensureDir(options.distFile.replace(path.basename(options.distFile), ''));
  fs.writeFile(options.distFile, source, function (error) {
    /* istanbul ignore if */
    if (error) {
      callback(error);
      return;
    }

    callback(null, { file: options.distFile, modules });
  });
}
