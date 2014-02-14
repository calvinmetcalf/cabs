#!/usr/bin/env node
var cabs = require('./cabs.js');
var stdout = require('stdout');
process.stdin.pipe(cabs.write(process.argv[2] || process.cwd())).pipe(stdout());