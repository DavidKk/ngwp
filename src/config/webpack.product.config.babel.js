import webpack from 'webpack'
import WebpackMerger from 'webpack-merge'
import WebpackConfig from './webpack.common.config.babel'

const DefinePlugin = webpack.DefinePlugin
const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin

export default WebpackMerger(WebpackConfig, {
  devtool: false,
  output: {
    filename: '[name].[chunkhash].js'
  },
  plugins: [
    /**
     * Define some global variables
     */
    new DefinePlugin({
      'process.env': {
        production: JSON.stringify(true)
      }
    }),

    /**
     * Compress js files
     */
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
