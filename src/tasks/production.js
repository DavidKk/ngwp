import path from 'path'
import compiler from '../share/compiler'

export default function () {
  process.env.PRODUCT = 1

  let file = path.join(__dirname, '../config/webpack.product.config.babel.js')
  compiler(file)
}
