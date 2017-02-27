/* eslint max-nested-callbacks: off */
/* eslint-env mocha */

import _          from 'lodash';
import fs         from 'fs-extra';
import path       from 'path';
import async      from 'async';
import { expect } from 'chai';
import {
  mkRoute,
  mkModule,
  mkComponent,
}                 from '../src/libs/builder';
import {
  EXEC_PATH,
  TEMPORARY_FOLDER_NAME,
}                 from '../src/conf/config';

import { Server } from 'karma';

describe('Module builder', function () {
  describe('Test Generating', function () {
    it('should generate module', function (done) {
      let mName            = 'mdlname';
      let srcFolder        = path.join(EXEC_PATH, './templates/module');
      let tarFolder        = path.join(EXEC_PATH, TEMPORARY_FOLDER_NAME, 'unitest/builder/gm');
      let tarTruthlyFolder = path.join(tarFolder, mName);

      fs.removeSync(tarFolder);

      mkModule(mName, {
        ignoreTrace : true,
        basePath    : '',
        distFolder  : tarFolder,
      },
      function (error) {
        expect(error).to.not.be.an('error');
        expect(fs.existsSync(tarTruthlyFolder)).to.be.true;

        let files = fs.readdirSync(tarTruthlyFolder);
        expect(files.length).to.not.equal(0);

        compareFolder(srcFolder, tarFolder, { tarTruthlyFolder }, function (error) {
          expect(error).to.not.be.an('error');

          fs.removeSync(tarFolder);

          done();
        });
      });
    });

    it('should generate component', function (done) {
      let mName            = 'mdlname';
      let family           = ['unitest'];
      let srcFolder        = path.join(EXEC_PATH, './templates/component');
      let tarFolder        = path.join(EXEC_PATH, TEMPORARY_FOLDER_NAME, 'unitest/builder/gc');
      let tarTruthlyFolder = path.join(tarFolder, family.join('\/'), 'components', mName);

      fs.removeSync(tarFolder);

      mkComponent(mName, family, {
        ignoreTrace : true,
        basePath    : '',
        distFolder  : tarFolder,
      },
      function (error) {
        expect(error).to.not.be.an('error');
        expect(fs.existsSync(tarTruthlyFolder)).to.be.true;

        let files = fs.readdirSync(tarTruthlyFolder);
        expect(files.length).to.not.equal(0);

        compareFolder(srcFolder, tarFolder, { tarTruthlyFolder }, function (error) {
          expect(error).to.not.be.an('error');

          fs.removeSync(tarFolder);
          done();
        });
      });
    });

    it('should ability to generate multiple component', function (done) {
      let mName           = 'mdlname';
      let cName           = 'cpnname';
      let srcCompFolder   = path.join(EXEC_PATH, './templates/component');
      let tarFolder       = path.join(EXEC_PATH, TEMPORARY_FOLDER_NAME, 'unitest/builder/gr');
      let absCompFolder   = path.join(tarFolder, mName, 'components', cName);
      let subCompFolder   = path.join(absCompFolder, 'components/chilren')

      fs.removeSync(tarFolder);

      mkRoute(cName + '/chilren', mName, {
        basePath   : '',
        distFolder : tarFolder,
      },
      function (error) {
        expect(error).to.not.be.an('error');
        expect(fs.existsSync(absCompFolder)).to.be.true;

        let cFiles = fs.readdirSync(absCompFolder);
        expect(cFiles.length).to.not.equal(0);

        async.parallel([
          compareFolder.bind(null, srcCompFolder, tarFolder, { tarTruthlyFolder: absCompFolder }),
          compareFolder.bind(null, srcCompFolder, absCompFolder, { tarTruthlyFolder: subCompFolder }),
        ],
        function (error) {
          expect(error).to.not.be.an('error');

          fs.removeSync(tarFolder);
          done();
        });
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
