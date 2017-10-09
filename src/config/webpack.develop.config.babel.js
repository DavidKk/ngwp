import defaults from 'lodash/defaults'
import webpack from 'webpack'
import WebpackMerger from 'webpack-merge'
import webpackConfig from './webpack.common.config.babel'
import { port, publicPath, variables } from '../share/configuration'

const LoaderOptionsPlugin = webpack.LoaderOptionsPlugin
const DefinePlugin = webpack.DefinePlugin
const GlobalVariables = defaults({
  publicPath: JSON.stringify(publicPath),
  'process.env': {
    development: JSON.stringify(true)
  }
}, variables)

export default WebpackMerger(webpackConfig, {
  devtool: 'source-map',
  devServer: {
    port: port,
    hot: true,
    inline: true
  },
  plugins: [
    new LoaderOptionsPlugin({ debug: true }),
    new DefinePlugin(GlobalVariables)
  ]
})
