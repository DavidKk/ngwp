import fs from 'fs-extra'
import path from 'path'
import handlebars from 'handlebars'
import filter from 'lodash/filter'
import isEmpty from 'lodash/isEmpty'
import isArray from 'lodash/isArray'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'
import isBoolean from 'lodash/isBoolean'
import isFunction from 'lodash/isFunction'
import defaultsDeep from 'lodash/defaultsDeep'
import cloneDeep from 'lodash/cloneDeep'
import OptionMerger from './option_merger'
import * as VARS from '../config/variables'

/**
 * Register Handlebars helpers
 * @docs: http://handlebarsjs.com/block_helpers.html
 */

/**
 * Compare number and type-equals with variables
 */
handlebars.registerHelper('compare', compare)

/**
 * Separate Array to some string.
 * [value1, value2, value3] => 'value1 value2 value3'
 */
handlebars.registerHelper('separate', separate)

export default function (modules, options, callback) {
  if (!isFunction(callback)) {
    throw new Error('Callback is not provided')
  }

  let basePath = process.cwd()
  options = defaultsDeep(options, {
    distFile: path.join(basePath, 'vhosts/nginx.conf'),
    template: path.join(OptionMerger.EXEC_PATH, 'templates/vhosts/nginx.conf.hbs'),
    rootPath: path.join(basePath, VARS.DISTRICT_FOLDER_NAME),
    logsPath: path.join(basePath, VARS.LOGGER_FOLDER_NAME),
    useHttps: isBoolean(options.useHttps) ? options.useHttps : false
  })

  if (!fs.existsSync(options.template)) {
    callback(new Error(`Template '${options.template}' is not exists.`))
    return
  }

  let template = fs.readFileSync(options.template, 'utf-8')
  let compile  = handlebars.compile(template)

  modules = cloneDeep(modules)

  for (let module of modules) {
    if (!(isString(module.domain) || isArray(module.domain)) || isEmpty(module.domain)) {
      callback(new Error('Domain is not provided'))
      return
    }

    if ('proxy' === module.type) {
      if (isEmpty(module.entry)) {
        callback(new Error('Entry is not provided'))
        return
      }

      if (!fs.existsSync(path.join(__dirname, '../', module.entry))) {
        callback(new Error(`Entry file ${module.entry} is not found`))
        return
      }

      let folder = path.dirname(module.entry)
      module.entry = path.basename(folder) + '.html'

      if (!(isString(module.proxy) && /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.exec(module.proxy))) {
        callback(new Error('Proxy is not provided or invalid. (Proxy is a ip address, eg: 127.0.0.1)'))
        return
      }

      if (!isNumber(module.port)) {
        callback(new Error('port is not provided or invalid. (port must be a port number)'))
        return
      }
    }

    if (true === options.useHttps && true === module.useHttps) {
      if (!module.certFile) {
        callback(new Error('CertFile is not provided when use https'))
        return
      }

      let certFile = utils.resolvePath(module.certFile, options.certPath)
      if (!fs.existsSync(certFile)) {
        callback(new Error(`CertFile ${certFile} is not found`))
        return
      }

      if (!module.certKey) {
        callback(new Error('CertKey is not provided when use https'))
        return
      }

      let certKey = utils.resolvePath(module.certKey, options.certPath)
      if (!fs.existsSync(certKey)) {
        callback(new Error(`CertKey ${certKey} is not found`))
        return
      }

      module.certFile = certFile
      module.certKey = certKey
    }
  }

  fs.ensureDirSync(options.logsPath)

  let source = compile({
    rootPath: options.rootPath,
    logsPath: options.logsPath,
    modules: modules
  })

  fs.ensureDir(options.distFile.replace(path.basename(options.distFile), ''))
  fs.writeFile(options.distFile, source, function (error) {
    if (error) {
      callback(error)
      return
    }

    callback(null, { file: options.distFile, modules })
  })
}

/**
 * compare values
 * @param  {String} lvalue   first value
 * @param  {String} operator operator symbol
 * @param  {String} rvalue   second value
 * @param  {Object} options
 */
function compare (lvalue, operator, rvalue, options) {
  let operators
  let result

  if (3 > arguments.length) {
    throw new Error('Handlerbars Helper "compare" needs 2 parameters')
  }

  if (undefined === options) {
    options  = rvalue
    rvalue   = operator
    operator = '==='
  }

  operators = {
    '==' (l, r) {
      /* eslint eqeqeq:off */
      return l == r
    },
    '===' (l, r) {
      return l === r
    },
    '!=' (l, r) {
      /* eslint eqeqeq:off */
      return l != r
    },
    '!==' (l, r) {
      return l !== r
    },
    '<' (l, r) {
      return l < r
    },
    '>' (l, r) {
      return l > r
    },
    '<=' (l, r) {
      return l <= r
    },
    '>=' (l, r) {
      return l >= r
    },
    'typeof' (l, r) {
      /* eslint eqeqeq:off */
      return typeof l == r
    }
  }

  if (!operators[operator]) {
    throw new Error(`Handlerbars Helper 'compare' doesn't know the operator ${operator}`)
  }

  result = operators[operator](lvalue, rvalue)
  return result ? options.fn(this) : options.inverse(this)
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

  if (isString(value)) {
    return value;
  }

  if (isArray(value)) {
    return value.join(separator);
  }
}
