import defaults from 'lodash/defaults'
import webpack from 'webpack'
import WebpackMerger from 'webpack-merge'
import webpackConfig from './webpack.common.config.babel'
import { publicPath, variables } from '../share/configuration'

const DefinePlugin = webpack.DefinePlugin
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin

const GlobalVariables = defaults({
  publicPath: JSON.stringify(publicPath),
  'process.env': {
    production: JSON.stringify(true)
  }
}, variables)

export default WebpackMerger(webpackConfig, {
  devtool: false,
  output: {
    filename: '[name].[chunkhash].js',
    publicPath
  },
  plugins: [
    new DefinePlugin(GlobalVariables),
    new UglifyJsPlugin({
      sourceMap: false,
      mangle: false,
      compress: {
        warnings: false
      },
      output: {
        comments: false
      }
    })
  ]
})
