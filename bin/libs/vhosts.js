/* eslint no-console: off */

import _          from 'lodash';
import fs         from 'fs-extra';
import path       from 'path';
import handlebars from 'handlebars';
import colors     from 'colors';
import columnify  from 'columnify';
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

let tplfile = path.join(__dirname, 'templates/vhosts/nginx.conf.hbs');
let outfile = path.join(ROOT_PATH, 'vhosts/nginx.conf');

if (!fs.existsSync(tplfile)) {
  throw new Error(`vhost template '${tplfile}' is not exists.`);
}

let template  = fs.readFileSync(tplfile, 'utf-8');
let compile   = handlebars.compile(template);
let startTime = Date.now();

/**
 * build nginx config
 */
build(MODULES, function (error, { outfile, modules }) {
  if (error) {
    console.error(error);
    return;
  }

  modules = _.map(modules, function ({ domain, proxy, entries }) {
    return {
      domain  : colors.green(_.isArray(domain) ? domain.join(',') : domain).bold,
      proxy   : proxy,
      entries : colors.green(entries.join(',')).bold,
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

  console.log('Generator: \'vhosts.js\'');
  console.log(`Time: ${colors.white(Date.now() - startTime).bold}ms\n`);
  console.log(`${tableLogs}\n`);
  console.log(`[${colors.green('ok').bold}] Nginx config file '${outfile.green.bold}' is generated successfully, include it to nginx.conf.`);
  console.log(`Remember '${colors.green('reolad/restart').bold}' your nginx server.`);
});

/**
 * build nginx vhosts
 * @param  {Array}    modules  module setting
 * @param  {Function} callback result callback function
 */
export function build (modules, callback) {
  if (!_.isFunction(callback)) {
    throw new Error('callback is not provided.');
  }

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

  let logPath = path.join(ROOT_PATH, LOG_DIR);
  fs.ensureDirSync(logPath);

  let source = compile({
    rootPath : path.join(ROOT_PATH, DIST_DIR),
    logsPath : logPath,
    modules  : modules,
  });

  fs.ensureDir(outfile.replace(path.basename(outfile), ''));
  fs.writeFile(outfile, source, function (error) {
    if (error) {
      callback(error);
      return;
    }

    callback(null, { outfile, modules });
  });
}
