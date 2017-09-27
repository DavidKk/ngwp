import fs from 'fs-extra'
import map from 'lodash/map'
import path from 'path'
import defaults from 'lodash/defaults'
import isFunction from 'lodash/isFunction'
import { trace, convertName, copyAndRender } from '../library/utils'

export default function build (name, family, options, callback) {
  /* istanbul ignore if */
  if (arguments.length < 4) {
    return build(name, family, {}, options)
  }

  /* istanbul ignore if */
  if (!isFunction(callback)) {
    throw new Error('Callback is not provided.')
  }

  /**
   * 检查模板是否存在, 不存在则报错并退出
   * check component template exists and exist process when template not exists.
   */
  let templateDir = path.join(OptionMerger.EXEC_PATH, './templates/component')
  if (!fs.existsSync(templateDir)) {
    callback(new Error(`Component template is not found, see ${templateDir}.`))
    return
  }

  options = defaults(options, {
    ignoreExists: true,
    basePath: process.cwd(),
    distFolder: path.join(VARS.RESOURCE_FOLDER_NAME, VARS.ENTRY_FOLDER_NAME)
  })

  let names = convertName(name)
  let pwd = map(family, function (name) {
    return `${name}/components/`
  })

  let dist = path.join(options.basePath, options.distFolder, pwd.join('/'), name)
  if (fs.existsSync(dist)) {
    options.ignoreExists !== true && trace(`Component ${colors.bold(name)} is already exists.`.yellow)
    callback(null)
    return
  }

  /**
   * 复制并渲染模板文件
   * copy and render file with data.
   */
  fs.ensureDir(dist, function () {
    let nsNames = map(family, convertName)
    let ns = {
      camelcase: map(nsNames, 'camelcase').join('.'),
      underscore: map(nsNames, 'underscore').join('/'),
      hyphen: map(nsNames, 'hyphen').join(' '),
      cssFamily: map(nsNames, function ({ hyphen }) {
        return `${hyphen}-viewport`
      })
    }

    copyAndRender(templateDir, dist, { names, ns }, callback)
  })
}
