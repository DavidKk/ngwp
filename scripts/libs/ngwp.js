import _               from 'lodash';
import fs              from 'fs-extra';
import path            from 'path';
import colors          from 'colors';
import program         from 'commander';
import columnify       from 'columnify';
import {
  mkModule,
  mkRoute,
}                      from './builder';
import { mkVhost }     from './vhosts';
import { formatBytes } from './utils.js';
import {
  SRC_DIR,
  ENTRY_DIR,
}                      from '../../conf/config';

/**
 * exec cli arguments
 * @param  {Array} params  cli arguments
 */
export function exec (params = process.argv) {
  let cwd    = path.basename(require.main.filename);
  let pkg    = path.join(process.cwd(), './package.json');
  let source = fs.readJSONSync(pkg);

  /**
   * version setting
   */
  program
  .version(source.version);

  /**
   * module command
   */
  program
  .command('module <name>')
  .description('Create a new module (Every module is entrance of SPA)')
  .option('-d, --dist <filename>', 'Set destination file')
  .option('-b, --base <folder>', 'Set destination base path')
  .action((name, options) => {
    let startTime = Date.now();

    mkModule(name, {
      basePath   : options.base || process.cwd(),
      distFolder : options.dist || path.join(SRC_DIR, ENTRY_DIR),
    },
    function (error, stats) {
      /* istanbul ignore if */
      if (error) {
        throw error;
      }

      /* eslint no-console:off */
      console.log('Generator: module');
      console.log(`Time: ${colors.white(Date.now() - startTime).bold}ms\n`);

      printStats(stats, {
        config: {
          assets: {
            align: 'right',
            dataTransform (file) {
              return colors.green(file).bold;
            },
          },
          size: {
            align: 'right',
            dataTransform (size) {
              return formatBytes(size);
            },
          }
        }
      });
    });
  })
  .on('--help', () => {
    /* eslint no-console:off */
    console.log('  Examples:');
    console.log(`    $ ${cwd} module myModule`);
    console.log('');
  });

  /**
   * route command
   */
  program
  .command('route <module> <routes>')
  .description('Create components by route')
  .option('-d, --dist <filename>', 'Set destination file')
  .option('-b, --base <folder>', 'Set destination base path')
  .action((module, routes, options) => {
    let startTime = Date.now();

    mkRoute(routes, module, {
      basePath   : options.base || process.cwd(),
      distFolder : options.dist || path.join(SRC_DIR, ENTRY_DIR),
    },
    function (error, stats) {
      /* istanbul ignore if */
      if (error) {
        throw error;
      }

      /* eslint no-console:off */
      console.log('Generator: route');
      console.log(`Time: ${colors.white(Date.now() - startTime).bold}ms\n`);

      printStats(stats, {
        config: {
          assets: {
            align: 'right',
            dataTransform (file) {
              return colors.green(file).bold;
            },
          },
          size: {
            align: 'right',
            dataTransform (size) {
              return formatBytes(size);
            },
          }
        }
      });
    });
  })
  .on('--help', () => {
    /* eslint no-console:off */
    console.log('  Examples:');
    console.log(`    $ ${cwd} route myModule route1/route2/route3`);
    console.log('');
  });

  /**
   * vhosts command
   */
  program
  .command('vhosts')
  .description('Generate nginx vhosts config file with modules')
  .option('-c, --config', 'Set module config (Default path/to/conf/config.js)')
  .option('-d, --dist <filename>', 'Set destination file')
  .option('-b, --base <folder>', 'Set destination base path')
  .option('--root-path <Root folder>', 'Set variable \'root\' in nginx conf (Default destination folder)')
  .option('--logs-path <Logs folder>', 'Set log folder in nginx conf (Default \'base/logs/\')')
  .option('--use-https', 'Use https protocol (Default false)')
  .option('--cert-path', 'Set root cert path (Default base folder)')
  .option('--cert-file', 'Set cert file (Require when --use-https is open)')
  .option('--cert-key', 'Set cert key file (Require when --use-https is true)')
  .action((options) => {
    let startTime = Date.now();
    let confFile  = options.config || path.join(process.cwd(), './conf/config.js');

    if (!fs.existsSync(confFile)) {
      throw new Error(`${confFile} is not exists`);
    }

    let config = require(confFile);
    if (_.isEmpty(config.MODULES)) {
      throw new Error(`${confFile} is invalid, MODULES must be provided`);
    }

    mkVhost(config.MODULES, {
      basePath : options.base,
      distFile : options.dist,
      rootPath : options.rootPath,
      logsPath : options.logsPath,

      useHttps : options.hasOwnProperty('useHttps') ? true : undefined,
      certPath : options.certPath,
      certFile : options.certFile,
      certKey  : options.certKey,
    },
    function (error, stats) {
      /* istanbul ignore if */
      if (error) {
        throw error;
      }

      let { file, modules } = stats;

      modules = _.map(modules, function ({ domain, proxy, entries }) {
        return {
          domain  : colors.green(_.isArray(domain) ? domain.join(',') : domain).bold,
          proxy   : proxy || '127.0.0.1',
          entries : _.isArray(entries) ? colors.green(entries.join(',')).bold : '',
        };
      });

      /* eslint no-console:off */
      console.log('Generator: route');
      console.log(`Time: ${colors.white(Date.now() - startTime).bold}ms\n`);

      printStats(modules);

      console.log(`[${colors.green('ok').bold}] Nginx config file '${colors.green(file).bold}' is generated successfully`);
      console.log(`Remember include it and '${colors.green('reolad/restart').bold}' your nginx server`);
    });
  })
  .on('--help', () => {
    /* eslint no-console:off */
    console.log('  Examples:');
    console.log(`    $ ${cwd} vhosts`);
    console.log('');
  });

  /**
   * other return helper
   */
  program
  .action(function () {
    program.help();

    process.exit(0);
  });

  if (!params.slice(2).length) {
    program.help();
    process.exit(0);
  }
  else {
    program.parse(params);
  }
}

/**
 * Print results
 * @param  {Array}  stats   result set
 * @param  {Object} options columnify setting
 */
function printStats (stats, options) {
  /* istanbul ignore if */
  if (_.isEmpty(stats)) {
    /* eslint no-console:off */
    console.log(colors.yellow('Generate completed but nothing be generated.'));
  }
  else {
    options = _.defaultsDeep(options, {
      headingTransform (heading) {
        return (heading.charAt(0).toUpperCase() + heading.slice(1)).white.bold;
      },
    });

    /* eslint no-console:off */
    console.log(columnify(stats, options) + '\n');
  }
}
