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
  let logPath = path.join(tmpPath, './logs')

  after(function () {
    fs.removeSync(tmpPath)
  })

  describe('Test Generating', function () {
    it('should configure and generate nginx config file', function (done) {
      let tplFile = path.join(srcPath, 'nginx.base.conf.hbs')
      let outFile = path.join(tmpPath, './nginx.base.conf')

      let modules = [
        {
          type: 'static',
          domain: 'static.example.com'
        },
        {
          type: 'module',
          proxy: '127.0.0.1',
          port: 8080,
          domain: 'www.example.com',
          entry: path.join(srcPath, './modules/index.js'),
          useHttps: true,
          certFile: path.join(srcPath, './certs/cert.pem'),
          certKey: path.join(srcPath, './certs/cert.key')
        }
      ]

      let config = {
        trace: true,
        rootPath: srcPath,
        distFile: outFile,
        template: tplFile,
        logsPath: logPath
      }

      Builder(modules, config, function (error) {
        expect(error).to.not.be.an('error')

        expect(fs.existsSync(outFile)).to.be.true

        let source = fs.readJSONSync(outFile)
        expect(_.isPlainObject(source)).to.be.true

        expect(source.logsPath).to.equal(logPath)
        expect(source.rootPath).to.equal(srcPath)
        expect(fs.existsSync(logPath)).to.be.true

        expect(source.modules).to.be.instanceof(Array)
        expect(source.modules.length).to.be.equal(2)

        let module = source.modules[1]
        expect(module.certFile).to.equal(modules[1].certFile)
        expect(module.certKey).to.equal(modules[1].certKey)

        done()
      })
    })
  })

  if (cmdExistsSync('nginx')) {
    describe('Test Running', function () {
      it('can be used by nginx', function (done) {
        let outFile = path.join(tmpPath, './nginx.completed.conf')

        let modules = [
          {
            type: 'cdn',
            domain: 'static.example.com'
          },
          {
            type: 'module',
            proxy: '127.0.0.1',
            port: 8080,
            domain: 'www.example.com',
            entry: './modules/index.js'
          }
        ]

        let config = {
          trace: true,
          rootPath: srcPath,
          distFile: outFile,
          logsPath: logPath
        }

        async.parallel([
          function (callback) {
            Builder(modules, config, function (error) {
              expect(error).to.not.be.an('error')
              callback(null, outFile)
            })
          },
          function (callback) {
            let ngxTplFile = path.join(srcPath, './nginx.root.conf.hbs')
            let ngxOutFile = path.join(tmpPath, 'nginx.root.conf')
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

            expect(regexp.test(error.message)).to.be.true
            done()
          })
        })
      })
    })
  }
})
