import fs from 'fs-extra'
import path from 'path'
import map from 'lodash/map'
import trim from 'lodash/trim'
import pick from 'lodash/pick'
import filter from 'lodash/filter'
import defaultsDeep from 'lodash/defaultsDeep'
import colors from 'colors'
import program from 'commander'
import { port as NginxPort, modules as NginxModules } from '../share/configuration'
import Nginx from '../builder/nginx'
import { trace, printStats } from '../share/printer'

const cwd = path.basename(require.main.filename)

program
.command('nginx')
.description('Generate nginx vhosts config file with modules')
.option('-c, --config <config>', 'Set module config (Default path/to/nginx.json)')
.option('-d, --dist <dist>', 'Set destination file')
.option('-b, --base <base>', 'Set destination base path')
.option('-p, --port <port>', 'Set webpack develop server port in development')
.option('--root-path <rootPath>', 'Set variable \'root\' in nginx conf (Default destination folder)')
.option('--logs-path <logsPath>', 'Set log folder in nginx conf (Default \'base/logs/\')')
.option('--use-https', 'Use https protocol (Default false)')
.option('--cert-path', 'Set root cert path (Default base folder)')
.option('--cert-file', 'Set cert file (Require when --use-https is open)')
.option('--cert-key', 'Set cert key file (Require when --use-https is true)')
.action((options = {}) => {
  let startTime = Date.now()
  let nginxModules = NginxModules
  let nginxPort = NginxPort

  if (options.hasOwnProperty('config')) {
    let config = fs.readJSONSync(options.config)
    nginxPort = config.port
    nginxModules = config.modules
  }

  options.port = options.hasOwnProperty('port') ? options.port * 1 : nginxPort

  let modules = map(nginxModules, (module) => {
    let _options = {
      type: module.type || 'module',
      proxy: '127.0.0.1',
      port: nginxPort,
      reserved: map(module.reserved, (path) => (trim(path, '/')))
    }

    return defaultsDeep(_options, module)
  })

  Nginx(modules, {
    basePath: options.base,
    distFile: options.dist,
    rootPath: options.rootPath,
    logsPath: options.logsPath
  }, (error, stats) => {
    /* istanbul ignore if */
    if (error) {
      throw error
    }

    let { file, modules } = stats
    modules = filter(modules, ({ domain, proxy }) => domain && proxy)
    modules = map(modules, (module) => pick(module, ['domain', 'proxy', 'entry', 'port']))

    trace(`${colors.blue(colors.bold('Nginx Config Generator'))}`)
    trace(`Time: ${colors.bold(colors.white(Date.now() - startTime))}ms\n`)

    if (printStats(modules)) {
      trace(`[${colors.bold(colors.green('ok'))}] Nginx config file ${colors.bold(colors.green(file))} is generated completed`)
      trace(`[${colors.bold(colors.blue('info'))}] Remember include it and ${colors.bold(colors.green('reolad/restart'))} your nginx server`)
    }
  })
})
.on('--help', () => {
  trace('  Examples:')
  trace(`    $ ${cwd} vhosts`)
  trace('')
})
