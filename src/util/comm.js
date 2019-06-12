function defaultCmp (a, b) {
  if (a === b) {
    return 0
  }
  return a < b ? -1 : 1
}

/**
 * Compare two sorted arrays, returning a three-item array as follows:
 *   [ items-unique-to-a,
 *     items-unique-to-b,
 *     items-in-both-a-and-b ]
 *
 * @param {[]*} a Array a
 * @param {[]*} b Array b
 * @param {function} [cmp] Comparator function
 * @return {[]*} Array of arrays of initial inputs
 */
module.exports = function comm (a, b, cmp = defaultCmp) {
  let onlyA = []
  let onlyB = []
  let both = []
  let indexA = 0
  let indexB = 0

  while (indexA < a.length && indexB < b.length) {
    const itemA = a[indexA]
    const itemB = b[indexB]
    const result = cmp(itemA, itemB)

    if (result === 0) {
      both.push(itemA)
      indexA += 1
      indexB += 1
    } else if (result < 0) {
      onlyA.push(itemA)
      indexA += 1
    } else {
      onlyB.push(itemB)
      indexB += 1
    }
  }

  return [onlyA, onlyB, both]
}
