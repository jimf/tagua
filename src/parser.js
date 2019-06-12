const path = require('path')
const c = require('./constants')
const exEscape = require('./util/ex_escape')

function Parser () {
  const self = {}
  const parsers = {}

  function normalizeExt (ext) {
    return ext.startsWith('.') ? ext : `.${ext}`
  }

  function register (extensions, langParser) {
    extensions.forEach(ext => {
      parsers[normalizeExt(ext)] = langParser
    })
    return self
  }

  function parse (source, filepath) {
    const ext = path.extname(filepath)

    if (parsers[ext]) {
      return parsers[ext]({
        source,
        filepath,
        kind: c.tagKinds,
        exEscape
      })
    }

    throw new Error(`No parser specified for file ${filepath}`)
  }

  self.register = register
  self.parse = parse
  return self
}

module.exports = Parser
