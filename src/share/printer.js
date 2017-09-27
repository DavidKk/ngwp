import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import indexOf from 'lodash/indexOf'
import defaultsDeep from 'lodash/defaultsDeep'
import path from 'path'
import colors from 'colors'
import columnify from 'columnify'

const basePath = path.join(__dirname, '../')
const ingoreTrace = -1 === indexOf(process.argv, '--quiet')

/**
 * format size by unit
 * @param  {Number} bytes    size
 * @param  {Number} decimals
 * @return {String}
 */
export function formatBytes (bytes, decimals) {
  if (0 === bytes) {
    return '0 Bytes'
  }

  let k = 1000
  let dm = decimals + 1 || 3
  let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  let i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * print stats
 * @param  {Object} options setting
 */
export function trace (message) {
  ingoreTrace && console.log(message)
}

/**
 * Print results
 * @param  {Array}  stats   result set
 * @param  {Object} options columnify setting
 */
export function printStats (stats, options) {
  console.log(stats)

  /* istanbul ignore if */
  if (isEmpty(stats)) {
    trace(colors.yellow('Generate completed but nothing to be generated.'))
    return false
  }

  options = defaultsDeep(options, {
    headingTransform (heading) {
      return (heading.charAt(0).toUpperCase() + heading.slice(1)).white.bold
    },
    config: {
      assets: {
        align: 'right',
        dataTransform (file) {
          file = file.replace(basePath + '/', '')
          return colors.green(file).bold
        }
      },
      size: {
        align: 'right',
        dataTransform (size) {
          return formatBytes(size)
        }
      },
      domain: {
        align: 'right',
        dataTransform (domain) {
          domain = isArray(domain) ? domain.join(',') : domain
          domain = colors.green(domain)
          return colors.bold(domain)
        }
      },
      proxy: {
        align: 'right',
      },
      entries: {
        align: 'left',
        dataTransform (entries) {
          entries = isArray(entries) ? entries.join('|') : entries
          entries = colors.green(entries)
          return colors.bold(entries)
        }
      }
    }
  })

  /* eslint no-console:off */
  trace(columnify(stats, options) + '\n')
  return true
}
