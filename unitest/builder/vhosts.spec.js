import './vhosts.helper';

import _           from 'lodash';
import fs          from 'fs-extra';
import path        from 'path';
import { expect }  from 'chai';
import { mkVhost } from '../../scripts/libs/vhosts';
import {
  ROOT_PATH,
  TMP_DIR,
  LOG_DIR,
}                  from '../../conf/config';

describe('VHost Generator', function () {
  describe('Test Generate', function () {
    it('should configure and generate nginx config file', function (done) {
      let tpl      = path.join(__dirname, './vhost.conf.hbs');
      let folder   = path.join(ROOT_PATH, TMP_DIR, './unitest/vhosts/2');
      let file     = path.join(folder, './vhosts.conf');
      let logsPath = path.join(folder, 'logs');
      let rootPath = path.join(folder, 'apps');

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
        distFile : file,
        template : tpl,
        rootPath : rootPath,
        logsPath : logsPath,

        useHttps : true,
        certPath : path.join(__dirname, './certs'),
        certFile : 'cert.pem',
        certKey  : 'cert.key',
      };

      fs.removeSync(folder);

      mkVhost(modules, config, function (error) {
        expect(error).to.not.be.an('error');

        expect(fs.existsSync(file)).to.be.true;

        let source = fs.readJSONSync(file);
        expect(_.isPlainObject(source)).to.be.true;

        expect(source.logsPath).to.equal(logsPath);
        expect(source.rootPath).to.equal(rootPath);
        expect(fs.existsSync(logsPath)).to.be.true;

        expect(source.certPath).to.equal(config.certPath);
        expect(source.certFile).to.equal(config.certFile);
        expect(source.certKey).to.equal(config.certKey);

        expect(source.modules).to.be.instanceof(Array);
        expect(source.modules.length).to.be.equal(2);
        expect(JSON.stringify(source.modules)).to.equal(JSON.stringify(modules));

        fs.removeSync(file);
        done();
      });
    })
  });
});
