import fs from 'fs-extra'
import path from 'path'
import defaults from 'lodash/defaults'
import isFunction from 'lodash/isFunction'
import OptionMerger from '../library/option_merger'
import { trace, convertName, copyAndRender } from '../library/utils'

export default function build (name, options, callback) {
  /* istanbul ignore if */
  if (arguments.length < 3) {
    return build(name, {}, options)
  }

  /* istanbul ignore if */
  if (!isFunction(callback)) {
    throw new Error('Callback is not provided.')
  }

  /**
   * 检查模板是否存在, 不存在则报错并退出
   * check moudle template exists and exist process when template not exists.
   */
  let templateDir = path.join(OptionMerger.EXEC_PATH, './templates/module')
  if (!fs.existsSync(templateDir)) {
    callback(new Error(`Module template is not found, see ${templateDir}`))
    return
  }

  options = defaults(options, {
    ignoreExists: false,
    basePath: process.cwd(),
    distFolder: path.join(VARS.RESOURCE_FOLDER_NAME, VARS.ENTRY_FOLDER_NAME)
  })

  let names = convertName(name)
  let filename = names.underscore
  let moduleDir = path.join(options.basePath, options.distFolder, filename)

  /**
   * 检查是否已经存在, 如果模块已经存在则直接退出
   * check module exists and exit process when file is exists.
   */
  if (fs.existsSync(moduleDir)) {
    options.ignoreExists !== true && trace(`Module ${colors.bold(name)} is already exists.`.yellow)
    callback(null)
    return
  }

  /**
   * 复制并渲染模板文件
   * copy and render file with data.
   */
  fs.ensureDir(moduleDir, function (error) {
    if (error) {
      callback(error)
      return
    }

    copyAndRender(templateDir, moduleDir, { names }, callback)
  })
}