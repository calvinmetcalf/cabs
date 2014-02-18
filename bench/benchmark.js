// run this from inside a folder e.g. cd ~/folder-full-of-mp3s && node ~/src/cabs/bench/benchmark.js
// all non-directories in the top level of the folder you run this from will be
// streamed into cabs, in a folder located at ../tmp-cabs-data relative to the folder
// afterwards this cabs folder will be removed
var Cabs = require('../')
var ldjson = require('ldjson-stream')
var rimraf = require('rimraf')
var fs = require('fs')
var path = require('path')

var dir = process.cwd()
var target = path.join(dir, '..', 'tmp-cabs-data')
var blobs = path.join(target, 'blobs')

var specific = process.argv[2]
if (specific) {
  var files = [specific]
} else {
  var readdir = fs.readdirSync(dir)
  var files = []
  readdir.map(function(f) {
    var isFile = !fs.statSync(f).isDirectory()
    if (isFile) files.push(f)
  })
}

rimraf(target, function(err) {
  fs.mkdirSync(target)
  console.log('streaming these into cabs:', files)
  console.time('done')
  proceed()
})

function proceed() {
  var next = files.pop()
  if (!next) {
    rimraf(target, function() {})
    console.timeEnd('done')
  } else {
    write(next, proceed)
  }
}

function write(file, cb) {
  var rs = fs.createReadStream(file)
  var ws = fs.createWriteStream(path.join(target, path.basename(file) + '.json'))
  var opts = {
    path: blobs
  }
  var cabs = new Cabs(opts)
  rs.pipe(cabs.write()).pipe(ldjson.serialize()).pipe(ws)
  ws.on('close', cb)
}
