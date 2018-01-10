import fs from 'fs-extra'
import path from 'path'
import map from 'lodash/map'
import clone from 'lodash/clone'
import assign from 'lodash/assign'
import without from 'lodash/without'
import isArray from 'lodash/isArray'
import indexOf from 'lodash/indexOf'
import forEach from 'lodash/forEach'
import isObject from 'lodash/isObject'
import filter from 'lodash/filter'
import defaults from 'lodash/defaults'
import PostCSSAutoprefixer from 'autoprefixer'
import PostCSSPxToRem from 'postcss-pxtorem'
import webpack from 'webpack'
import CleanWebpackPlugin from 'clean-webpack-plugin'
import SpritesmithTemplate from 'spritesheet-templates'
import SpritesmithPlugin from 'webpack-spritesmith'
import SvgStore from 'webpack-svgstore-plugin'
import FaviconsWebpackPlugin from 'favicons-webpack-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import ManifestPlugin from 'webpack-manifest-plugin'
import { name as projectName, execDir, rootDir, srcDir, distDir, tmpDir, publicPath, variables, modules as Modules, plugins as PluginsOptions } from '../share/configuration'

const DefinePlugin = webpack.DefinePlugin
const { CommonsChunkPlugin } = webpack.optimize
const GlobalVariables = defaults({ publicPath: JSON.stringify(publicPath) }, variables)

let PostCSSPlugins = [
  PostCSSAutoprefixer({
    browsers: [
      'last 10 version',
      'ie >= 9'
    ]
  })
]

forEach(PluginsOptions, ({ name, options }) => {
  if (name === 'postcss-pxtorem') {
    options = defaults({}, options, {
      rootValue: 16,
      unitPrecision: 5,
      propList: ['*'],
      propWhiteList: ['*'],
      selectorBlackList: ['html'],
      replace: true,
      mediaQuery: false,
      minPixelValue: 0
    })

    PostCSSPlugins.push(PostCSSPxToRem(options))
  }
})

/**
 * Entries definitions
 */
export const Entries = {}

/**
 * reolve path definitions
 */
export const ResolveModules = [
  path.join(execDir, 'node_modules'),
  path.join(rootDir, 'node_modules'),
  srcDir, tmpDir
]

/**
 * Plugins definitions
 */
export const Plugins = [
  /**
   * Clean generate folders
   * run it first to reset the project.
   */
  new CleanWebpackPlugin([ tmpDir, distDir ], {
    root: '/',
    verbose: true,
    dry: false
  }),

  /**
   * Define some global variables
   */
  new DefinePlugin(GlobalVariables),

  /**
   * Extract common modules
   * to reduce code duplication
   */
  new CommonsChunkPlugin({
    name: 'vendor',
    minChunks: (module) => /node_modules/.test(module.resource)
  }),

  /**
   * Extract style file
   * Inline styles can be externally optimized for loading
   */
  new ExtractTextPlugin({
    filename: 'styles/[name].[contenthash].css',
    allChunks: true
  }),

  /**
   * Copy files
   */
  new CopyWebpackPlugin([
    {
      from: path.join(srcDir, 'assets/panels/**'),
      to: path.join(distDir, 'assets/panels/'),
      flatten: true
    },
    /**
     * 临时解决办法, 更新后删除
     * docs: https://github.com/jantimon/favicons-webpack-plugin/issues/52
     */
    {
      from: path.join(srcDir, 'assets/favicons/favicon.ico'),
      to: path.join(distDir, '/favicon.ico'),
      flatten: true
    }
  ]),

  /**
   * Generate all static resource
   * manifest json file
   */
  new ManifestPlugin()
]

/**
 * Generate some compile tasks
 */
generateEnteries(Plugins, Entries)
generateFavicons(Plugins)
generateSVGSprites(Plugins, Entries)
let spriteGenerated = generateSprites(Plugins)

/**
 * loader and rules definitions
 */
