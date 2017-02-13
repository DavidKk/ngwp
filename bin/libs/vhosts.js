import _          from 'lodash';
import fs         from 'fs-extra';
import path       from 'path';
import handlebars from 'handlebars';
import colors     from 'colors';
import columnify  from 'columnify';
import { tracer } from './utils.js';
import {
  LOG_DIR,
  DIST_DIR,
  ROOT_PATH,
  MODULES,
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
handlebars.registerHelper('separate', function (value, separator = ' ') {
  if (_.isString(value)) {
    return value;
  }

  if (_.isArray(value)) {
    return value.join(separator);
  }
});

/**
 * build api
 * @param  {Object}   config   module setting
 * @param  {Object}   options  setting
 * @param  {Function} callback optional
 */
export function build (config = MODULES, options, callback) {
  /* istanbul ignore if */
  if (3 > arguments.length) {
    return build(config, {}, options);
  }

  options = _.defaultsDeep(options, {
    ignoreTrace: false,
  });

  let startTime = Date.now();

  /**
   * build nginx config
   */
  generateNginxConfig(config, options, function (error, state) {
    if (error) {
      if (_.isFunction(callback)) {
        callback(error);
        return;
      }

      throw error;
    }

    let { outputFile, modules } = state;

    modules = _.map(modules, function ({ domain, proxy, entries }) {
      return {
        domain  : colors.green(_.isArray(domain) ? domain.join(',') : domain).bold,
        proxy   : proxy || '127.0.0.1',
        entries : _.isArray(entries) ? colors.green(entries.join(',')).bold : '',
      };
    });

    let tableLogs = columnify(modules, {
      headingTransform (heading) {
        return (heading.charAt(0).toUpperCase() + heading.slice(1)).white.bold;
      },
      config: {
        domain: {
          maxWidth : 40,
          align    : 'right',
        },
      }
    });

    if (true !== options.ignoreTrace) {
      let trace = tracer(options);

      trace('Generator: \'vhosts.js\'');
      trace(`Time: ${colors.white(Date.now() - startTime).bold}ms\n`);
      trace(`${tableLogs}\n`);
      trace(`[${colors.green('ok').bold}] Nginx config file '${outputFile.green.bold}' is generated successfully, include it to nginx.conf.`);
      trace(`Remember '${colors.green('reolad/restart').bold}' your nginx server.`);
    }

    _.isFunction(callback) && callback(null, modules, tableLogs);
  });
}

/**
 * build nginx vhosts
 * @param  {Array}    modules  module setting
 * @param  {Object}   options  setting
 * @param  {Function} callback result callback function
 */
export function generateNginxConfig (modules, options, callback) {
  /* istanbul ignore if */
  if (!_.isFunction(callback)) {
    throw new Error('callback is not provided.');
  }

  options = _.defaultsDeep(options, {
    ignoreTrace  : false,
    rootPath     : path.join(ROOT_PATH, DIST_DIR),
    logsPath      : path.join(ROOT_PATH, LOG_DIR),
    templateFile : path.join(__dirname, 'templates/vhosts/nginx.conf.hbs'),
    outputFile   : path.join(ROOT_PATH, 'vhosts/nginx.conf'),
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

  fs.ensureDirSync(options.logsPath);

  let source = compile({
    rootPath : options.rootPath,
    logsPath : options.logsPath,
    modules  : modules,
  });

  fs.ensureDir(options.outputFile.replace(path.basename(options.outputFile), ''));
  fs.writeFile(options.outputFile, source, function (error) {
    /* istanbul ignore if */
    if (error) {
      callback(error);
      return;
    }

    callback(null, { outputFile: options.outputFile, modules });
  });
}
