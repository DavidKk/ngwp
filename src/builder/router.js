import map from 'lodash/map'
import async from 'async'
import filter from 'lodash/filter'
import isArray from 'lodash/isArray'
import isFunction from 'lodash/isFunction'
import flattenDeep from 'lodash/flattenDeep'
import BuildComponent from './component'

export default function build (route, moduleName, options, callback) {
  if (!isFunction(callback)) {
    throw new Error('Callback is not provided.')
  }

  let routes = isArray(route) ? route : route.split('/')
  let family = [moduleName]
  let tasks = map(routes, function (name) {
    return function (callback) {
      BuildComponent(name, family, options, function (error, stats) {
        if (error) {
          callback(error)
          return
        }

        family.push(name)
        callback(null, stats)
      })
    }
  })

  async.series(tasks, function (error, stats) {
    if (error) {
      callback(error)
      return
    }

    stats = flattenDeep(stats)
    stats = filter(stats)

    callback(null, stats)
  })
}
