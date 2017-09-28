// import program from 'commander'

// program
// .command('module <name>')
// .description('Create a new module (Every module is entrance of SPA)')
// .option('-d, --dist <filename>', 'Set destination file')
// .option('-b, --base <folder>', 'Set destination base path')
// .action((name, options) => {
//   let { mkModule } = require('./library/builder')
//   let startTime = Date.now()

//   mkModule(name, {
//     basePath: options.base || OptionMerger.ROOT_PATH,
//     distFolder: options.dist || path.join(OptionMerger.RESOURCE_FOLDER_NAME, OptionMerger.ENTRY_FOLDER_NAME)
//   },
//   function (error, stats) {
//     /* istanbul ignore if */
//     if (error) {
//       throw error
//     }

//     utils.trace('Generator: module')
//     utils.trace(`Time: ${colors.white(Date.now() - startTime).bold}ms\n`)

//     utils.printStats(stats)
//   })
// })
// .on('--help', () => {
//   utils.trace('  Examples:')
//   utils.trace(`    $ ${cwd} module myModule`)
//   utils.trace('')
// })