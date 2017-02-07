import path              from 'path';
import webpack           from 'webpack';
import WebpackMerger     from 'webpack-merge';
import BrowserSyncPlugin from 'browser-sync-webpack-plugin';
import webpackConfig     from './webpack.common.config.babel';
import {
  CLIENT_PORT,

  ROOT_PATH,

  DISTRICT_PATH,
  ENTRY_PATH,
}                        from './config';

export default WebpackMerger(webpackConfig, {
  debug   : true,
  devtool : 'source-map',
  plugins : [
    /**
     * BrowserSync Plugin
     * local test but weinre not support https
     * docs: https://www.browsersync.io
     */
    new BrowserSyncPlugin({
      host      : 'localhost',
      port      : CLIENT_PORT,
      open      : false,
      logLevel  : 'debug',
      server    : {
        baseDir : [DISTRICT_PATH],
      },
      ui: {
        port: CLIENT_PORT + 1,
        weinre: {
          port: CLIENT_PORT + 2,
        },
      },
    }),
  ],
});
