import path from 'path'
import defaults from 'lodash/defaults'
import compiler from '../share/compiler'

export default function (options) {
  process.env.DEVELOP = 1

  let file = path.join(__dirname, '../config/webpack.develop.config.babel.js')
  compiler(file, defaults(options, { watch: true }))
}
