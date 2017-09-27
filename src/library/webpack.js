import defaultsDeep from 'lodash/defaultsDeep'
import fs from 'fs-extra'
import webpack from 'webpack'

export function run (file, options) {
  if (!fs.existsSync(file)) {
    throw new Error(`Config file ${file} is not exists.`)
  }

  let config = require(file).default
  let compiler = webpack(config)

  options = defaultsDeep(options, {
    watch: false
  })

  if (options.watch === true) {
    compiler.watch({
      aggregateTimeout: 300,
      poll: true
    },
    function (error, stats) {
      if (error) {
        throw error
      }

      printStats(stats)
    })
  } else {
    compiler.run(function (error, stats) {
      if (error) {
        throw error
      }

      printStats(stats)
    })
  }
}

function printStats (stats) {
  /* eslint no-console:off */
  let message = stats.toString({
    chunks: false,
    colors: true
  })

  console.log(message)
}
