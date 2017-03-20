/* eslint max-nested-callbacks: off */
/* eslint-env mocha */

import fs                from 'fs-extra';
import path              from 'path';
import async             from 'async';
import { expect }        from 'chai';
import { initialize }    from '../src/libs/initialization.js';
import { compareFolder } from './share/utils';
import * as VARS         from '../src/conf/variables';

describe('Initialization', function () {
  let srcPath = path.join(VARS.EXEC_PATH, './templates');
  let tmpPath = path.join(VARS.EXEC_PATH, VARS.TEMPORARY_FOLDER_NAME, 'test_initialization_' + Date.now());

  after(function () {
    fs.removeSync(tmpPath);
  });

  describe('Test initialize a project', function () {
    it('should initialize a project', function (done) {
      let name        = 'test';
      let version     = '0.0.1';
      let description = 'some description';
      let srcFolder   = path.join(srcPath, 'project');
      let tarFolder   = path.join(tmpPath, name);

      initialize(name, {
        dist        : tarFolder,
        version     : version,
        description : description,
      },
      function (error) {
        expect(error).to.not.be.an('error');
        expect(fs.existsSync(tarFolder)).to.be.true;

        let files = fs.readdirSync(tarFolder);
        expect(files.length).to.not.equal(0);

        async.parallel([
          function (callback) {
            fs.readJson(path.join(tarFolder, 'package.json'), function (error, source) {
              expect(error).to.not.be.an('error');
              expect(source).to.be.an('object');

              expect(source.name).to.equal(name);
              expect(source.version).to.equal(version);
              expect(source.description).to.equal(description);

              callback(null);
            });
          },
          function (callback) {
            compareFolder(srcFolder, tarFolder, { tarTruthlyFolder: tarFolder }, function (error) {
              expect(error).to.not.be.an('error');

              callback(null);
            });
          },
        ],
        function () {
          done();
        });
      });
    });
  });
});
