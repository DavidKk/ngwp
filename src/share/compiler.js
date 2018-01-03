import fs from 'fs-extra'
import get from 'lodash/get'
import isObject from 'lodash/isObject'
import isBoolean from 'lodash/isBoolean'
import defaults from 'lodash/defaults'
import defaultsDeep from 'lodash/defaultsDeep'
import colors from 'colors'
import Webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import { port as ServerPort, modules } from './configuration'
import { trace, printStats } from './printer'
import Package from '../../package.json'

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
    let serverHttps = isObject(options.https)
      ? options.https || {}
      : options.https === true
        ? {}
        : false

    let serverConfig = defaults({}, config.devServer, {
      // It suppress error shown in console, so it has to be set to false.
      quiet: false,
      // It suppress everything except error, so it has to be set to false as well
      // to see success build.
      noInfo: false,
      stats: {
        // only warning and error informations
        // docs: https://webpack.js.org/configuration/stats/
        colors: true,
        warnings: true,
        errors: true,
        errorDetails: true,

        version: false,
        assets: false,
        cached: false,
        cachedAssets: false,
        modules: false,
        moduleTrace: false,
        chunks: false,
        chunkModules: false,
        chunkOrigins: false,
        children: false,
        hash: false,
        timings: false
      },
      port: serverPort,
      host: serverHost,
      https: serverHttps,
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

      let server = `http${serverHttps ? 's' : ''}://${serverHost}:${serverPort}`

      trace('')
      trace(`Ngwp version at ${colors.cyan.bold(Package.version)}`)
      trace(`Project is running at ${colors.cyan.bold(server)}`)
      trace(`Webpack output is served from ${colors.cyan.bold(get(config, 'output.publicPath'))}`)
      trace(`Content not from webpack is served from ${colors.cyan.bold(get(config, 'output.path'))}`)
      trace('') // 空行
      printStats(modules)
      trace(`✨ Please make sure nginx config file is generated! You can also run script ${colors.magenta.bold('ngwp nginx')}`)
      trace('')
    })

    return
  }

  compiler.run(function (error, stats) {
    if (error) {
      throw error
    }

    /* eslint no-console:off */
    // let message = stats.toString({
    //   chunks: false,
    //   colors: true
    // })

    // trace(message)
  })
}
