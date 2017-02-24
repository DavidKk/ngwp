import path   from 'path';
import colors from 'colors';
import {
  trace,
  printStats,
  convertBabel,
}             from './libs/utils';

let startTime = Date.now();

convertBabel(__dirname, path.join(__dirname, '../dist'), {
  rename (file) {
    return file.replace(/\.babel\.js/, '.js');
  },
},
function (error, stats) {
  /* istanbul ignore if */
  if (error) {
    throw error;
  }

  trace('Generator: makefiles');
  trace(`Time: ${colors.bold(colors.white(Date.now() - startTime))}ms\n`);

  printStats(stats);
});
