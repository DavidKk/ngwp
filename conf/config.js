import fs       from 'fs';
import path     from 'path';
import { name } from '../package';

export const PROJECT_NAME  = name;
export const CLIENT_PORT   = 51000;

export const CLIENT_DOMAIN = 'www.example.com';
export const SERVER_DOMAIN = '';
export const ASSETS_DOMAIN = '';
export const UPLOAD_DOMAIN = '';

export const SRC_DIR       = 'src';
export const LOG_DIR       = 'logs';
export const TMP_DIR       = '.temporary';
export const DEV_DIR       = '.app';
export const DIST_DIR      = 'app';
export const TEST_DIR      = 'tests';
export const COVERAGE_DIR  = 'coverage';
export const ENTRY_DIR     = 'app';

export const ROOT_PATH     = path.join(__dirname, '../');
export const DISTRICT_PATH = path.join(ROOT_PATH, process.env.DEVELOP ? DEV_DIR : DIST_DIR);
export const ENTRY_PATH    = path.join(ROOT_PATH, SRC_DIR, ENTRY_DIR);

export const MODULES       = [];

/**
 * Check required setting.
 */
if (!CLIENT_DOMAIN) {
  throw new Error('Config: CLIENT_DOMAIN is not provided.');
}

/**
 * Generate modules from app folder.
 * folder: /app_resource/{module_name}/
 */
if (fs.existsSync(ENTRY_PATH) && fs.lstatSync(ENTRY_PATH).isDirectory()) {
  let modules = fs.readdirSync(ENTRY_PATH);
  modules = modules.filter(function (name) {
    return /^[\w\d\_\-]+$/.test(name);
  });

  modules = modules.map(function (name) {
    return name.replace(/[A-Z]/g, function (char, index) {
      return 0 === index ? char.toLowerCase() : '_' + char.toLowerCase();
    });
  });

  0 < modules.length && MODULES.push({
    type      : 'proxy',
    proxy     : '127.0.0.1',
    proxyPort : CLIENT_PORT,
    entries   : modules,
    domain    : [CLIENT_DOMAIN],
  });
}

/**
 * Generate domain with static files
 */
if (ASSETS_DOMAIN) {
  let domains = [];

  ASSETS_DOMAIN && domains.push(ASSETS_DOMAIN);
  UPLOAD_DOMAIN && UPLOAD_DOMAIN !== ASSETS_DOMAIN && domains.push(UPLOAD_DOMAIN);

  MODULES.push({
    type      : 'cdn',
    domain    : domains,
  });
}
