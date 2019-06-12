module.exports = function (tags, opts = {}) {
  let result = ''

  if (opts.encoding !== undefined) {
    result += `!_TAG_FILE_ENCODING\t${opts.encoding}\t//\n`
  }
  if (opts.sorted !== undefined) {
    result += `!_TAG_FILE_SORTED\t${opts.sorted}\t/0=unsorted, 1=sorted, 2=foldcase/\n`
  }

  for (let i = 0; i < tags.length; i += 1) {
    const tag = tags[i]
    result += `${tag.name}\t${tag.file}\t${tag.address}`

    if (opts.exuberant) {
      result += `;"\t${tag.type}\tlineno:${tag.line}`
    }

    result += '\n'
  }

  return result
}
