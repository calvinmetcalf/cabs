var int = require('int-encoder');
var mkdirp = requrire('mkdirp');
var crypto = reqiure("crypto");
var util = require('util');
var es = require('event-stream');
var Transform = require('stream').Transform;
int.alphabet('abcdefghijklmnopqrstuvwxyz0123456789');
function makePath(input) {
  var last;
  var out = [];
  var i = -1;
  var len = input.length;
  while (++i < len) {
    if (last) {
      out.push(last + input[i]);
      last = null;
    } else {
      last = input[i];
    }
  }
  return out;
}
function makeHash(input) {
  var hash = crypto.createHash('sha384');
  hash.write(input);
  hash.end();
  var buffer = hash.read();
  return int.encode(buffer.toString('hex'),16);
}

util.inherits(WriteCabs, Transform);

function WriteCabs(opts) {
  if (!(this instanceof Cabs)) {
    return new Cabs(opts);
  }
  Transform.call(this, opts);
  this.basePath = opts.basePath || './';
  if (this.basePath[-1] !== '/') {
    this.basePath = this.basePath + '/';
  }
  this.current = new Buffer(0);
  this.currentStart = 0;
  this.blockSize = 5 * 1024 * 1024;
}

WriteCabs.prototype._transform = function (chunk, _, callback) {
  var self = this;
  this.current = Buffer.concat([this.current, chunk], this.current.length + chunk.length);
  if (this.current.length < this.blockSize) {
    return callback();
  }
  var hash = makeHash(this.current);
  var pathParts = makePath(hash);
  var fName = pathParts.pop();
  var path = this.basePath + pathParts.join('/');
  mkdirp(path, function (err) {
    if (err) {
      return callback(err);
    }
    var fullPath = path + '/' + fName;
    fs.writeFile(fullPath, self.current, function(err){
      if (err) {
        return callback(err);
      }
      var out = {};
      out.start = self.currentStart;
      out.end = out.start + self.current.length;
      self.currentStart = out.end;
      out.hash = hash;
      self.current = new Buffer(0);
      callback(null, out);
    });
  });
};

function cabs (instream, path, cb) {
  var out = [];
  var obj = new WriteCabs({
    basePath: path
  });
  var collector = es.map(function(data,cb){
    out.push(data);
    cb();
  });
  collector.on('error', cb);
  collector.on('end', cb(null, out));
  instream.pipe(obj).pipe(collector);
}
module.exports = cabs;