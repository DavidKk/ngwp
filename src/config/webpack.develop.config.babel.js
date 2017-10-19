import webpack from 'webpack'
import WebpackMerger from 'webpack-merge'
import webpackConfig from './webpack.common.config.babel'
import { port } from '../share/configuration'

const DefinePlugin = webpack.DefinePlugin

export default WebpackMerger(webpackConfig, {
  devtool: 'source-map',
  devServer: {
    port: port,
    hot: true,
    inline: true
  },
  plugins: [
    /**
     * Define some global variables
     */
    new DefinePlugin({
      'process.env': {
        development: JSON.stringify(true)
      }
    })
  ]
})
