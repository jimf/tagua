/**
 * Escape special characters in a given Ex command.
 *
 * @param {string} line Line to escape
 * @return {string} Escaped line
 */
module.exports = function exEscape (line) {
  return line.replace(/[\\/^$*]/g, '\\$&')
}
