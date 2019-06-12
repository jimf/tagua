const fs = require('fs')
const path = require('path')
// const util = require('util');
// const glob = require('glob');
const minimist = require('minimist')
const log = require('loglevel')
const pkg = require('../package.json')
const compareTags = require('./compare_tags')
const format = require('./formatters/ctags')
const Parser = require('./parser')
const defaultParsers = require('./parsers')
const watch = require('./watcher')

// const globP = util.promisify(glob);
// const lstatP = util.promisify(fs.lstat);
// const _readFileP = util.promisify(fs.readFile);
// const _writeFileP = util.promisify(fs.writeFile);
// const readFileP = path =>
//     _readFileP(path, 'utf8');
// const writeFileP = (path, content) =>
//     _writeFileP(path, content, 'utf8');

const parseOpts = state => {
  state.opts = minimist(state.argv, {
    boolean: ['help', 'watch', 'version'],
    string: ['output', 'log-level'],
    alias: {
      help: 'h',
      output: 'o'
    },
    default: {
      'log-level': 'info'
    }
  })
  if (!'trace debug info warn error'.split(' ').includes(state.opts['log-level'])) {
    throw new Error(`Invalid log level supplied: ${state.opts['log-level']}`)
  }
  const cwd = process.cwd()
  // state.filesRaw = state.opts._.slice(2).map(relativePath => ({
  //   absolutePath: path.resolve(cwd, relativePath),
  //   relativePath
  // }));
  if (state.opts.watch && !state.opts.output) {
    state.opts.output = path.resolve(cwd, 'tags')
  }
  return state
}

const handleVersionFlag = state => {
  if (state.opts.version) {
    state.options.writeStdout(`${pkg.name} ${pkg.version}\n`)
    state.done = true
  }
  return state
}

const help = () => `
Usage: tagua [options] file [file2] [dir]

Available options:
  --help, -h               This help
  --log-level=LEVEL        Set log level. One of trace, debug, info, warn, error
  --output=FILE, -o=FILE   File to write output to. Defaults to stdout normally,
                           but if the --watch flag is true, will default to
                           "tags" in the current working directory.
  --watch                  Watch files for changes and update tags file accordingly
  --version                Print version information and exit
`.trim()

const handleHelpFlag = state => {
  if (state.opts.help || state.opts._.length <= 2) {
    state.options.writeStdout(help() + '\n')
    state.done = true
  }
  return state
}

// const throwFileNotFound = filepath => {
//   throw new Error(`No files matching '${filepath}' were found.`)
// };

// const expandFiles = state => {
//   const files = new Set([])
//   return Promise.all(
//     state.filesRaw.map(({ absolutePath, relativePath }) =>
//       lstatP(absolutePath).then(stat => {
//         if (stat.isFile()) {
//           files.add(absolutePath)
//         } else if (stat.isDirectory()) {
//           const exts = (Array.isArray(state.opts.ext) ? state.opts.ext : state.opts.ext.split(','))
//             .map(ext => ext.startsWith('.') ? ext.slice(1) : ext)
//           const extPattern = exts.length > 1 ? `(${exts.join('|')})` : exts
//           return globP(`${absolutePath}/**/*.${extPattern}`).then(result => {
//             if (result.length === 0) {
//               throwFileNotFound(relativePath)
//             }
//             result.forEach(filepath => {
//               files.add(filepath)
//             })
//           })
//         }
//       }).catch(err => {
//         if (err.code === 'ENOENT') {
//           throwFileNotFound(relativePath)
//         }
//         throw err
//       })
//     )
//   ).then(() => {
//     state.files = [...files]
//     return state
//   })
// };

// const processFiles = state => {
//   state.results = []
//   return Promise.all(
//     state.files.map((filePath) =>
//       readFileP(filePath).then(content => {
//         const linter = new Linter()
//         if (state.opts.fix) {
//           const result = linter.verifyAndFix(content, state.config)
//           if (result.messages.length > 0) {
//             state.results.push(lintToFormatterResult(result.messages, filePath))
//           }
//           if (result.fixed) {
//             return writeFileP(filePath, result.output)
//           }
//         } else {
//           const messages = linter.verify(content, state.config)
//           if (messages.length) {
//             state.results.push(lintToFormatterResult(messages, filePath))
//           }
//         }
//       })
//     )
//   ).then(() => state)
// }

// const printReport = state => {
//   if (state.results.length) {
//     const report = formatters.stylish(state.results)
//     if (report) {
//       state.options.writeStdout(`${report}\n`)
//     }
//     throw new Error('Lint violation')
//   }
//   return state
// }

const handleSingleRun = state => {
  throw new Error('Single-run not yet implemented')
}

const handleWatchRun = state => {
  const logger = log.getLogger('watch')
  logger.setLevel(state.opts['log-level'])
  const tagsParser = Parser()
  defaultParsers.forEach(({ extensions, parser }) => {
    tagsParser.register(extensions, parser)
  })
  return new Promise((resolve) => {
    const paths = state.opts._.slice(2)
    const stopWatching = watch(paths, {
      writeTags (output, callback) {
        fs.writeFile(state.opts.output, output, 'utf-8', callback)
      },
      parseTags (source, filename) {
        const tags = tagsParser.parse(source, filename)
        tags.sort(compareTags)
        return tags
      },
      format (tags) {
        return format(tags, { exuberant: true, sorted: 1 })
      },
      logger
    })
    process.on('SIGTERM', () => {
      stopWatching(() => {
        console.log('done')
        resolve(state)
      })
    })
  })
}

const handleMainCommand = state => {
  if (state.opts.watch) {
    return handleWatchRun(state)
  }
  return handleSingleRun(state)
}

const pipeWithState = (initialState, handlers) =>
  handlers.reduce((acc, handler) => {
    return acc.then(state => {
      if (state.done) {
        return state
      }
      return handler(state)
    })
  }, Promise.resolve(initialState))

module.exports = (argv, options) => {
  const initialState = {
    argv,
    options,
    opts: null,
    done: false
  }
  return pipeWithState(initialState, [
    parseOpts,
    handleVersionFlag,
    handleHelpFlag,
    handleMainCommand
  ]).catch(err => {
    options.writeStderr((err.message || err) + '\n')
    throw err
  })
}
