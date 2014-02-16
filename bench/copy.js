var fs = require('fs')
var path = require('path')

var file = fs.createReadStream(path.join(process.cwd(), process.argv[2]))
var target = fs.createWriteStream(path.join(process.cwd(), 'copy.foobarbaz'))

console.time('copy')

file.on('close', function() {
  console.timeEnd('copy')
})

file.pipe(target)
