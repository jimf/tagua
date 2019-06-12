#!/usr/bin/env node
/* eslint no-console:0 */

const cli = require('../src/cli')

const opts = {
  writeStdout: process.stdout.write.bind(process.stdout),
  writeStderr: process.stderr.write.bind(process.stderr)
}

cli(process.argv, opts)
  .then(() => { process.exit(0) })
  .catch(() => { process.exit(1) })
