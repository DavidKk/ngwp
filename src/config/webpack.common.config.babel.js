import fs from 'fs-extra'
import path from 'path'
import map from 'lodash/map'
import assign from 'lodash/assign'
import without from 'lodash/without'
import isArray from 'lodash/isArray'
import indexOf from 'lodash/indexOf'
import forEach from 'lodash/forEach'
import isObject from 'lodash/isObject'
import isString from 'lodash/isString'
import isFunction from 'lodash/isFunction'
import filter from 'lodash/filter'
import defaults from 'lodash/defaults'
import webpack from 'webpack'
import CleanWebpackPlugin from 'clean-webpack-plugin'
import SpritesmithTemplate from 'spritesheet-templates'
import SpritesmithPlugin from 'webpack-spritesmith'
import SvgStore from 'webpack-svgstore-plugin'
import FaviconsWebpackPlugin from 'favicons-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import autoprefixer from 'autoprefixer'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import { execDir, rootDir, srcDir, distDir, tmpDir, publicPath, variables, modules as Modules } from '../share/configuration'

const { DefinePlugin } = webpack
const { CommonsChunkPlugin } = webpack.optimize
const GlobalVariables = defaults({ publicPath: JSON.stringify(publicPath) }, variables)

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
      from: path.join(rootDir, 'assets/panels/**'),
      to: path.join(distDir, 'assets/panels/'),
      flatten: true
    }
  ]),

  /**
   * Clean generate folders
   * run it first to reset the project.
   */
  new CleanWebpackPlugin([ tmpDir, distDir ], {
    root: '/',
    verbose: true,
    dry: false
  })
]

export const Injector = InjectScriptPlugin(Plugins)
export const CallAfter = WithDonePlugin(Plugins)

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
  {
    test: /\.css$/,
    use: ExtractTextPlugin.extract({
      fallback: 'style-loader',
      use: [
        {
          loader: 'css-loader',
          options: {
            minimize: true
          }
        }
      ]
    })
  },
  /**
   * docs:
   * - https://github.com/webpack-contrib/extract-text-webpack-plugin/issues/263
   */
  {
    test: /\.(sass|scss)$/,
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
          loader: 'sass-loader',
          options: {
            includePaths: ResolveModules,
            data: [spriteGenerated ? '@import "sprites";' : ''].join('\n')
          }
        },
        {
          loader: 'postcss-loader',
          options: {
            plugins: [
              autoprefixer({
                browsers: [
                  'last 10 version',
                  'ie >= 9'
                ]
              })
            ]
          }
        }
      ]
    })
  },
  {
    test: /\.js$/,
    use: [
      {
        loader: 'ng-annotate-loader'
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
          plugins: [
            require.resolve('babel-plugin-transform-decorators-legacy'),
            require.resolve('babel-plugin-transform-export-extensions')
          ],
          presets: [
            require.resolve('babel-preset-es2015'),
            require.resolve('babel-preset-stage-0')
          ]
        }
      }
    ],
    exclude: [/node_modules/]
  },
  /**
   * 少于 10K 图片用 base64
   * url-loader 依赖 file-loader
   */
  {
    test: /\.(jpe?g|png|gif)$/i,
    use: [
      {
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: 'panels/[name].[hash].[ext]'
        }
      }
    ]
  }
]

/**
 * Webpack Setting
 */
export default {
  entry: Entries,
  output: {
    path: distDir,
    publicPath: publicPath,
    filename: '[name].js'
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
      filename: path.join(distDir, `${name}.html`)
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

    let plugin = new HtmlWebpackPlugin(options)
    plugins.push(plugin)

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

    /**
     * after compile, it will generate 'favicon.ico' file
     * and copy it to the root path.
     */
    CallAfter.add(() => {
      let sourceFile = path.join(distDir, statsFile)
      if (!fs.existsSync(sourceFile)) {
        return
      }

      let stats = fs.readJsonSync(sourceFile)
      let favFile = path.join(distDir, stats.outputFilePrefix, 'favicon.ico')
      let faviconFile = path.join(distDir, 'favicon.ico')

      fs.copySync(favFile, faviconFile)
    })

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

/**
 * Callback after webpack excutes
 */
export function WithDonePlugin (plugins) {
  if (!isArray(plugins)) {
    throw new Error('Parameter plugins must be a array.')
  }

  let instance = {
    _callbacks: [],
    add (callback) {
      isFunction(callback) && this._callbacks.push(callback)
    },
    done () {
      forEach(this._callbacks, (callback) => callback())
    }
  }

  plugins.push({
    apply (compiler) {
      compiler.plugin('done', instance.done.bind(instance))
    }
  })

  return instance
}

/**
 * Inject script to entry html file
 */
export function InjectScriptPlugin (plugins) {
  if (!isArray(plugins)) {
    throw new Error('Parameter plugins must be a array.')
  }

  let instance = {
    _injector: [],
    _callbacks: [],
    inject (source) {
      if (!isString(source)) {
        return false
      }

      let hash = mkhash(source)
      if (indexOf(this._injector, { hash }) !== -1) {
        return false
      }

      let script = `!(function () {
        var id = 'webpack-${hash}';
        if ('undefined' === typeof window || document.getElementById(id)) {
          return;
        }

        var node = document.createElement('script');
        node.id = id;
        node.innerHTML = '${source}';

        document.head.appendChild(node);
      })();`

      this._injector.push({ hash, script })
    },
    after (callback) {
      isFunction(callback) && this._callbacks.push(callback)
    }
  }

  plugins.push({
    autoloadScript () {
      let scripts = []
      forEach(instance._injector, (injector) => scripts.push(injector.script))
      return scripts.join('\n')
    },
    scriptTag (source) {
      let injector = this.autoloadScript()
      return injector + source
    },
    applyCompilation (compilation) {
      compilation.mainTemplate.plugin('startup', this.scriptTag.bind(this))
    },
    applyDone () {
      forEach(instance._callbacks, (injector) => injector())
      instance._callbacks.splice(0)
    },
    apply (compiler) {
      /**
       * sometimes it will trigger twice or more,
       * the core-code just exec once, see below function autoloadScript.
       */
      compiler.plugin('compilation', this.applyCompilation.bind(this))
      compiler.plugin('done', this.applyDone.bind(this))
    }
  })

  return instance
}

/**
 * make hash code
 * See: http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery?answertab=active#tab-top
 */
function mkhash (string) {
  string = JSON.stringify(string)

  let hash = 0
  if (string.length === 0) {
    return hash
  }

  for (let i = 0, l = string.length; i < l; i++) {
    let chr = string.charCodeAt(i)
    hash = (hash << 5) - hash + chr

    /**
     * Convert to 32bit integer
     */
    hash |= 0
  }

  return hash
}
