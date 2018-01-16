import webpack from 'webpack'
import WebpackMerger from 'webpack-merge'
import WebpackConfig from './webpack.common.config.babel'
import { port } from '../share/configuration'

const DefinePlugin = webpack.DefinePlugin

export default WebpackMerger(WebpackConfig, {
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
        NODE_ENV: JSON.stringify('development'),
        development: JSON.stringify(true)
      }
    })
  ]
})
