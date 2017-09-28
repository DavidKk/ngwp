import defaultsDeep from 'lodash/defaultsDeep'
import fs from 'fs-extra'
import webpack from 'webpack'

export default function (file, options = {}) {
  if (!fs.existsSync(file)) {
    throw new Error(`Config file ${file} is not exists.`)
  }

  let config = require(file)
  config = config.__esModule ? config.default : config

  let compiler = webpack(config)
  options = defaultsDeep(options, { watch: false })

  let printStats = function (stats) {
    /* eslint no-console:off */
    let message = stats.toString({
      chunks: false,
      colors: true
    })
  
    console.log(message)
  }

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
