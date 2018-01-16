import fs from 'fs-extra'
import path from 'path'
import webpack from 'webpack'
import WebpackMerger from 'webpack-merge'
import OfflinePlugin from 'offline-plugin'
import UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import WebpackConfig from './webpack.common.config.babel'
import { rootDir, publicPath } from '../share/configuration'

const Package = fs.readJSONSync(path.join(rootDir, './package.json'))
const DefinePlugin = webpack.DefinePlugin

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
        NODE_ENV: JSON.stringify('production'),
        production: JSON.stringify(true)
      }
    }),

    /**
     * Compress js files
     */
    new UglifyJsPlugin({
      sourceMap: false,
      uglifyOptions: {
        warnings: false,
        output: {
          comments: false,
          beautify: false
        }
      }
    }),

    /**
     * Generate Offline web page
     * docs: https://github.com/NekR/offline-plugin/blob/master/docs/options.md
     */
    new OfflinePlugin({
      publicPath,
      autoUpdate: true,
      safeToUseOptionalCaches: true,
      rewrites: (assets) => publicPath === assets ? publicPath + 'index.html' : assets,
      caches: {
        main: [':rest:'],
        additional: [':externals:'],
        optional: ['*.js']
      },
      ServiceWorker: {
        minify: true,
        output: 'service-worker.js',
        scope: '/',
        cacheName: Package.name,
        publicPath: '/service-worker.js',
        prefetchRequest: {
          credentials: 'omit',
          mode: 'cors'
        }
      }
    })
  ]
})
