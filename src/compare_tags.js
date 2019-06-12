const compareProp = prop => (a, b) => {
  const valA = a[prop]
  const valB = b[prop]
  if (valA < valB) {
    return -1
  } else if (valA > valB) {
    return 1
  }
  return 0
}

const compareProps = props => {
  const cmps = props.map(compareProp)
  let result
  return (a, b) => {
    for (let i = 0; i < cmps.length; i += 1) {
      const cmp = cmps[i]
      result = cmp(a, b)
      if (result !== 0) {
        break
      }
    }
    return result
  }
}

module.exports = compareProps(['name', 'filename', 'line'])
