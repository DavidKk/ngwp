import defaultsDeep from 'lodash/defaultsDeep'
import fs from 'fs-extra'
import path from 'path'
import * as VARS from '../config/variables'
import { buildInheritance } from './utils'

const Inheritance = buildInheritance(VARS)

export class OptionMerger extends Inheritance {
  constructor () {
    super()

    this.file = this.findRC()
  }

  readRC () {
    let file = this.file
    return file ? fs.readJSONSync(file) : {}
  }

  updateRC (source) {
    let file = this.file
    if (!file) {
      return false
    }

    let originSource = fs.readJSONSync(file)
    source = defaultsDeep(source, originSource)

    fs.writeFileSync(file, JSON.stringify(source, null, 2))
  }

  findRC () {
    let file = path.join(VARS.ROOT_PATH, VARS.RC_FILE || '.ngwprc')
    if (fs.existsSync(file)) {
      return file
    }

    return null
  }
}

export default new OptionMerger()