import _     from 'lodash';
import fs    from 'fs-extra';
import path  from 'path';
import async from 'async';

/**
 * Compare files from folders.
 * handlebars files will be compiled to js, css, jade or other files.
 * So compareFile will check file which is handlebars file (.hbs),
 * and replace suffix then compare them.
 */

export function compareFolder (srcFolder, tarFolder, options, callback) {
  if (4 > arguments.length) {
    return compareFolder(srcFolder, tarFolder, {}, options);
  }

  if (!_.isFunction(callback)) {
    throw new Error('compareFolder: callback is not provided.');
  }

  options = _.defaultsDeep(options, {
    tarTruthlyFolder: tarFolder,
  });

  async.parallel([
    fs.readdir.bind(fs, srcFolder),
    fs.readdir.bind(fs, tarFolder),
  ],
  function (error, [srcFiles, tarFiles]) {
    if (error) {
      callback(error);
      return;
    }

    compareFile(srcFiles, tarFiles, srcFolder, options.tarTruthlyFolder, callback);
  });
}

export function compareFile (srcFiles, tarFiles, srcFolder, tarFolder, callback) {
  if (!_.isFunction(callback)) {
    throw new Error('compareFile: callback is not provided.');
  }

  let tasks = _.map(srcFiles, function (filename) {
    return function (callback) {
      if (/^\.[\w]+/.test(filename)) {
        callback(null);
        return;
      }

      let srcFile = path.join(srcFolder, filename);
      let tarFile = path.join(tarFolder, filename);

      if (/\.hbs$/.test(filename)) {
        tarFile = tarFile.replace(path.extname(tarFile), '');
      }

      if (fs.lstatSync(tarFile).isDirectory()) {
        if (!fs.existsSync(tarFile)) {
          callback(new Error(`Folder '${tarFile}' is not copy.`));
          return;
        }

        compareFolder(srcFile, tarFile, callback);
        return;
      }

      if (!fs.existsSync(tarFile)) {
        callback(new Error(`File '${tarFile}' is not build.`));
        return;
      }

      callback(null);
    };
  });

  async.parallel(tasks, function (error) {
    if (error) {
      callback(error);
      return;
    }

    callback(null);
  });
}
