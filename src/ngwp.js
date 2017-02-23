import _                     from 'lodash';
import fs                    from 'fs-extra';
import path                  from 'path';
import colors                from 'colors';
import program               from 'commander';
import columnify             from 'columnify';
import { formatBytes }       from './libs/utils';
import OptionMerger          from './libs/option_merger';

/**
 * node module colors will be changed by karma
 * if you import karma, attribute bold in colors
 * will be change to function and can not use
 * 'string'.bold, it must be write it to 'string'.bold()
 * so that every time after require karma, you can not be
 * use bold for string attribute, it can not return string
 * it will be return a function.
 */

/**
 * exec cli arguments
 * @param  {Array} params  cli arguments
 */
export function exec (params = process.argv) {
  let cwd    = path.basename(require.main.filename);
  let pkg    = path.join(OptionMerger.EXEC_PATH, './package.json');
  let source = fs.readJSONSync(pkg);

  /**
   * version setting
   */
  program
  .version(source.version);

  /**
   * init command
   */
  program
  .command('init <name>')
  .description('Create a new ngwp project')
  .option('--ver <project version>', 'Set project version')
  .option('--description <project description>', 'Set project description')
  .action((name, options) => {
    let { install } = require('./libs/installer');
    let startTime   = Date.now();
    let folder      = path.join(OptionMerger.ROOT_PATH, name);

    if (fs.exists(folder)) {
      throw new Error(`${folder} is exists`);
    }

    fs.mkdirSync(folder);

    install(name, {
      dist        : folder,
      version     : options.ver || '0.0.1',
      description : options.description || name,
    },
    function (error, stats) {
      /* istanbul ignore if */
      if (error) {
        throw error;
      }

      /* eslint no-console:off */
      console.log('Generator: installer');
      console.log(`Time: ${colors.bold(colors.white(Date.now() - startTime))}ms\n`);

      printStats(stats, {
        config: {
          assets: {
            align: 'right',
            dataTransform (file) {
              file = file.replace(OptionMerger.ROOT_PATH + '/', '');
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
    console.log(`    $ ${cwd} init myProject`);
    console.log('');
  });

  /**
   * module command
   */
  program
  .command('module <name>')
  .description('Create a new module (Every module is entrance of SPA)')
  .option('-d, --dist <filename>', 'Set destination file')
  .option('-b, --base <folder>', 'Set destination base path')
  .action((name, options) => {
    let { mkModule } = require('./libs/builder');
    let startTime = Date.now();

    mkModule(name, {
      basePath   : options.base || OptionMerger.ROOT_PATH,
      distFolder : options.dist || path.join(OptionMerger.SRC_DIR, OptionMerger.ENTRY_DIR),
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
              file = file.replace(OptionMerger.ROOT_PATH + '/', '');
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
    let { mkRoute } = require('./libs/builder');
    let startTime = Date.now();

    mkRoute(routes, module, {
      basePath   : options.base || OptionMerger.ROOT_PATH,
      distFolder : options.dist || path.join(OptionMerger.SRC_DIR, OptionMerger.ENTRY_DIR),
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
              file = file.replace(OptionMerger.ROOT_PATH + '/', '');
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
  .option('-p, --port <webpack server port>', 'Set webpack develop server port in development')
  .option('--root-path <Root folder>', 'Set variable \'root\' in nginx conf (Default destination folder)')
  .option('--logs-path <Logs folder>', 'Set log folder in nginx conf (Default \'base/logs/\')')
  .option('--use-https', 'Use https protocol (Default false)')
  .option('--cert-path', 'Set root cert path (Default base folder)')
  .option('--cert-file', 'Set cert file (Require when --use-https is open)')
  .option('--cert-key', 'Set cert key file (Require when --use-https is true)')
  .action((options) => {
    let { mkVhost } = require('./libs/vhosts');
    let startTime = Date.now();

    if (options.port) {
      options.port = options.port * 1;

      _.forEach(OptionMerger.NGINX_PROXY, function (proxy) {
        proxy.proxyPort = options.port;
      });

      OptionMerger.updateRC({ port: options.port });
    }

    mkVhost(OptionMerger.NGINX_PROXY, {
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

  let runCommander = program
  .command('run <mode>')
  .description('Start webpack')
  .action((mode) => {
    if (-1 !== _.indexOf(['dev', 'develop', 'development'], mode)) {
      runDevelopTasks();
    }
    else if (-1 !== _.indexOf(['prod', 'product', 'production'], mode)) {
      runReleaseTasks();
    }
    else if (-1 !== _.indexOf(['test', 'unitest'], mode)) {
      runUnitestTasks();
    }
    else {
      runCommander.help();

      process.exit(0);
    }
  })
  .on('--help', () => {
    /* eslint no-console:off */
    console.log('  Examples:');
    console.log(`    $ ${cwd} run develop`);
    console.log(`    $ ${cwd} run product`);
    console.log(`    $ ${cwd} run unitest`);
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

  !params.slice(2).length
  ? runDevelopTasks()
  : program.parse(params);
}

/**
 * convert and package
 * run webpack develop server and watch the file changed
 */
function runDevelopTasks () {
  let { run } = require('./libs/webpack');
  run(path.join(OptionMerger.EXEC_PATH, './conf/webpack.develop.config.babel.js'), { watch: true });
}

/**
 * convert and package
 * minify all we can compress
 */
function runReleaseTasks () {
  let { run } = require('./libs/webpack');
  run(path.join(OptionMerger.EXEC_PATH, './conf/webpack.product.config.babel.js'));
}

/**
 * convert and run karma
 * import all test/*.spec.js files
 */
function runUnitestTasks () {
  let { run } = require('./libs/karma');
  run(path.join(OptionMerger.EXEC_PATH, './conf/karma.conf.js'));
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
