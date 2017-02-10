import _                      from 'lodash';
import fs                     from 'fs-extra';
import path                   from 'path';
import async                  from 'async';
import { expect }             from 'chai';
import { execFile }           from 'child_process';
import { ROOT_PATH, TMP_DIR } from '../../conf/config';
import { generateRouter }     from '../../bin/libs/module';

describe('Module builder', function () {
  describe('Test Generate', function () {
    it('should compile handlebars file and copy other files.', function (done) {
      let mName           = '' + Date.now();
      let cName           = '' + Date.now();
      let srcModuleFolder = path.join(ROOT_PATH, './bin/libs/templates/module');
      let srcCompFolder   = path.join(ROOT_PATH, './bin/libs/templates/component');
      let tarFolder       = path.join(ROOT_PATH, TMP_DIR, 'unitest/builder/module');
      let absModuleFolder = path.join(tarFolder, mName);
      let absCompFolder   = path.join(tarFolder, mName, 'components', cName);

      generateRouter(mName + '/' + cName, { dist: tarFolder }, function (error) {
        if (error) {
          throw error;
        }

        expect(fs.existsSync(absModuleFolder)).to.be.true;
        expect(fs.existsSync(absCompFolder)).to.be.true;

        let mFiles = fs.readdirSync(absModuleFolder);
        expect(mFiles.length).to.not.equal(0);

        let cFiles = fs.readdirSync(absCompFolder);
        expect(cFiles.length).to.not.equal(0);

        async.parallel([
          compareFolder.bind(null, srcModuleFolder, tarFolder, { tarTruthlyFolder: absModuleFolder }),
          compareFolder.bind(null, srcCompFolder, tarFolder, { tarTruthlyFolder: absCompFolder }),
        ],
        function (error) {
          if (error) {
            throw error;
          }

          fs.removeSync(tarFolder);
          done();
        });
      });
    });
  });

  describe('Ability to use', function () {
    it('can use module', function () {
    });

    it('can use component', function () {
    });
  });
});

/**
 * Compare files from folders.
 * handlebars files will be compiled to js, css, jade or other files.
 * So compareFile will check file which is handlebars file (.hbs),
 * and replace suffix then compare them.
 */

function compareFolder (srcFolder, tarFolder, options, callback) {
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

function compareFile (srcFiles, tarFiles, srcFolder, tarFolder, callback) {
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
