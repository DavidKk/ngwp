import _          from 'lodash';
import fs         from 'fs-extra';
import path       from 'path';
import async      from 'async';
import colors     from 'colors';
import handlebars from 'handlebars';
import {
  convertName,
  tracer,
}                 from './utils.js';
import {
  SRC_DIR,
  ENTRY_DIR,
}                 from '../../conf/config';

/**
 * 生成模块
 * @param  {string}  name    模块名称
 * @param  {Object}  datas   数据
 * @param  {Boolean} isForce 是否强制
 * @return {Boolean}
 */
export function mkModule (name, options, callback) {
  /* istanbul ignore if */
  if (3 > arguments.length) {
    return mkModule(name, {}, options);
  }

  /* istanbul ignore if */
  if (!_.isFunction(callback)) {
    throw new Error('Callback is not provided.');
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
    basePath     : process.cwd(),
    distFolder   : path.join(SRC_DIR, ENTRY_DIR),
  });

  let trace     = tracer(options);
  let names     = convertName(name);
  let filename  = names.underscore;
  let moduleDir = path.join(options.basePath, options.distFolder, filename);

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
 * 创建模块与组件
 * @param  {String} argv 指令
 */
export function mkRoute (route, moduleName, options, callback) {
  if (!_.isFunction(callback)) {
    throw new Error('Callback is not provided.');
  }

  let routes = _.isArray(route) ? route : route.split('\/');
  let family = [moduleName];
  let tasks  = _.map(routes, function (name) {
    return function (callback) {
      mkComponent(name, family, options, function (error, stats) {
        if (error) {
          callback(error);
          return;
        }

        family.push(name);

        callback(null, stats);
      });
    };
  });

  async.series(tasks, function (error, stats) {
    if (error) {
      callback(error);
      return;
    }

    stats = _.flattenDeep(stats);
    stats = _.filter(stats);

    callback(null, stats);
  });
}

/**
 * 创建组件
 * @param  {String} name   组件名称
 * @param  {Array}  family 模块关系
 * @param  {Object} datas  数据
 * @return {Boolean}
 */
export function mkComponent (name, family, options, callback) {
  /* istanbul ignore if */
  if (4 > arguments.length) {
    return mkComponent(name, family, {}, options);
  }

  /* istanbul ignore if */
  if (!_.isFunction(callback)) {
    throw new Error('Callback is not provided.');
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
    ignoreExists : true,
    basePath     : process.cwd(),
    distFolder   : path.join(SRC_DIR, ENTRY_DIR),
  });

  let trace = tracer(options);
  let names = convertName(name);
  let pwd   = _.map(family, function (name) {
    return `${name}/components/`;
  });

  let dist = path.join(options.basePath, options.distFolder, pwd.join('\/'), name);
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
    throw new Error('Callback is not provided.');
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

  async.parallel(tasks, function (error, stats) {
    if (error) {
      callback(error);
      return;
    }

    stats = _.flattenDeep(stats);
    stats = _.filter(stats);

    callback(null, stats);
  });
}
