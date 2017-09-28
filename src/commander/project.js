// import program from 'commander'

// program
// .command('init <name>')
// .description('Create a new ngwp project')
// .option('--ver <project version>', 'Set project version')
// .option('--description <project description>', 'Set project description')
// .action((name, options) => {
//   let { initialize } = require('./library/initialization')
//   let startTime = Date.now()
//   let folder = path.join(OptionMerger.ROOT_PATH, name)

//   if (fs.exists(folder)) {
//     throw new Error(`${folder} is exists`)
//   }

//   fs.mkdirSync(folder)

//   initialize(name, {
//     dist: folder,
//     version: options.ver || '0.0.1',
//     description: options.description || name
//   },
//   function (error, stats) {
//     /* istanbul ignore if */
//     if (error) {
//       throw error
//     }

//     utils.trace('Generator: installer')
//     utils.trace(`Time: ${colors.bold(colors.white(Date.now() - startTime))}ms\n`)

//     utils.printStats(stats)
//   })
// })
// .on('--help', () => {
//   utils.trace('  Examples:')
//   utils.trace(`    $ ${cwd} init myProject`)
//   utils.trace('')
// })
