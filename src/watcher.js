const fs = require('fs')
const AvlTree = require('avl')
const chalk = require('chalk')
const chokidar = require('chokidar')
const compareTags = require('./compare_tags')
const comm = require('./util/comm')

class ProjectTags {
  constructor (options = {}) {
    this.format = options.format
    this.tree = new AvlTree(compareTags)
  }

  insert (tag) {
    this.tree.insert(tag)
  }

  remove (tag) {
    this.tree.remove(tag)
  }

  toString () {
    return this.format(this.tree.keys())
  }
}

const WriteQueue = (write) => {
  let isWriting = false
  let writeNeeded = false
  let writeNeededQueued = false
  let closed = false
  let closeCallback

  function queue () {
    if (closed) {
      return
    }
    if (isWriting) {
      writeNeededQueued = true
    } else {
      writeNeeded = true
    }
  }

  function flush (callback) {
    if (closed || !writeNeeded) {
      return
    }
    isWriting = true
    write(err => {
      isWriting = false
      if (err) {
        writeNeededQueued = false
        callback(err)
      } else {
        writeNeeded = writeNeededQueued
        writeNeededQueued = false
        callback()
      }
      if (closeCallback) {
        closeCallback()
      }
    })
  }

  function close (callback) {
    if (isWriting) {
      closeCallback = callback
    } else {
      callback()
    }
  }

  return { queue, flush, close }
}

const noop = () => {}

/**
 * Configure and start a tags watcher. The watcher will construct an initial
 * tags file on start-up, and then observe the file system for matching files
 * that are added, removed, or changed, updating the master tags file
 * accordingly.
 *
 * @param {string|string[]} paths File, directory, glob, or array to watch for changes
 * @param {object} opts Configuration options
 * @param {function} opts.writeTags Function used to write the tags file. Called with a Node-style callback
 * @param {function} opts.parseTags Function to parse tags. Result MUST be sorted
 * @param {function} opts.format Tags format function
 * @param {object} [logger] Logger interface
 * @param {function} [opts.writeIntervalMs=500] Frequency with which the tags file is written
 */
module.exports = function (paths, opts) {
  const log = opts.logger || { info: noop, error: noop }
  const watcher = chokidar.watch(paths)
  const lastRun = {}
  const allTags = new ProjectTags({ format: opts.format })
  const tagsFile = WriteQueue(callback => {
    opts.writeTags(allTags.toString(), callback)
  })
  let firstWrite = false

  function parseTags (source, filepath, success) {
    try {
      const tags = opts.parseTags(source, filepath)
      success(tags)
    } catch (err) {
      log.warn(`Parse error in file ${filepath}: ${err.message}`)
    }
  }

  function reconcileChanges ({ added, removed }) {
    if (added.length === 0 && removed.length === 0) {
      log.debug('No tag changes')
      return
    } else {
      log.debug(`Tag changes: +${added.length}, -${removed.length}`)
    }
    added.forEach(tag => {
      allTags.insert(tag)
    })
    removed.forEach(tag => {
      allTags.remove(tag)
    })
    tagsFile.queue()
  }

  function onAdd (path) {
    log.debug(`Path added: ${path}`)
    fs.readFile(path, 'utf-8', (err, data) => {
      if (err) {
        log.error(err)
        return
      }
      parseTags(data, path, tags => {
        reconcileChanges({ added: tags, removed: [] })
        lastRun[path] = tags
      })
    })
  }

  function onChange (path) {
    log.debug(`Path changed: ${path}`)
    fs.readFile(path, 'utf-8', (err, data) => {
      if (err) {
        log.error(err)
        return
      }
      parseTags(data, path, tags => {
        if (lastRun[path]) {
          const [removed, added] = comm(lastRun[path], tags, compareTags)
          reconcileChanges({ added, removed })
        } else {
          reconcileChanges({ added: tags, removed: [] })
        }
        lastRun[path] = tags
      })
    })
  }

  function onUnlink (path) {
    log.debug(`Path removed: ${path}`)
    if (lastRun[path]) {
      reconcileChanges({ added: [], removed: lastRun[path] })
      delete lastRun[path]
    }
  }

  function writeTagsFile () {
    tagsFile.flush((err) => {
      if (err) {
        log.error(err)
      } else {
        log.info(`${chalk.green.bold('✔ success')} tags file ${firstWrite ? 'updated' : 'created'}`)
        firstWrite = true
      }
    })
  }

  watcher
    .on('add', onAdd)
    .on('change', onChange)
    .on('unlink', onUnlink)

  const writeInterval = setInterval(writeTagsFile, opts.writeIntervalMs || 500)

  return (done) => {
    watcher.close()
    clearInterval(writeInterval)
    tagsFile.close(done)
  }
}
