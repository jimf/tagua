const log = require('loglevel')
const compareTags = require('./compare_tags')
const format = require('./formatters/ctags')
const parseTags = require('./parsers/javascript')
const watch = require('./watcher')

// module.exports = function (source, filename) {
//   const tags = parseTags(source, filename)
//   tags.sort(compareTags)
//   return format(tags, { exuberant: true, sorted: 1 })
// }

module.exports = function (paths) {
  const logger = log.getLogger('watch')
  logger.setLevel('info')
  return watch(paths, {
    writeTags (output, callback) {
      console.log('===============================================================')
      console.log(`${output}\n\n`)
      callback()
    },
    parseTags (source, filename) {
      const tags = parseTags(source, filename)
      tags.sort(compareTags)
      return tags
    },
    format (tags) {
      return format(tags, { exuberant: true, sorted: 1 })
    },
    logger
  })
}
