import path               from 'path';
import webpack            from 'webpack';
import WebpackMerger      from 'webpack-merge';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import ExtractTextPlugin  from 'extract-text-webpack-plugin';
import {
  ROOT_PATH,

  TMP_DIR,
  DEV_DIR,
  DIST_DIR,
  COVERAGE_DIR,
}                         from './config';
import webpackConfig,
{
  generateSprites
}                         from './webpack.common.config.babel';


const plugins = [];
generateSprites(plugins);

export default WebpackMerger({
  devtool: 'inline-source-map',
  entry: {
    'babel-polyfill': 'babel-polyfill',
  },
  output        : webpackConfig.output,
  module        : webpackConfig.module,
  resolve       : webpackConfig.resolve,
  resolveLoader : webpackConfig.resolveLoader,
  sassLoader    : webpackConfig.sassLoader,
  stylelint     : webpackConfig.stylelint,
  eslint        : webpackConfig.eslint,
  postcss       : webpackConfig.postcss,
  plugins: [
    /**
     * 定义环境变量
     * 在JS中可以查找到相应的变量
     */
    new webpack.DefinePlugin({
      __DEVELOP__    : !!process.env.DEVELOP,
      __PRODUCT__    : !!process.env.PRODUCT,
      __UNITEST__    : !!process.env.UNITEST,
    }),

    /**
     * 查找相等或近似的模块
     */
    new webpack.optimize.DedupePlugin(),

    /**
     * 外置样式文件
     * 内嵌样式能外置, 优化加载
     */
    new ExtractTextPlugin('styles/[name].[contenthash].css', {
      allChunks: true,
    }),

    /**
     * 清除生成的目录路径
     * 每次生成都是新的环境
     */
    new CleanWebpackPlugin([
      DEV_DIR,
      DIST_DIR,
      COVERAGE_DIR,
    ],
    {
      root      : ROOT_PATH,
      verbose   : true,
      dry       : false,
    }),
  ]
  .concat(plugins),
},
/**
 * sinon 暂时必须这样配置
 * UMD 模式导致编译后运行错误
 * Error: modules[moduleId].call is not a function
 * Issue: https://github.com/webpack/webpack/issues/304
 * @todo 后面版本修复后删除
 */
{
  module: {
    noParse: [
      /node_modules\/sinon\//,
    ],
  },
  resolve: {
    alias: {
      sinon: 'sinon/pkg/sinon.js',
    },
  },
},
/**
 * 单元测试源码 loader
 * 通过 coverage 可以观察到源码
 * 覆盖情况
 */
{
  module: {
    preLoaders: [
      {
        test    : /\.js$/,
        loader  : 'isparta',
        include : webpackConfig.resolve.root,
        exclude : [/node_modules/, new RegExp(TMP_DIR)],
      },
    ],
  },
});
