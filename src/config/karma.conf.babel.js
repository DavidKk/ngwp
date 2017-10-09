import path from 'path'
import WebpackMerger from 'webpack-merge'
import { ResolveModules } from './webpack.common.config.babel'
import WebpackConf from './webpack.unitest.config.babel'
import { rootDir, srcDir } from '../share/configuration'

export default function (config) {
  let karmaConf = {
    basePath: rootDir,
    browsers: ['PhantomJS'],
    frameworks: ['mocha', 'chai', 'sinon'],
    files: ['test/e2e/**.spec.js'],
    client: {
      chai: {
        includeStack: true
      }
    },
    preprocessors: {
      'test/e2e/**.spec.js': [
        'webpack',
        'sourcemap'
      ]
    },
    reporters: [
      'mocha'
    ],
    webpack: WebpackConf,
    webpackMiddleware: {
      noInfo: true,
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
