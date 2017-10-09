import path from 'path'
import unitest from '../share/unitest'

export default function () {
  process.env.PRODUCT = 1
  process.env.UNITEST = 1

  let file = path.join(__dirname, '../config/karma.conf.babel.js')
  unitest(file)
}
