import fs from 'fs-extra'
import defaultsDeep from 'lodash/defaultsDeep'
import Webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'

export default function (file, options = {}, callback) {
  if (!fs.existsSync(file)) {
    throw new Error(`Config file ${file} is not exists.`)
  }

  let config = require(file)
  config = config.__esModule ? config.default : config

  let compiler = Webpack(config)
  options = defaultsDeep(options, { watch: false })

  if (options.watch === true) {
    let server = new WebpackDevServer(compiler, { stats: { colors: true } })

    server.listen(8080, '127.0.0.1', () => {
      console.log('Starting server on http://localhost:8080')
    })

    return
  }

  compiler.run(function (error, stats) {
    if (error) {
      throw error
    }

    /* eslint no-console:off */
    let message = stats.toString({
      chunks: false,
      colors: true
    })

    console.log(message)
  })
}
