var util = require('util');
var Cab = require('./cab');
var ByteStream = require('./byteStream');
var Transform = require('readable-stream').Transform;

util.inherits(WriteCabs, Transform);

function WriteCabs(basePath) {
  if (!(this instanceof WriteCabs)) {
    return new WriteCabs(basePath);
  }
  Transform.call(this, {
    objectMode:true
  });
  this.cabs = new Cab(basePath);
  this.written = 0;
}
WriteCabs.prototype._transform = function (chunk, _, callback) {
 var out = {};
 var self = this;
 out.start = this.written;
 out.end = this.written + chunk.length;
 this.cabs.write(chunk, function(err, hash){
  if(err){
    return callback(err);
  }
  out.hash = hash;
  self.push(out);
  callback();
 });
};
util.inherits(ReadCabs, Transform);

function ReadCabs(basePath) {
  if (!(this instanceof ReadCabs)) {
    return new ReadCabs(basePath);
  }
  Transform.call(this, {
    objectMode:true
  });
  this.cabs = new Cab(basePath);
}
ReadCabs.prototype._transform = function (chunk, _, callback) {
  var self = this;
  this.cabs.read(chunk.hash, function (err, data){
    if (err) {
      return callback(err);
    }
    self.push(data);
    callback();
  });
};
exports.read = ReadCabs;
exports.write = function (path, limit){
  limit = limit || 5 * 1024 * 1024;
  var chunker = new ByteStream(limit);
  var writter = new WriteCabs(path);
  return chunker.pipe(writter);
};