export const Rules = [
  {
    test: /\.html$/,
    use: [
      {
        loader: 'html-loader',
        options: {
          attrs: ['img:src', 'img:ng-src']
        }
      }
    ]
  },
  {
    test: /\.pug$/,
    use: [
      {
        loader: 'pug-loader'
      }
    ]
  },
  /**
   * docs:
   * - https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/263
   */
  {
    test: /\.(sass|s?css)$/,
    use: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: [
        {
          loader: 'css-loader',
          options: {
            minimize: true
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            plugins: PostCSSPlugins
          }
        },
        {
          loader: 'sass-loader',
          options: {
            includePaths: ResolveModules,
            data: [spriteGenerated ? '@import "sprites";' : ''].join('\n')
          }
        }
      ]
    })
  },
  {
    test: /\.js$/,
    use: [
      {
        loader: 'ng-annotate-loader',
        options: {
          es6: true
        }
      },
      /**
       * babel@6.0.0 break the .babelrc file
       * so configure presets below
       * docs:
       * - https://github.com/babel/babel-loader/issues/166
       */
      {
        loader: 'babel-loader',
        options: {
          babelrc: path.join(rootDir, './.babelrc')
        }
      }
    ],
    exclude: [/node_modules/]
  },
  /**
   * 少于 1K 图片用 base64
   * url-loader 依赖 file-loader
   */
  {
    test: /\.(jpe?g|png|gif|woff|woff2|eot|ttf|svg)$/i,
    use: [
      {
        loader: 'url-loader',
        options: {
          limit: 1 * 1024,
          name: 'panels/[name].[hash].[ext]'
        }
      }
    ]
  }
]

let WebpackDefaultSettings = {
  entry: Entries,
  output: {
    path: distDir,
    publicPath: publicPath,
    filename: '[name].js'
  },
  node: {
    __filename: true,
    __dirname: true
  },
  module: {
    rules: Rules
  },
  resolve: {
    modules: ResolveModules
  },
  resolveLoader: {
    modules: ResolveModules
  },
  plugins: Plugins
}

let rootConfigFile = path.join(rootDir, 'webpack.ngwp.config.babel.js')
if (fs.existsSync(rootConfigFile)) {
  let options = fs.readJSONSync(path.join(execDir, '.babelrc'))
  require('babel-register', options)
  WebpackDefaultSettings = require(rootConfigFile).default(clone(WebpackDefaultSettings))
}

/**
 * Webpack Setting
 */
export default WebpackDefaultSettings

/**
 * Auto generate entries
 * Generate entries dependent on folder (src/entry/{folder})
 * And entry js file must be named 'index.js'
 */
export function generateEnteries (plugins, entries) {
  if (!isArray(plugins)) {
    throw new Error('Parameter plugins must be a array.')
  }

  if (!isObject(entries)) {
    throw new Error('Parameter entries must be a object.')
  }

  let modules = []
  forEach(Modules, (module) => {
    if (!module.entry) {
      return
    }

    let file = path.join(rootDir, module.entry)
    if (!fs.existsSync(file)) {
      throw new Error(`Entry file ${module.entry} is not found`)
    }

    let dir = path.dirname(file)
    let name = path.basename(dir)

    modules.push({ file, dir, name })
  })

  if (modules.length === 0) {
    throw new Error('Entry is not found')
  }

  let names = map(modules, 'name')
  forEach(modules, ({ file, dir, name }) => {
    entries[name] = [
      'babel-polyfill',
      file
    ]

    /**
     * reanme entry html
     */
    let options = {
      filename: path.join(distDir, `${name}.html`),
      serviceWorker: '/service-worker.js'
    }

    /**
     * use template when then template file exists
     */
    let templateFile = path.join(dir, 'index.pug')
    fs.existsSync(templateFile) && assign(options, { template: templateFile })

    /**
     * clean other static resources
     */
    let excludeChunks = without(names, name)
    assign(options, { excludeChunks })

    let htmlPlugin = new HtmlWebpackPlugin(options)
    plugins.push(htmlPlugin)

    return true
  })
}

/**
 * auto split logo task
 * if logo file not exists, this task will not be executed.
 */
export function generateFavicons (plugins) {
  if (!isArray(plugins)) {
    throw new Error('Parameter plugins must be a array.')
  }

  let logoFile = path.join(srcDir, './assets/panels/logo.png')
  if (fs.existsSync(logoFile)) {
    let statsFile = 'favicon/iconstats.json'
    let plugin = new FaviconsWebpackPlugin({
      title: projectName,
      logo: logoFile,
      prefix: 'favicon/[hash]/',
      emitStats: true,
      statsFilename: statsFile,
      persistentCache: true,
      inject: true,
      background: '#fff',
      icons: {
        android: true,
        appleIcon: true,
        appleStartup: false,
        coast: false,
        favicons: true,
        firefox: true,
        opengraph: false,
        twitter: false,
        yandex: false,
        windows: false
      }
    })

    plugins.push(plugin)

    return true
  }

  return false
}

/**
 * Auto concat sprite image
 * if the sprite folder (src/assets/sprites/images/) not exists,
 * this task will not be excuted.
 */
