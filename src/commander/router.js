// import program from 'commander'

// program
// .command('route <module> <routes>')
// .description('Create components by route')
// .option('-d, --dist <filename>', 'Set destination file')
// .option('-b, --base <folder>', 'Set destination base path')
// .action((module, routes, options) => {
//   let { mkRoute } = require('./library/builder')
//   let startTime = Date.now()

//   mkRoute(routes, module, {
//     basePath: options.base || OptionMerger.ROOT_PATH,
//     distFolder: options.dist || path.join(OptionMerger.RESOURCE_FOLDER_NAME, OptionMerger.ENTRY_FOLDER_NAME)
//   },
//   function (error, stats) {
//     /* istanbul ignore if */
//     if (error) {
//       throw error
//     }

//     utils.trace('Generator: route')
//     utils.trace(`Time: ${colors.white(Date.now() - startTime).bold}ms\n`)
//     utils.printStats(stats)
//   })
// })
// .on('--help', () => {
//   utils.trace('  Examples:')
//   utils.trace(`    $ ${cwd} route myModule route1/route2/route3`)
//   utils.trace('')
// })
