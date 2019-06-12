const js = require('./javascript')
const scss = require('./scss')

module.exports = [
  {
    name: 'javascript',
    extensions: ['.js', '.jsx'],
    parser: js
  },
  {
    name: 'scss',
    extensions: ['.scss'],
    parser: scss
  }
]
