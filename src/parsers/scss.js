const { parse } = require('scss-parser')
const traverse = require('ast-traverse')

const lineno = node =>
  node.start.line

module.exports = function ({ source, filepath, kind, exEscape }) {
  const ast = parse(source)
  const lines = source.split('\n')
  const tags = []
  const state = {}

  function address (lineNumber) {
    return `/^${exEscape(lines[lineNumber - 1])}$/`
  }

  const hasType = type => node => node.type === type
  const isIdentifier = hasType('identifier')

  traverse(ast, {
    pre (node) {
      switch (node.type) {
        case 'arguments':
          state.args = true
          break

        case 'atrule':
          if (node.value[0].type === 'atkeyword' && node.value[0].value === 'mixin') {
            const id = node.value.find(isIdentifier)
            if (id) {
              const line = lineno(id)
              tags.push({
                name: id.value,
                file: filepath,
                address: address(line),
                line,
                type: kind.FUNCTION
              })
            }
          }
          break

        case 'class': {
          const id = node.value.find(isIdentifier)
          if (id) {
            const line = lineno(id)
            tags.push({
              name: id.value,
              file: filepath,
              address: address(line),
              line,
              type: kind.CLASS
            })
          }
          break
        }

        case 'declaration':
          state.decl = true
          break

        case 'variable':
          if (state.decl && !state.args) {
            const line = lineno(node)
            tags.push({
              name: node.value,
              file: filepath,
              address: address(line),
              line,
              type: kind.VARIABLE
            })
          }
          break
      }
    },
    post (node) {
      switch (node.type) {
        case 'arguments':
          delete state.args
          break

        case 'declaration':
          delete state.decl
          break
      }
    }
  })

  return tags
}
