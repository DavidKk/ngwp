import webpack from 'webpack'
import WebpackMerger from 'webpack-merge'
import WebpackConfig from './webpack.common.config.babel'

const DefinePlugin = webpack.DefinePlugin

export default WebpackMerger(WebpackConfig, {
  devtool: 'inline',
  stats: 'errors-only',
  plugins: [
    /**
     * Define some global variables
     */
    new DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
        production: JSON.stringify(true),
        unitest: JSON.stringify(true)
      }
    })
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