export function generateSprites (plugins) {
  if (!isArray(plugins)) {
    throw new Error('Parameter plugins must be a array.')
  }

  let spriteDir = path.join(srcDir, './assets/sprites/images')
  let files = fs.readdirSync(spriteDir)
  let images = filter(files, (file) => /(\.png|\.gif|\.jpg)$/.test(file))

  if (images.length === 0) {
    return false
  }

  let spriteTemplate = path.join(spriteDir, 'sprite.scss.template.handlebars')
  if (fs.existsSync(spriteDir) && fs.lstatSync(spriteDir).isDirectory() && fs.existsSync(spriteTemplate)) {
    let source = fs.readFileSync(spriteTemplate, 'utf8')
    SpritesmithTemplate.addHandlebarsTemplate('spriteScssTemplate', source)

    let plugin = new SpritesmithPlugin({
      src: {
        cwd: spriteDir,
        glob: '**/*.{png,gif,jpg}'
      },
      target: {
        image: path.join(tmpDir, 'sprites.png'),
        css: [
          [
            path.join(tmpDir, 'sprites.scss'),
            {
              format: 'spriteScssTemplate'
            }
          ]
        ]
      },
      apiOptions: {
        cssImageRef: '~sprites.png'
      },
      spritesmithOptions: {
        functions: true,
        padding: 10
      }
    })

    plugins.push(plugin)

    return true
  }

  return false
}

/**
 * Auto concat svg sprite image
 * if the sprite folder (src/assets/sprites/svg/) not exists,
 * this task will not be excuted.
 */
export function generateSVGSprites (plugins, entries) {
  if (!isArray(plugins)) {
    throw new Error('Parameter plugins must be a array.')
  }

  let spriteDir = path.join(srcDir, './assets/sprites/svg')
  let spriteTemplate = path.join(spriteDir, 'svgstore.config.js')

  if (fs.existsSync(spriteDir) && fs.lstatSync(spriteDir).isDirectory() && fs.existsSync(spriteTemplate)) {
    let files = fs.readdirSync(spriteDir)
    let images = filter(files, (file) => /\.svg$/.test(file))

    if (images.length === 0) {
      return false
    }

    assign(Entries, { svgstore: spriteTemplate })

    let plugin = new SvgStore({
      prefix: 'sp-svg-',
      svgoOptions: {
        plugins: [
          { removeComments: true },
          { removeMetadata: true },
          { removeTitle: true },
          { removeDesc: true },
          { removeUselessDefs: true },
          { removeXMLNS: true },
          { minifyStyles: true },
          { cleanupIDs: true },
          { removeEmptyText: true },
          { convertColors: true },
          { convertPathData: true },
          { convertTransform: true },
          { removeUnknownsAndDefaults: true },
          { removeUnusedNS: true },
          /**
           * svg in webkit old browser, it not support use (reference)
           * it must use '<use xlink:href="url#id"></use>'
           * and because svgo(https://github.com/svg/svgo) do not set
           * 'xmlns:xlink="http://www.w3.org/1999/xlink"', so it make
           * origin svg content with use tag lack 'namespace' 'prefix',
           * and it make svg display success.
           *
           * SVG 在 webkit 低版本浏览器中不支持内联 use
           * 必须使用 <use xlink:href="url#id"></use>
           * 又因为 svgo 并没有设置 xmlns:xlink="http://www.w3.org/1999/xlink"
           * 因此会使原本 svg 内含有 use 缺少 namespace prefix 的问题, 导致没法兼容加载,
           * 导致外部不能成功导入
           *
           * Error Code:
           * This page contains the following errors:
           * error on line 1 at column 15734: Namespace prefix xlink for href on use is not defined
           * Below is a rendering of the page up to the first error.
           *
           * Browser: Chrome 48.0.2564.23:
           * Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N)
           * AppleWebKit/537.36 (KHTML, like Gecko)
           * Chrome/48.0.2564.23
           * Mobile Safari/537.36
           * wechatdevtools/0.7.0
           * MicroMessenger/6.3.22
           * webview/0
           *
           * Docs : https://github.com/svg/svgo/blob/master/docs/how-it-works/en.md#3-plugins
           * API  : https://github.com/svg/svgo/blob/master/docs/how-it-works/en.md#32-api
           */
          {
            downwardCompatible: {
              type: 'perItem',
              active: true,
              description: 'Backward compatibility, <use> add attribute xmlns:xlink="http://www.w3.org/1999/xlink"',
              params: {},
              fn (item) {
                if (item.isElem('use') && !hasAttr(item, 'xmlns:xlink')) {
                  setAttr(item, 'xmlns:xlink', 'http://www.w3.org/1999/xlink')
                }
              }
            }
          }
        ]
      }
    })

    plugins.push(plugin)
    return true
  }

  return false

  function hasAttr (item, name) {
    let [prefix, local] = name.split(':')
    return indexOf(item.attrs, { name, prefix, local }) !== -1
  }

  function setAttr (item, name, value) {
    let [prefix, local] = name.split(':')
    item.attrs[name] = { value, name, prefix, local }
  }
}
