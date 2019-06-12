const acorn = require('acorn')
const jsx = require('acorn-jsx')
const traverse = require('ast-traverse')

const lineno = node =>
  node.loc.start.line

module.exports = function ({ source, filepath, kind, exEscape }) {
  const ast = acorn.Parser.extend(jsx()).parse(source, {
    sourceType: 'module',
    locations: true
  })
  const lines = source.split('\n')
  const tags = []

  function address (lineNumber) {
    return `/^${exEscape(lines[lineNumber - 1])}$/`
  }

  traverse(ast, {
    pre (node) {
      switch (node.type) {
        case 'ClassDeclaration': {
          const line = lineno(node)
          tags.push({
            name: node.id.name,
            file: filepath,
            address: address(line),
            line,
            type: kind.CLASS
          })
          break
        }

        case 'ClassMethod':
          if (node.key.name !== 'constructor') {
            const line = lineno(node)
            tags.push({
              name: node.key.name,
              file: filepath,
              address: address(line),
              line,
              type: kind.FUNCTION
            })
          }
          break

        case 'FunctionDeclaration':
          if (node.id) {
            const line = lineno(node)
            tags.push({
              name: node.id.name,
              file: filepath,
              address: address(line),
              line,
              type: kind.IMPORT
            })
          }
          break

        case 'ImportDefaultSpecifier': {
          const line = lineno(node)
          tags.push({
            name: node.local.name,
            file: filepath,
            address: address(line),
            line,
            type: kind.IMPORT
          })
          break
        }

        case 'ImportSpecifier':
          if (node.id) {
            const line = lineno(node)
            tags.push({
              name: node.id.name,
              file: filepath,
              address: address(line),
              line,
              type: kind.IMPORT
            })
          }
          break

        case 'VariableDeclarator':
          if (node.id.name) {
            const line = lineno(node)
            tags.push({
              name: node.id.name,
              file: filepath,
              address: address(line),
              line,
              type: kind.VARIABLE
            })
          } else if (node.id.elements) {
            // Array destructuring
            for (let i = 0; i < node.id.elements.length; i += 1) {
              let el = node.id.elements[i]
              const line = lineno(el)
              tags.push({
                name: el.name,
                file: filepath,
                address: address(line),
                line,
                type: kind.VARIABLE
              })
            }
          }
          break
      }
    }
  })

  return tags
}
