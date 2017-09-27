import map from 'lodash/map'
import fs from 'fs-extra'
import path from 'path'
import Coveralls from 'coveralls/lib/handleInput'

let folder = path.join(__dirname, '../coverage/')
let files = fs.readdirSync(folder)
let contents = map(files, function (filename) {
  let file = path.join(folder, filename, './lcov.info')
  return fs.existsSync(file) ? fs.readFileSync(file) : ''
})

Coveralls(contents.join('\n'), function (error) {
  if (error) {
    throw error
  }
})
