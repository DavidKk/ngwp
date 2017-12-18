import fs from 'fs-extra'
import path from 'path'
import mapValues from 'lodash/mapValues'

export const rootDir = process.cwd()
export const execDir = path.join(__dirname, '../../')

let settings = {}
let rcFile = path.join(rootDir, '.ngwprc.json')
if (fs.existsSync(rcFile)) {
  settings = fs.readJSONSync(rcFile)
}

export const srcDir = path.join(rootDir, settings.src || 'src')
export const distDir = path.join(rootDir, settings.dist || 'dist')
export const logDir = path.join(rootDir, settings.log || 'logs')
export const tmpDir = path.join(rootDir, settings.tmp || '.temporary')
export const nginxDir = path.join(rootDir, settings.vhosts || 'vhosts')

export const port = settings.port || 8080
export const publicPath = settings.publicPath
export const variables = mapValues(settings.variables, JSON.stringify)
export const modules = settings.modules || []
