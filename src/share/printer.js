import isEmpty from 'lodash/isEmpty'
import indexOf from 'lodash/indexOf'
import defaultsDeep from 'lodash/defaultsDeep'
import colors from 'colors'
import columnify from 'columnify'

const ingoreTrace = indexOf(process.argv, '--quiet') === -1

/**
 * format size by unit
 * @param  {Number} bytes    size
 * @param  {Number} decimals
 * @return {String}
 */
export function formatBytes (bytes, decimals) {
  if (bytes === 0) {
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
  /* istanbul ignore if */
  if (isEmpty(stats)) {
    trace(colors.yellow('Generate completed but nothing to be generated.'))
    return false
  }

  options = defaultsDeep(options, {
    headingTransform: (heading) => colors.white.bold(heading.charAt(0).toUpperCase() + heading.slice(1)),
    config: {
      domain: {
        align: 'right',
        dataTransform: (domain) => colors.green.bold(domain)
      },
      proxy: {
        align: 'right'
      },
      entry: {
        align: 'left',
        dataTransform: (entry) => colors.green.bold(entry)
      },
      port: {
        align: 'right'
      }
    }
  })

  /* eslint no-console:off */
  trace(columnify(stats, options) + '\n')
  return true
}
