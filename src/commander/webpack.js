import fs from 'fs-extra'
import path from 'path'
import indexOf from 'lodash/indexOf'
import colors from 'colors'
import program from 'commander'
import { rootDir, port as ServerPort } from '../share/configuration'
import { trace } from '../share/printer'
import compiler from '../share/compiler'
import unitest from '../share/unitest'
import devTask from '../tasks/development'
import proTask from '../tasks/production'
import e2eTask from '../tasks/e2e'

const cwd = path.basename(require.main.filename)

const commander = program
.command('run <mode>')
.description('Start webpack')
.option('-c, --config <config>', 'Set webpack config')
.option('-p, --port <port>', 'Set dev server port')
.option('-h, --host <host>', 'Set dev server host')
.option('--https', 'Server run in https protocol')
.action((mode, options) => {
  let serverPort = options.port || ServerPort
  let serverHost = options.host || '127.0.0.1'
  let serverHttps = options.https || false
  let configFile

  if (options.hasOwnProperty('config')) {
    configFile = path.resolve(rootDir, options.config)

    if (!fs.existsSync(configFile)) {
      trace(colors.red(`Webpack config file ${colors.bold(configFile)} is not exists`))
      process.exit(0)
    }
  }

  if (indexOf(['dev', 'develop', 'development'], mode) !== -1) {
    process.env.DEVELOP = 1

    let options = { port: serverPort, host: serverHost, https: serverHttps }
    configFile ? compiler(configFile, options) : devTask(options)
    return
  }

  if (indexOf(['prod', 'product', 'production'], mode) !== -1) {
    process.env.PRODUCTION = 1
    configFile ? compiler(configFile) : proTask()
    return
  }

  if (indexOf(['e2e', 'test'], mode) !== -1) {
    process.env.PRODUCTION = 1
    configFile ? unitest(configFile) : e2eTask()
    return
  }

  commander.help()
  process.exit(0)
})
.on('--help', () => {
  trace('  Examples:')
  trace(`    $ ${colors.blue(`${cwd} develop`)}`)
  trace(`    $ ${colors.blue(`${cwd} product`)}`)
  trace(`    $ ${colors.blue(`${cwd} e2e`)}`)
  trace('')
})
