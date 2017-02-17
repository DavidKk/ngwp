import _          from 'lodash';
import fs         from 'fs-extra';
import path       from 'path';
import async      from 'async';
import colors     from 'colors';
import program    from 'commander';
import columnify  from 'columnify';
import handlebars from 'handlebars';
import {
  convertName,
  formatBytes,
  tracer,
}                 from './utils.js';
import {
  ROOT_PATH,
  ENTRY_PATH,
}                 from '../../conf/config';

/**
 * 创建模块
 * @param  {Array} params  cli argument (default by process.argv)
 */
export function build (params = process.argv, options, callback) {
  /* istanbul ignore if */
  if (3 > arguments.length) {
    return build(params, {}, options);
  }

  options = _.defaultsDeep(options, {
    ignoreTrace  : false,
    ignoreExists : false,
  });

  let trace   = tracer(options);
  let pkgFile = path.join(ROOT_PATH, './package.json');
  let source  = fs.readJSONSync(pkgFile);

  program
  .version(source.version)
  .on('--version', () => {
    trace(source.version);
  })
  .on('--help', () => {
    trace('  Examples:');
    trace('    # Create Module/Router');
    trace('    $ ./scripts/module router module/componentA/componentB/...');
    trace('');
  })
  .arguments('<cmd> [argv]')
  .option('-d, --dist [dist]', 'set target folder.')
  .action((cmd, argv) => {
    switch (cmd) {
      case 'router':
        let startTime = Date.now();

        generateRouter(argv, _.defaultsDeep(options, { dist: program.dist }), function (error, stats) {
          /* istanbul ignore if */
          if (error) {
            _.isFunction(callback) && callback(error);
            trace(error);
            return;
          }

          trace('Generator: \'module.js\'');
          trace(`Time: ${colors.white(Date.now() - startTime).bold}ms\n`);

          /* istanbul ignore if */
          if (0 === stats.length) {
            trace(colors.yellow('Generate completed but nothing be generated.'));
          }
          else {
            let tableLogs = columnify(stats, {
              headingTransform (heading) {
                return (heading.charAt(0).toUpperCase() + heading.slice(1)).white.bold;
              },
              config: {
                assets: {
                  align    : 'right',
                  dataTransform (file) {
                    file = file.replace(ENTRY_PATH + '/', '');
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

            trace(`${tableLogs}\n`);
          }

          _.isFunction(callback) && callback(null, stats);
        });

        break;
    }
  })
  .parse(params);
}

/**
 * 创建模块与组件
 * @param  {String} argv 指令
 */
export function generateRouter (argv, options, callback) {
  if (!_.isFunction(callback)) {
    throw new Error('generateRouter: callback is not provided.');
  }

  let components = _.trim(argv, '\/').split('\/');
  let moduleName = components.shift();

  generateModule(moduleName, {
    ignoreTrace  : _.isBoolean(options.ignoreTrace) ? options.ignoreTrace : false,
    ignoreExists : false,
    distFolder   : options.dist || ENTRY_PATH,
  },
  function (error, moduleState) {
    /* istanbul ignore if */
    if (error) {
      callback(error);
      return;
    }

    let family = [moduleName];
    let tasks  = _.map(components, function (name) {
      return function (callback) {
        generateComponent(name, family, { distFolder: options.dist || ENTRY_PATH }, function (error, stats) {
          if (error) {
            callback(error);
            return;
          }

          family.push(name);

          callback(null, stats);
        });
      };
    });

    async.series(tasks, function (componentState) {
      moduleState    = moduleState || [];
      componentState = componentState || [];

      let stats = moduleState.concat(componentState);
      stats     = _.flattenDeep(stats);
      stats     = _.filter(stats);

      callback(null, stats);
    });
  });
}

/**
 * 生成模块
 * @param  {string}  name    模块名称
 * @param  {Object}  datas   数据
 * @param  {Boolean} isForce 是否强制
 * @return {Boolean}
 */
export function generateModule (name, options, callback) {
  /* istanbul ignore if */
  if (3 > arguments.length) {
    return generateModule(name, {}, options);
  }

  /* istanbul ignore if */
  if (!_.isFunction(callback)) {
    throw new Error('generateModule: callback is not provided.');
  }

  /**
   * 检查模板是否存在, 不存在则报错并退出
   * check moudle template exists and exist process when template not exists.
   */
  let templateDir = path.join(__dirname, './templates/module');
  if (!fs.existsSync(templateDir)) {
    callback(new Error(`Module template is not found, see ${templateDir}`));
    return;
  }

  options = _.defaults(options, {
    ignoreTrace  : _.isBoolean(options.ignoreTrace) ? options.ignoreTrace : false,
    ignoreExists : false,
    distFolder   : ENTRY_PATH,
  });

  let trace     = tracer(options);
  let names     = convertName(name);
  let filename  = names.underscore;
  let moduleDir = path.join(options.distFolder, filename);

  /**
   * 检查是否已经存在, 如果模块已经存在则直接退出
   * check module exists and exit process when file is exists.
   */
  if (fs.existsSync(moduleDir)) {
    true !== options.ignoreExists && trace(`Module ${colors.bold(name)} is already exists.`.yellow);
    callback(null);
    return;
  }

  /**
   * 复制并渲染模板文件
   * copy and render file with data.
   */
  fs.ensureDir(moduleDir, function (error) {
    if (error) {
      callback(error);
      return;
    }

    let templateFiles = fs.readdirSync(templateDir);
    copyAndRender(templateFiles, { names }, templateDir, moduleDir, callback);
  });
}

/**
 * 创建组件
 * @param  {String} name   组件名称
 * @param  {Array}  family 模块关系
 * @param  {Object} datas  数据
 * @return {Boolean}
 */
export function generateComponent (name, family, options, callback) {
  /* istanbul ignore if */
  if (4 > arguments.length) {
    return generateComponent(name, family, {}, options);
  }

  /* istanbul ignore if */
  if (!_.isFunction(callback)) {
    throw new Error('generateComponent: callback is not provided.');
  }

  /**
   * 检查模板是否存在, 不存在则报错并退出
   * check component template exists and exist process when template not exists.
   */
  let templateDir = path.join(__dirname, './templates/component');
  if (!fs.existsSync(templateDir)) {
    callback(new Error(`Component template is not found, see ${templateDir}.`));
    return;
  }

  options = _.defaults(options, {
    ignoreTrace  : _.isBoolean(options.ignoreTrace) ? options.ignoreTrace : false,
    ignoreExists : false,
    distFolder   : ENTRY_PATH,
  });

  let trace = tracer(options);
  let names = convertName(name);
  let pwd   = _.map(family, function (name) {
    return `${name}/components/`;
  });

  let dist  = path.join(options.distFolder, pwd.join('\/'), name);
  if (fs.existsSync(dist)) {
    true !== options.ignoreExists && trace(`Component ${colors.bold(name)} is already exists.`.yellow);
    callback(null);
    return;
  }

  /**
   * 复制并渲染模板文件
   * copy and render file with data.
   */
  fs.ensureDir(dist, function () {
    let nsNames = _.map(family, convertName);
    let ns      = {
      camelcase  : _.map(nsNames, 'camelcase').join('.'),
      underscore : _.map(nsNames, 'underscore').join('/'),
      hyphen     : _.map(nsNames, 'hyphen').join(' '),
      cssFamily  : _.map(nsNames, function ({ hyphen }) {
        return `${hyphen}-viewport`;
      }),
    };

    let templateFiles = fs.readdirSync(templateDir);
    copyAndRender(templateFiles, { names, ns }, templateDir, dist, callback);
  });

  return;
}

/**
 * 复制并渲染
 * @param {Array}  files   文件集合
 * @param {Object} datas   渲染的数据
 * @param {String} fromDir 资源所在路径
 * @param {String} toDir   目标路径
 */
export function copyAndRender (files, datas = {}, fromDir = '', toDir = '', callback) {
  /* istanbul ignore if */
  if (!_.isFunction(callback)) {
    throw new Error('copyAndRender: callback is not provided.');
  }

  let tasks = _.map(files, function (filename) {
    return function (callback) {
      let file = path.join(fromDir, filename);

      /**
       * 判断文件目录是否为文件夹, 如果为文件夹则创建文件夹并将
       * 里面的文件全部复制到目标相应目录
       * 这里使用地推方法, 当所有文件都复制完毕会退出递归
       */
      if (fs.statSync(file).isDirectory()) {
        let targetDir = path.join(toDir, filename);

        fs.ensureDir(targetDir, function (error) {
          if (error) {
            callback(error);
            return;
          }

          fs.readdir(file, function (error, others) {
            if (error) {
              callback(error);
              return;
            }

            copyAndRender(others, datas, file, targetDir, callback);
          });
        });

        return;
      }

      /**
       * 模板文件不是 handlebars 文件则退出,
       * 目前暂只支持 handlebars 的模板引擎.
       */
      if ('.hbs' !== path.extname(file)) {
        callback(null);
        return;
      }

      /**
       * 如果目标文件已经存在, 则退出不做任何操作,
       * 因此请确定文件是否存在, 若存在则无办法继续执行复制.
       */
      let targetFile = path.join(toDir, filename);
      if (fs.existsSync(targetFile)) {
        callback(null);
        return;
      }

      /**
       * 编译文件并保存到相应的文件目录
       */
      let template = fs.readFileSync(file, 'utf-8');
      let compile  = handlebars.compile(template);
      let source   = compile(datas);
      let doneFile = targetFile.replace(path.extname(targetFile), '');

      fs.writeFileSync(doneFile, source);
      callback(null, { assets: doneFile, size: source.length });
    };
  });

  async.parallel(tasks, callback);
}
