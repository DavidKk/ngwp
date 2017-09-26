import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import { name } from '../../package'
import { convertName } from '../libs/utils'

export let PROJECT_NAME = name

export let RESOURCE_FOLDER_NAME = 'src'
export let LOGGER_FOLDER_NAME = 'logs'
export let TEMPORARY_FOLDER_NAME = '.temporary'
export let DEVELOP_FOLDER_NAME = '.dist'
export let VHOSTS_FOLDER_NAME = 'vhosts'
export let DISTRICT_FOLDER_NAME = 'dist'
export let UNITEST_FOLDER_NAME = 'unitest'
export let COVERAGE_FOLDER_NAME = 'coverage'
export let ENTRY_FOLDER_NAME = 'app'

export let RC_FILE = '.ngwprc'

export let ROOT_PATH = process.cwd()
export let EXEC_PATH = path.join(__dirname, '../../')
export let ENTRY_PATH = path.join(ROOT_PATH, RESOURCE_FOLDER_NAME, ENTRY_FOLDER_NAME)

export let DEVELOP_SERVER_PORT = 50000

export let CLIENT_DOMAIN = `www.${path.basename(ROOT_PATH).toLowerCase()}.com`
export let SERVER_DOMAIN = ''
export let ASSETS_DOMAIN = ''
export let UPLOAD_DOMAIN = ''

export let MODULES = []
export let NGINX_PROXY = []

/**
 * Setting domains and develop server port
 */
let rc = path.join(ROOT_PATH, '.ngwprc')
if (fs.existsSync(rc)) {
  let source = fs.readJsonSync(rc)

  DEVELOP_SERVER_PORT = source.port || DEVELOP_SERVER_PORT
  CLIENT_DOMAIN = source.clientDomain || CLIENT_DOMAIN
  SERVER_DOMAIN = source.serverDomain || SERVER_DOMAIN
  ASSETS_DOMAIN = source.assetsDomain || ASSETS_DOMAIN
  UPLOAD_DOMAIN = source.uploadDomain || UPLOAD_DOMAIN
  NGINX_PROXY = source.nginxProxy || NGINX_PROXY
}

/**
 * Generate modules from app folder.
 * folder: /app_resource/{module_name}/
 */
if (_.isEmpty(MODULES) && fs.existsSync(ENTRY_PATH) && fs.lstatSync(ENTRY_PATH).isDirectory()) {
  let modules = fs.readdirSync(ENTRY_PATH)

  modules = _.filter(modules, findModule)
  modules = _.map(modules, convertName)
  modules = _.map(modules, 'underscore')
  MODULES = MODULES.concat(modules)
}

/**
 * generate nginx proxy config
 */
if (_.isEmpty(NGINX_PROXY)) {
  if (!_.isEmpty(MODULES)) {
    let proxy = {
      type: 'proxy',
      proxy: '127.0.0.1',
      proxyPort: DEVELOP_SERVER_PORT,
      entries: MODULES,
      domain: [CLIENT_DOMAIN]
    }

    NGINX_PROXY.push(proxy)
  }
} else {
  NGINX_PROXY = _.map(NGINX_PROXY, function (proxy) {
    return _.defaultsDeep(proxy, {
      type: 'proxy',
      proxy: '127.0.0.1',
      proxyPort: DEVELOP_SERVER_PORT
    })
  })
}

if (isValidDomain(ASSETS_DOMAIN)) {
  let domains = [ASSETS_DOMAIN]

  if (UPLOAD_DOMAIN !== ASSETS_DOMAIN && isValidDomain(UPLOAD_DOMAIN)) {
    domains.push(UPLOAD_DOMAIN)
  }

  let proxy = {
    type: 'cdn',
    domain: domains
  }

  NGINX_PROXY.push(proxy)
}

/**
 * filter valid module
 * @param  {String} name module name
 * @return {Boolean}
 */
function findModule (name) {
  return /^[\w\d_-]+$/.test(name)
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
  /* eslint no-useless-escape: off */
  return /^([a-z\d](-*[a-z\d])*)(\.([a-z\d](-*[a-z\d])*))*$/i.test(domain) &&
    /^.{1,253}$/.test(domain) &&
    /^[^\.]{1,63}(\.[^\.]{1,63})*$/.test(domain)
}
