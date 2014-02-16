var crypto = require('crypto')
var fs = require('fs')
var path = require('path')

var hasher =  crypto.createHash('sha256')
var file = fs.createReadStream(path.join(process.cwd(), process.argv[2]))

console.time('hash')

file.on('close', function() {
  console.log(hasher.read().toString('hex'))
  console.timeEnd('hash')
})

file.pipe(hasher)

function hashes() {
  hash.write(input);
  hash.end();
}
