import fs from 'fs-extra'
import path from 'path'

export const rootDir = process.cwd()
export const execDir = path.join(__dirname, '../../')

let rcFile = path.join(rootDir, '.ngwprc.json')
let settings = fs.readJSONSync(rcFile)

export const srcDir = path.join(rootDir, settings.src || 'src')
export const logDir = path.join(rootDir, settings.log || 'log')
export const tmpDir = path.join(rootDir, settings.tmp || '.temporary')
export const nginxDir = path.join(rootDir, settings.vhosts || 'vhosts')
export const distDir = path.join(rootDir, settings.dist || 'dist')
export const nginx = settings.nginx
