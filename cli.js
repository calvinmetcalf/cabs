#!/usr/bin/env node
var cab = require('./cab.js')
var stdout = require('stdout')
process.stdin.pipe(cab.write(process.argv[2] || process.cwd())).pipe(stdout())