import _            from 'lodash';
import fs           from 'fs-extra';
import path         from 'path';
import colors       from 'colors';
import program      from 'commander';
import OptionMerger from './libs/option_merger';
import {
  printStats,
  trace,
}                   from './libs/utils';

/**
 * node module colors will be changed by karma
 * if you import karma, attribute bold in colors
 * will be change to function and can not use
 * 'string'.bold, it must be write it to 'string'.bold()
 * so that every time after require karma, you can not be
 * use bold for string attribute, it can not return string
 * it will be return a function.
 */


let params = process.argv;
let cwd    = path.basename(require.main.filename);
let pkg    = path.join(__dirname, '../package.json');
let source = fs.readJSONSync(pkg);


/**
 * version setting
 */
program
.version(source.version)
.option('--quiet');

/**
 * init command
 */
program
.command('init <name>')
.description('Create a new ngwp project')
.option('--ver <project version>', 'Set project version')
.option('--description <project description>', 'Set project description')
.action((name, options) => {
  let { initialize } = require('./libs/initialization');
  let startTime      = Date.now();
  let folder         = path.join(OptionMerger.ROOT_PATH, name);

  if (fs.exists(folder)) {
    throw new Error(`${folder} is exists`);
  }

  fs.mkdirSync(folder);

  initialize(name, {
    dist        : folder,
    version     : options.ver || '0.0.1',
    description : options.description || name,
  },
  function (error, stats) {
    /* istanbul ignore if */
    if (error) {
      throw error;
    }

    trace('Generator: installer');
    trace(`Time: ${colors.bold(colors.white(Date.now() - startTime))}ms\n`);

    printStats(stats);
  });
})
.on('--help', () => {
  trace('  Examples:');
  trace(`    $ ${cwd} init myProject`);
  trace('');
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
    distFolder : options.dist || path.join(OptionMerger.RESOURCE_FOLDER_NAME, OptionMerger.ENTRY_FOLDER_NAME),
  },
  function (error, stats) {
    /* istanbul ignore if */
    if (error) {
      throw error;
    }

    trace('Generator: module');
    trace(`Time: ${colors.white(Date.now() - startTime).bold}ms\n`);

    printStats(stats);
  });
})
.on('--help', () => {
  trace('  Examples:');
  trace(`    $ ${cwd} module myModule`);
  trace('');
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
    distFolder : options.dist || path.join(OptionMerger.RESOURCE_FOLDER_NAME, OptionMerger.ENTRY_FOLDER_NAME),
  },
  function (error, stats) {
    /* istanbul ignore if */
    if (error) {
      throw error;
    }

    trace('Generator: route');
    trace(`Time: ${colors.white(Date.now() - startTime).bold}ms\n`);
    printStats(stats);
  });
})
.on('--help', () => {
  trace('  Examples:');
  trace(`    $ ${cwd} route myModule route1/route2/route3`);
  trace('');
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

    modules = _.filter(modules, function (module) {
      return !(_.isEmpty(module.domain) || _.isEmpty(module.proxy) || _.isEmpty(module.entries));
    });

    modules = _.map(modules, function (module) {
      return _.pick(module, ['domain', 'proxy', 'entries']);
    });

    trace('Generator: vhosts');
    trace(`Time: ${colors.bold(colors.white(Date.now() - startTime))}ms\n`);

    if (printStats(modules)) {
      trace(`[${colors.bold(colors.green('ok'))}] Nginx config file '${colors.bold(colors.green(file))}' is generated successfully`);
      trace(`Remember include it and '${colors.bold(colors.green('reolad/restart'))}' your nginx server`);
    }
  });
})
.on('--help', () => {
  trace('  Examples:');
  trace(`    $ ${cwd} vhosts`);
  trace('');
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
  trace('  Examples:');
  trace(`    $ ${cwd} run develop`);
  trace(`    $ ${cwd} run product`);
  trace(`    $ ${cwd} run unitest`);
  trace('');
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


/**
 * convert and package
 * run webpack develop server and watch the file changed
 */
function runDevelopTasks () {
  let { run } = require('./libs/webpack');
  run(path.join(__dirname, './conf/webpack.develop.config.babel.js'), { watch: true });
}

/**
 * convert and package
 * minify all we can compress
 */
function runReleaseTasks () {
  let { run } = require('./libs/webpack');
  run(path.join(__dirname, './conf/webpack.product.config.babel.js'));
}

/**
 * convert and run karma
 * import all test/*.spec.js files
 */
function runUnitestTasks () {
  let { run } = require('./libs/karma');
  run(path.join(__dirname, './conf/karma.conf.babel.js'));
}
