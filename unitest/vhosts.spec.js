/* eslint max-nested-callbacks: off */
/* eslint-env mocha */

import './vhosts/vhosts.helper';

import _                        from 'lodash';
import fs                       from 'fs-extra';
import path                     from 'path';
import async                    from 'async';
import { exec }                 from 'child_process';
import handlebars               from 'handlebars';
import { expect }               from 'chai';
import { mkVhost }              from '../src/libs/vhosts';
import { sync as cmdExistsSync} from 'command-exists';
import * as VARS                from '../src/conf/variables';

describe('Vhosts Generator', function () {
  let srcPath = path.join(__dirname, './vhosts');
  let tmpPath = path.join(VARS.EXEC_PATH, VARS.TEMPORARY_FOLDER_NAME, 'test_vhosts_' + Date.now());

  after(function () {
    fs.removeSync(tmpPath);
  });

  describe('Test Generating', function () {
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
          useHttps  : true,
          certFile  : './cert.pem',
          certKey   : './cert.key',
        },
      ];

      let config = {
        trace    : true,
        distFile : outFile,
        template : tplFile,
        rootPath : appFolder,
        logsPath : logFolder,
        useHttps : true,
        certPath : path.join(__dirname, './vhosts/certs/'),
      };

      mkVhost(modules, config, function (error) {
        expect(error).to.not.be.an('error');

        expect(fs.existsSync(outFile)).to.be.true;

        let source = fs.readJSONSync(outFile);
        expect(_.isPlainObject(source)).to.be.true;

        expect(source.logsPath).to.equal(logFolder);
        expect(source.rootPath).to.equal(appFolder);
        expect(fs.existsSync(logFolder)).to.be.true;

        expect(source.modules).to.be.instanceof(Array);
        expect(source.modules.length).to.be.equal(2);

        let module = source.modules[1];
        expect(module.certFile).to.equal(path.join(config.certPath, modules[1].certFile));
        expect(module.certKey).to.equal(path.join(config.certPath, modules[1].certKey));

        done();
      });
    });
  });

  if (cmdExistsSync('nginx')) {
    describe('Test Running', function () {
      it('can be used by nginx', function (done) {
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
          rootPath : appFolder,
          logsPath : logFolder,

          useHttps : true,
          certPath : path.join(__dirname, './vhosts/certs'),
          certFile : 'cert.pem',
          certKey  : 'cert.key',
        };

        async.parallel([
          function (callback) {
            mkVhost(modules, config, function (error) {
              expect(error).to.not.be.an('error');

              callback(null, outFile);
            });
          },
          function (callback) {
            let ngxTplFile  = path.join(__dirname, './vhosts/nginx.conf.hbs');
            let ngxOutFile  = path.join(tmpPath, 'nginx.conf');
            let ngxTemplate = fs.readFileSync(ngxTplFile, 'utf-8');
            let compile     = handlebars.compile(ngxTemplate);
            let source      = compile({ files: [outFile] });

            fs.writeFile(ngxOutFile, source, function (error) {
              expect(error).to.not.be.an('error');

              callback(null, ngxOutFile);
            });
          },
        ],
        /**
         * this error must be a null and argument 2 must be a Array,
         * if not `[outFile, ngxOutFile]` must be throw a error.
         *
         * Because it is not use sudo, so it must throw an error which has
         * no promise to open some log files. So we just only test this
         * config file is ok.
         */
        function (error, stats) {
          let ngxOutFile = stats[1];

          exec(`nginx -t -c ${ngxOutFile}`, function (error) {
            expect(new RegExp(`the configuration file ${ngxOutFile} syntax is ok`).test(error.message)).to.be.true;

            done();
          });
        });
      });
    });
  }
});
