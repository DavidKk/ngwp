import fs from 'fs-extra'
import clone from 'lodash/clone'
import isBoolean from 'lodash/isBoolean'
import defaultsDeep from 'lodash/defaultsDeep'
import Webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import { port as ServerPort } from './configuration'

export default function (file, options = {}, callback) {
  if (!fs.existsSync(file)) {
    throw new Error(`Config file ${file} is not exists.`)
  }

  let config = require(file)
  config = config.__esModule ? config.default : config

  let compiler = Webpack(config)
  options = defaultsDeep(options, { watch: false })

  if (options.watch === true) {
    let serverPort = options.port || ServerPort
    let serverHost = options.host || '127.0.0.1'
    let serverConfig = defaultsDeep(clone(config.devServer), {
      stats: {
        colors: true
      },
      port: serverPort,
      host: serverHost,
      disableHostCheck: isBoolean(options.disableHostCheck) ? options.disableHostCheck : true,
      watchOptions: {
        ignored: /node_modules/,
        aggregateTimeout: 300,
        poll: 1000
      }
    })

    let server = new WebpackDevServer(compiler, serverConfig)
    server.listen(serverPort, serverHost, (error) => {
      if (error) {
        throw error
      }

      console.log(`Starting server on http://${serverHost}:${serverPort}`)
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
