import fs from 'fs-extra'
import path from 'path'
import mapValues from 'lodash/mapValues'

export const rootDir = process.cwd()
export const execDir = path.join(__dirname, '../../')

let rcSettings = {}
let rcFile = path.join(rootDir, '.ngwprc.json')
if (fs.existsSync(rcFile)) {
  rcSettings = fs.readJSONSync(rcFile)
}

let pkgSettings = {}
let pkgFile = path.join(rootDir, './package.json')
if (fs.existsSync(pkgFile)) {
  pkgSettings = fs.readJSONSync(pkgFile)
}

export const srcDir = path.join(rootDir, rcSettings.src || 'src')
export const distDir = path.join(rootDir, rcSettings.dist || 'dist')
export const logDir = path.join(rootDir, rcSettings.log || 'logs')
export const tmpDir = path.join(rootDir, rcSettings.tmp || '.temporary')
export const nginxDir = path.join(rootDir, rcSettings.vhosts || 'vhosts')

export const name = rcSettings.name || pkgSettings.name || ''
export const port = rcSettings.port || 8080
export const publicPath = rcSettings.publicPath
export const variables = mapValues(rcSettings.variables, JSON.stringify)
export const modules = rcSettings.modules || []
