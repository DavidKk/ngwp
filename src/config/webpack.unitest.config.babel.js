import defaults from 'lodash/defaults'
import webpack from 'webpack'
import WebpackMerger from 'webpack-merge'
import WebpackConf from './webpack.common.config.babel'
import { publicPath, variables } from '../share/configuration'

const DefinePlugin = webpack.DefinePlugin
const GlobalVariables = defaults({
  publicPath: JSON.stringify(publicPath),
  'process.env': {
    production: JSON.stringify(true),
    unitest: JSON.stringify(true)
  }
}, variables)

export default WebpackMerger(WebpackConf, {
  devtool: 'source-map',
  plugins: [
    new DefinePlugin(GlobalVariables)
  ],
  /**
   * Sinon setting
   *
   * UMD will make compiled occur some error
   * Error:
   * modules[moduleId].call is not a function
   * Issue: https://github.com/webpack/webpack/issues/304
   *
   * @todo 后面版本修复后删除
   */
  module: {
    noParse: [
      /node_modules\/sinon\//
    ]
  },
  resolve: {
    alias: {
      sinon: 'sinon/pkg/sinon.js'
    }
  }
})
