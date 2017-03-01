/* eslint max-nested-callbacks: off */
/* eslint-env mocha */

import fs                from 'fs-extra';
import path              from 'path';
import async             from 'async';
import { expect }        from 'chai';
import { compareFolder } from './share/utils';
import {
  mkRoute,
  mkModule,
  mkComponent,
}                        from '../src/libs/builder';
import {
  EXEC_PATH,
  TEMPORARY_FOLDER_NAME,
}                        from '../src/conf/config';

describe('Module builder', function () {
  let srcPath = path.join(EXEC_PATH, './templates');
  let tmpPath = path.join(EXEC_PATH, TEMPORARY_FOLDER_NAME, 'test_builder_' + Date.now());

  after(function () {
    fs.removeSync(tmpPath);
  });

  describe('Test Generating', function () {
    it('should generate module', function (done) {
      let name      = 'test';
      let srcFolder = path.join(srcPath, 'module');
      let tarFolder = path.join(tmpPath, 'module');
      let absFolder = path.join(tarFolder, name);

      mkModule(name, {
        ignoreTrace : true,
        basePath    : '',
        distFolder  : tarFolder,
      },
      function (error) {
        expect(error).to.not.be.an('error');
        expect(fs.existsSync(absFolder)).to.be.true;

        let files = fs.readdirSync(absFolder);
        expect(files.length).to.not.equal(0);

        compareFolder(srcFolder, tarFolder, { tarTruthlyFolder: absFolder }, function (error) {
          expect(error).to.not.be.an('error');

          done();
        });
      });
    });

    it('should generate component', function (done) {
      let name      = 'test';
      let family    = ['unitest'];
      let srcFolder = path.join(srcPath, 'component');
      let tarFolder = path.join(tmpPath, 'component');
      let absFolder = path.join(tarFolder, family.join('\/'), 'components', name);

      mkComponent(name, family, {
        ignoreTrace : true,
        basePath    : '',
        distFolder  : tarFolder,
      },
      function (error) {
        expect(error).to.not.be.an('error');
        expect(fs.existsSync(absFolder)).to.be.true;

        let files = fs.readdirSync(absFolder);
        expect(files.length).to.not.equal(0);

        compareFolder(srcFolder, tarFolder, { tarTruthlyFolder: absFolder }, function (error) {
          expect(error).to.not.be.an('error');

          done();
        });
      });
    });

    it('should ability to generate multiple component', function (done) {
      let module    = 'test';
      let name      = 'test';
      let chilren   = 'chilren';

      let srcFolder = path.join(srcPath, 'component');
      let tarFolder = path.join(tmpPath, 'route');
      let absFolder = path.join(tarFolder, module, 'components', name);
      let subFolder = path.join(absFolder, 'components', chilren);

      mkRoute(`${name}/${chilren}`, module, {
        basePath   : '',
        distFolder : tarFolder,
      },
      function (error) {
        expect(error).to.not.be.an('error');
        expect(fs.existsSync(absFolder)).to.be.true;

        let cFiles = fs.readdirSync(absFolder);
        expect(cFiles.length).to.not.equal(0);

        async.parallel([
          compareFolder.bind(null, srcFolder, tarFolder, { tarTruthlyFolder: absFolder }),
          compareFolder.bind(null, srcFolder, absFolder, { tarTruthlyFolder: subFolder }),
        ],
        function (error) {
          expect(error).to.not.be.an('error');

          done();
        });
      });
    });
  });
});
