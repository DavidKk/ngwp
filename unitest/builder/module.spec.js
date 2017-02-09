import _            from 'lodash';
import fs           from 'fs-extra';
import path         from 'path';
import async        from 'async';
import { expect }   from 'chai';
import { execFile } from 'child_process';
import {
  ROOT_PATH,
  TMP_DIR,
}                   from '../../conf/config';
import {
  generateModule,
  generateComponent,
}                   from '../../bin/libs/module';

describe('Module builder', function () {
  describe('Generate module', function () {
    let name             = '' + Date.now();
    let srcFolder        = path.join(ROOT_PATH, './bin/libs/templates/module');
    let tarFolder        = path.join(ROOT_PATH, TMP_DIR, 'unitest/builder/module');
    let tarTruthlyFolder = path.join(tarFolder, name);

    before(function (done) {
      fs.removeSync(tarFolder);

      generateModule(name, { distFolder: tarFolder }, function (error) {
        if (error) {
          throw error;
        }

        done();
      });
    });

    after(function () {
      fs.removeSync(tarFolder);
    });

    it('can build module', function () {
      expect(fs.existsSync(tarTruthlyFolder)).to.be.true;

      let files = fs.readdirSync(tarTruthlyFolder);
      expect(files.length).to.not.equal(0);
    });

    it('can render handlebars file to js, css and other files.', function (done) {
      compareFolder(srcFolder, tarFolder, { tarTruthlyFolder }, function (error) {
        if (error) {
          throw error;
        }

        done();
      });
    });
  });

  describe('Generate router', function () {
    let name             = '' + Date.now();
    let family           = ['unitest'];
    let srcFolder        = path.join(ROOT_PATH, './bin/libs/templates/component');
    let tarFolder        = path.join(ROOT_PATH, TMP_DIR, 'unitest/builder/router');
    let tarTruthlyFolder = path.join(tarFolder, family.join('\/'), 'components', name);

    before(function (done) {
      fs.removeSync(tarFolder);

      generateComponent(name, family, { distFolder: tarFolder }, function (error) {
        if (error) {
          throw error;
        }

        done();
      });
    });

    after(function () {
      fs.removeSync(tarFolder);
    });

    it('can build router and auto build parent folder.', function () {
      expect(fs.existsSync(tarTruthlyFolder)).to.be.true;

      let files = fs.readdirSync(tarTruthlyFolder);
      expect(files.length).to.not.equal(0);
    });

    it('can render handlebars file to js, css and other files.', function (done) {
      compareFolder(srcFolder, tarFolder, { tarTruthlyFolder }, function (error) {
        if (error) {
          throw error;
        }

        done();
      });
    });
  });

  describe('Use CLI to generate', function () {
    let moduleName      = '' + Date.now();
    let componentName   = '' + Date.now();
    let tarFolder       = path.join(ROOT_PATH, TMP_DIR, 'unitest/builder/cli');
    let moduleFolder    = path.join(tarFolder, moduleName);
    let componentFolder = path.join(tarFolder, moduleName, 'components', componentName);

    after(function () {
      fs.removeSync(tarFolder);
    });

    it('can use \'./bin/module router module/component\'', function (done) {
      execFile('./bin/module', ['router', [moduleName, componentName].join('\/'), '--dist', tarFolder], {}, function (error) {
        if (error) {
          throw error;
        }

        expect(fs.existsSync(moduleFolder)).to.be.true;
        expect(fs.existsSync(componentFolder)).to.be.true;

        let mFiles = fs.readdirSync(moduleFolder);
        expect(mFiles.length).to.not.equal(0);

        let cFiles = fs.readdirSync(componentFolder);
        expect(cFiles.length).to.not.equal(0);

        done();
      });
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