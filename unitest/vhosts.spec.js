/* eslint max-nested-callbacks: off */
/* eslint-env mocha */

import './vhosts/vhosts.helper';

import _           from 'lodash';
import fs          from 'fs-extra';
import path        from 'path';
import { expect }  from 'chai';
import { mkVhost } from '../src/libs/vhosts';
import {
  EXEC_PATH,
  TEMPORARY_FOLDER_NAME,
}                  from '../src/conf/config';

describe('VHost Generator', function () {
  let srcPath = path.join(__dirname, './vhosts');
  let tmpPath = path.join(EXEC_PATH, TEMPORARY_FOLDER_NAME, 'test_vhosts_' + Date.now());

  after(function () {
    fs.removeSync(tmpPath);
  });

  describe('Test Generate', function () {
    it('should configure and generate nginx config file', function (done) {
      let tplFile   = path.join(srcPath, 'vhost.conf.hbs');
      let outFile   = path.join(tmpPath, './vhosts.conf');
      let logFolder = path.join(tmpPath, './logs');
      let appFolder = path.join(tmpPath, './apps');

      let modules = [
        {
          type      : 'cdn',
          domain    : ['cdn.example.com']
        },
        {
          type      : 'proxy',
          proxy     : '127.0.0.1',
          proxyPort : 8080,
          entries   : ['home'],
          domain    : ['www.example.com'],
        },
      ];

      let config = {
        trace    : true,
        distFile : outFile,
        template : tplFile,
        rootPath : appFolder,
        logsPath : logFolder,

        useHttps : true,
        certPath : path.join(__dirname, './vhosts/certs'),
        certFile : 'cert.pem',
        certKey  : 'cert.key',
      };

      mkVhost(modules, config, function (error) {
        expect(error).to.not.be.an('error');

        expect(fs.existsSync(outFile)).to.be.true;

        let source = fs.readJSONSync(outFile);
        expect(_.isPlainObject(source)).to.be.true;

        expect(source.logsPath).to.equal(logFolder);
        expect(source.rootPath).to.equal(appFolder);
        expect(fs.existsSync(logFolder)).to.be.true;

        expect(source.certPath).to.equal(config.certPath);
        expect(source.certFile).to.equal(config.certFile);
        expect(source.certKey).to.equal(config.certKey);

        expect(source.modules).to.be.instanceof(Array);
        expect(source.modules.length).to.be.equal(2);
        expect(JSON.stringify(source.modules)).to.equal(JSON.stringify(modules));

        done();
      });
    });
  });
});
