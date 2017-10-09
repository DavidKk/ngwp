/* eslint max-nested-callbacks: off */
/* eslint no-unused-expressions: off */
/* eslint-env mocha */

import _ from 'lodash'
import fs from 'fs-extra'
import path from 'path'
import async from 'async'
import { exec } from 'child_process'
import { expect } from 'chai'
import handlebars from 'handlebars'
import { sync as cmdExistsSync } from 'command-exists'
import Builder from '../src/builder/nginx'
import { execDir } from '../src/share/configuration'
import './nginx/nginx.helper'

describe('Nginx Generator', function () {
  let srcPath = path.join(__dirname, './nginx')
  let tmpPath = path.join(execDir, '.temporary')

  after(function () {
    fs.removeSync(tmpPath)
  })

  describe('Test Generating', function () {
    it('should configure and generate nginx config file', function (done) {
      let tplFile = path.join(srcPath, 'vhost.conf.hbs')
      let outFile = path.join(tmpPath, './vhosts.conf')
      let logFolder = path.join(tmpPath, './logs')
      let appFolder = path.join(tmpPath, './apps')

      let modules = [
        {
          type: 'cdn',
          domain: 'static.example.com'
        },
        {
          proxy: '127.0.0.1',
          proxyPort: 8080,
          domain: 'www.example.com',
          entry: 'src/modules/index/index.js',
          useHttps: true,
          certFile: './cert.pem',
          certKey: './cert.key'
        }
      ]

      let config = {
        trace: true,
        distFile: outFile,
        template: tplFile,
        rootPath: appFolder,
        logsPath: logFolder,
        useHttps: true,
        certPath: path.join(srcPath, './certs/')
      }

      Builder(modules, config, function (error) {
        expect(error).to.not.be.an('error')

        expect(fs.existsSync(outFile)).to.be.true

        let source = fs.readJSONSync(outFile)
        expect(_.isPlainObject(source)).to.be.true

        expect(source.logsPath).to.equal(logFolder)
        expect(source.rootPath).to.equal(appFolder)
        expect(fs.existsSync(logFolder)).to.be.true

        expect(source.modules).to.be.instanceof(Array)
        expect(source.modules.length).to.be.equal(2)

        let module = source.modules[1]
        expect(module.certFile).to.equal(path.join(config.certPath, modules[1].certFile))
        expect(module.certKey).to.equal(path.join(config.certPath, modules[1].certKey))

        done()
      })
    })
  })

  if (cmdExistsSync('nginx')) {
    describe('Test Running', function () {
      it('can be used by nginx', function (done) {
        let outFile = path.join(tmpPath, './vhosts.conf')
        let logFolder = path.join(tmpPath, './logs')
        let appFolder = path.join(tmpPath, './apps')

        let modules = [
          {
            type: 'cdn',
            domain: 'static.example.com'
          },
          {
            proxy: '127.0.0.1',
            proxyPort: 8080,
            domain: 'www.example.com',
            entry: 'src/modules/index/index.js'
          }
        ]

        let config = {
          trace: true,
          distFile: outFile,
          rootPath: appFolder,
          logsPath: logFolder,

          useHttps: true,
          certPath: path.join(srcPath, './certs/'),
          certFile: 'cert.pem',
          certKey: 'cert.key'
        }

        async.parallel([
          function (callback) {
            Builder(modules, config, function (error) {
              expect(error).to.not.be.an('error')
              callback(null, outFile)
            })
          },
          function (callback) {
            let ngxTplFile = path.join(srcPath, './nginx.conf.hbs')
            let ngxOutFile = path.join(tmpPath, 'nginx.conf')
            let ngxTemplate = fs.readFileSync(ngxTplFile, 'utf-8')
            let compile = handlebars.compile(ngxTemplate)
            let source = compile({ files: [outFile] })

            fs.writeFile(ngxOutFile, source, function (error) {
              expect(error).to.not.be.an('error')
              callback(null, ngxOutFile)
            })
          }
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
          expect(error).to.not.be.an('error')

          let ngxOutFile = stats[1]

          exec(`nginx -t -c ${ngxOutFile}`, function (error) {
            let regexp = new RegExp(`the configuration file ${ngxOutFile} syntax is ok`)

            /* eslint no-unused-expressions: off */
            expect(regexp.test(error.message)).to.be.true
            done()
          })
        })
      })
    })
  }
})
