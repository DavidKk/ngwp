import _               from 'lodash';
import fs              from 'fs-extra';
import path            from 'path';
import { name }        from '../package';
import { convertName } from '../scripts/utils';

export let PROJECT_NAME        = name;

export let SRC_DIR             = 'src';
export let LOG_DIR             = 'logs';
export let TMP_DIR             = '.temporary';
export let DEV_DIR             = '.dist';
export let DIST_DIR            = 'dist';
export let TEST_DIR            = 'unitest';
export let COVERAGE_DIR        = 'coverage';
export let ENTRY_DIR           = 'app';

export let RC_FILE             = '.ngwprc';

export let ROOT_PATH           = process.cwd();
export let EXEC_PATH           = path.join(__dirname, '../');
export let DISTRICT_PATH       = path.join(ROOT_PATH, process.env.DEVELOP ? DEV_DIR : DIST_DIR);
export let ENTRY_PATH          = path.join(ROOT_PATH, SRC_DIR, ENTRY_DIR);

export let DEVELOP_SERVER_PORT = 50000;

export let CLIENT_DOMAIN       = `www.${path.basename(ROOT_PATH).toLowerCase()}.com`;
export let SERVER_DOMAIN       = '';
export let ASSETS_DOMAIN       = '';
export let UPLOAD_DOMAIN       = '';

export let MODULES             = [];
export let NGINX_PROXY         = [];

/**
 * Setting domains and develop server port
 */
let rc = path.join(ROOT_PATH, '.ngwprc');
if (fs.existsSync(rc)) {
  let source = fs.readJsonSync(rc);

  DEVELOP_SERVER_PORT = source.port || DEVELOP_SERVER_PORT;
  CLIENT_DOMAIN       = source.clientDomain || CLIENT_DOMAIN;
  SERVER_DOMAIN       = source.serverDomain || SERVER_DOMAIN;
  ASSETS_DOMAIN       = source.assetsDomain || ASSETS_DOMAIN;
  UPLOAD_DOMAIN       = source.uploadDomain || UPLOAD_DOMAIN;
  NGINX_PROXY         = source.nginxProxy || NGINX_PROXY;
}

/**
 * Generate modules from app folder.
 * folder: /app_resource/{module_name}/
 */
if (_.isEmpty(MODULES) && fs.existsSync(ENTRY_PATH) && fs.lstatSync(ENTRY_PATH).isDirectory()) {
  let modules = fs.readdirSync(ENTRY_PATH);

  modules = _.filter(modules, findModule);
  modules = _.map(modules, convertName);
  modules = _.map(modules, 'underscore');
  MODULES = MODULES.concat(modules);
}

/**
 * generate nginx proxy config
 */
if (_.isEmpty(NGINX_PROXY)) {
  if (!_.isEmpty(MODULES)) {
    let proxy = {
      type      : 'proxy',
      proxy     : '127.0.0.1',
      proxyPort : DEVELOP_SERVER_PORT,
      entries   : MODULES,
      domain    : [CLIENT_DOMAIN],
    };

    NGINX_PROXY.push(proxy);
  }
}
else {
  NGINX_PROXY = _.map(NGINX_PROXY, function (proxy) {
    return _.defaultsDeep(proxy, {
      type      : 'proxy',
      proxy     : '127.0.0.1',
      proxyPort : DEVELOP_SERVER_PORT,
    });
  });
}

if (isValidDomain(ASSETS_DOMAIN)) {
  let domains = [ASSETS_DOMAIN];

  if (UPLOAD_DOMAIN !== ASSETS_DOMAIN && isValidDomain(UPLOAD_DOMAIN)) {
    domains.push(UPLOAD_DOMAIN);
  }

  let proxy = {
    type   : 'cdn',
    domain : domains,
  };

  NGINX_PROXY.push(proxy);
}


/**
 * filter valid module
 * @param  {String} name module name
 * @return {Boolean}
 */
function findModule (name) {
  return /^[\w\d\_\-]+$/.test(name);
}

/**
 * valid domain
 * - check valid chars
 * - check overall length
 * - check length of each label
 * @param  {String}  domain Domain name
 * @return {Boolean}
 */
function isValidDomain (domain) {
  return /^([a-z\d](-*[a-z\d])*)(\.([a-z\d](-*[a-z\d])*))*$/i.test(domain)
    && /^.{1,253}$/.test(domain)
    && /^[^\.]{1,63}(\.[^\.]{1,63})*$/.test(domain);
}
