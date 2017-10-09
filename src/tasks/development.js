import path from 'path'
import compiler from '../share/compiler'

export default function () {
  process.env.DEVELOP = 1

  let file = path.join(__dirname, '../config/webpack.develop.config.babel.js')
  compiler(file, { watch: true })
}
