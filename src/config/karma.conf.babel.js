import path from 'path'
import filter from 'lodash/filter'
import indexOf from 'lodash/indexOf'
import WebpackMerger from 'webpack-merge'
import { ResolveModules } from './webpack.common.config.babel'
import WebpackConf from './webpack.unitest.config.babel'
import { rootDir, srcDir } from '../share/configuration'

WebpackConf.entry = {
  index: ['babel-polyfill']
}

/**
 * Filter CommonsChunkPlugin
 * docs: https://github.com/webpack-contrib/karma-webpack/issues/24
 */
WebpackConf.plugins = filter(WebpackConf.plugins, (plugin) => {
  let index = indexOf(['CommonsChunkPlugin', 'FaviconsWebpackPlugin', 'HtmlWebpackPlugin'], plugin.constructor.name)
  return index === -1
})

export default function (config) {
  let karmaConf = {
    basePath: rootDir,
    browsers: ['PhantomJS'],
    frameworks: ['mocha', 'chai', 'sinon'],
    files: [
      {
        pattern: './test/e2e/*.spec.js',
        watched: false
      }
    ],
    client: {
      chai: {
        includeStack: true
      }
    },
    preprocessors: {
      './test/e2e/**/*.spec.js': [
        'webpack',
        'sourcemap'
      ]
    },
    reporters: [
      'mocha'
    ],
    webpack: WebpackConf,
    webpackMiddleware: {
      noInfo: false,
      stats: true
    },
    /**
     * in empty test folder, it will return
     * status 1 and throw error.
     * set 'failOnEmptyTestSuite' to false
     * will resolve this problem.
     */
    failOnEmptyTestSuite: false,
    autoWatch: false,
    singleRun: true,
    colors: true,
    logLevel: config.LOG_INFO,
    plugins: [
      'karma-phantomjs-launcher',
      'karma-webpack',
      'karma-chai',
      'karma-sinon',
      'karma-mocha',
      'karma-mocha-reporter',
      'karma-coverage-istanbul-reporter',
      'karma-sourcemap-loader'
    ]
  }

  if (process.env.COVERAGE) {
    karmaConf.reporters = [
      'mocha',
      'coverage-istanbul'
    ]

    karmaConf.coverageIstanbulReporter = {
      reports: ['lcov', 'text-summary'],
      fixWebpackSourcePaths: true
    }

    karmaConf.webpack = WebpackMerger(WebpackConf, {
      module: {
        rules: [
          {
            test: /\.js$/,
            enforce: 'post',
            include: ResolveModules,
            exclude: [
              /node_modules/,
              /\.spec\.js$/,
              path.join(srcDir, './assets/sprites/svg')
            ],
            use: [
              {
                loader: 'istanbul-instrumenter-loader',
                query: {
                  esModules: true
                }
              }
            ]
          }
        ]
      }
    })
  }

  config.set(karmaConf)
}
