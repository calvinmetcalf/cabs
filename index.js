
var util = require('util');
var Cabs = require('./cabs');
var ByteStream = require('byte-stream');
var Transform = require('readable-stream').Transform;
var pipeline = require('event-stream').pipeline;


util.inherits(WriteCabs, Transform);

function WriteCabs(basePath) {
  if (!(this instanceof WriteCabs)) {
    return new WriteCabs(basePath);
  }
  Transform.call(this, {
    objectMode:true
  });
  this.cabs = new Cabs(basePath);
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
  this.cabs = new Cabs(basePath);
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
  return pipeline(chunker, writter);
};
exports.Cabs = Cabs;