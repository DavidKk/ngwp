import _                 from 'lodash';
import fs                from 'fs-extra';
import path              from 'path';
import async             from 'async';
import colors            from 'colors';
import { transformFile } from 'babel-core';
import {
  printStats,
  trace,
}                        from './libs/utils';

makefile();

export function makefile () {
  let startTime = Date.now();

  convertBabel(__dirname, path.join(__dirname, '../dist'), {
    rename (file) {
      return file.replace(/\.babel\.js/, '.js');
    },
  },
  function (error, stats) {
    /* istanbul ignore if */
    if (error) {
      throw error;
    }

    trace('Generator: makefiles');
    trace(`Time: ${colors.bold(colors.white(Date.now() - startTime))}ms\n`);

    printStats(stats);
  });
}

export function convertBabel (folder, destination, options, callback) {
  let tasks = _.map(fs.readdirSync(folder), function (filename) {
    return function (callback) {
      let file    = path.join(folder, filename);
      let target  = path.join(destination, filename);

      if (fs.statSync(file).isDirectory()) {
        fs.ensureDir(target);

        convertBabel(file, target, options, callback);
        return;
      }

      if (!/\.js$/.test(filename)) {
        callback(null);
        return;
      }

      transformFile(file, { sourceMaps: true }, function (error, result) {
        if (error) {
          callback(error);
          return;
        }

        let { code, map } = result;
        let jsFile        = _.isFunction(options.rename) ? options.rename(target) : target;
        let mapFile       = jsFile + '.map';

        async.parallel([
          function (callback) {
            let content = code + '\n//# sourceMappingURL=' + path.basename(mapFile);
            fs.writeFile(jsFile, content, function () {
              if (error) {
                callback(error);
                return;
              }

              callback(null, { assets: jsFile, size: content.length });
            });
          },
          function (callback) {
            let content = JSON.stringify(map);
            fs.writeFile(mapFile, content, function (error) {
              if (error) {
                callback(error);
                return;
              }

              callback(null, { assets: mapFile, size: content.length });
            });
          },
        ],
        function (error, stats) {
          if (error) {
            callback(error);
            return;
          }

          callback(null, stats);
        });
      });
    };
  });

  async.parallel(tasks, function (error, stats) {
    if (error) {
      callback(error);
      return;
    }

    stats = _.flattenDeep(stats);
    stats = _.filter(stats);

    callback(null, stats);
  });
}
