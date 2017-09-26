import path from 'path'
import webpack from 'webpack'
import WebpackMerger from 'webpack-merge'
import BrowserSyncPlugin from 'browser-sync-webpack-plugin'
import webpackConfig from './webpack.common.config.babel'
import * as VARS from './variables'

let districtPath = path.join(VARS.ROOT_PATH, process.env.DEVELOP ? VARS.DEVELOP_FOLDER_NAME : VARS.DISTRICT_FOLDER_NAME)

export default WebpackMerger(webpackConfig, {
  devtool: 'source-map',
  plugins: [
    new webpack.LoaderOptionsPlugin({
      debug: true
    }),
    /**
     * BrowserSync Plugin
     * local test but weinre not support https
     * docs: https://www.browsersync.io
     */
    new BrowserSyncPlugin({
      host: 'localhost',
      port: VARS.DEVELOP_SERVER_PORT,
      open: false,
      logLevel: 'debug',
      server: {
        baseDir: [districtPath]
      },
      ui: {
        port: VARS.DEVELOP_SERVER_PORT + 1,
        weinre: {
          port: VARS.DEVELOP_SERVER_PORT + 2
        }
      }
    })
  ]
})
