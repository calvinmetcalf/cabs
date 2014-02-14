#!/usr/bin/env node
// write a file: cabs blobfolder/ < data.jpg > data-hashes.json
// read a file: cabs checkout blobfolder/ < data-hashes.json > data-copy.jpg
var cabs = require('./')
var ldjson = require('ldjson-stream')
var dir = process.argv[2] || process.cwd()

if (dir === 'checkout') {
  dir = process.argv[3]
  read()
} else {
  write()
}

function read() {
  process.stdin.pipe(ldjson.parse()).pipe(cabs.read(dir)).pipe(process.stdout)
}

function write() {
  process.stdin.pipe(cabs.write(dir)).pipe(ldjson.serialize()).pipe(process.stdout)
}