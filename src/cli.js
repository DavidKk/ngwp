import program from 'commander'
import { version } from '../package.json'
import './commander/nginx'
import './commander/webpack'

let params = process.argv

program
  .version(version)
  .option('--quiet')

program.parse(params)
