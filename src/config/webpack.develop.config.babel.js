import defaults from 'lodash/defaults'
import webpack from 'webpack'
import WebpackMerger from 'webpack-merge'
import webpackConfig from './webpack.common.config.babel'
import { variables } from '../share/configuration'

const LoaderOptionsPlugin = webpack.LoaderOptionsPlugin
const DefinePlugin = webpack.DefinePlugin

export default WebpackMerger(webpackConfig, {
  devtool: 'source-map',
  devServer: {
    hot: true,
    inline: true
  },
  plugins: [
    new LoaderOptionsPlugin({
      debug: true
    }),
    new DefinePlugin(defaults({
      'process.env': {
        development: JSON.stringify(true)
      }
    }, variables))
  ]
})
