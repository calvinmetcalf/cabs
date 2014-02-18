var Transform = require('readable-stream').Transform;
var util = require('util');

module.exports = Chunker;

util.inherits(Chunker, Transform);

function Chunker(dest, limit) {
  if (!(this instanceof Chunker)) {
    return new Chunker(limit);
  }
  Transform.call(this, {
    objectMode: true
  });
  this.limit = limit || 4096; // 4KB, arbitrary
  this.dest = dest;
  this.currentBatch = dest.write();
  this.size = 0;
  this.place = 0;
}
function postData (place, len, cb) {
  return function (d) {
    cb({
      start:place,
      end:place + len,
      hash:d
    });
  };
}
Chunker.prototype._transform = function(obj, _, cb) {
  var newSize = this.size + obj.length;
  var self = this;
  var fit, notFit, diff;
  var inprogress = 0;
  var items = [];
  function loopCB(item){
    items.push(item);
    if(inprogress === items.length){
      items.sort(function(a,b){
        return a.start - b.start;
      });
      items.forEach(function(thing){
        this.push(thing);
      }, self);
      cb();
    }
  }
  while (newSize > this.limit) {
    diff  = newSize - this.limit;
    fit = obj.slice(0, -diff);
    notFit = obj.slice(-diff);
    this.currentBatch.write(fit);
    inprogress++;
    this.currentBatch.on('data', postData(this.place, fit.length, loopCB));
    this.currentBatch.end();
    this.place += fit.length;
    obj = notFit;
    this.size = 0;
    newSize = obj.length;
    this.currentBatch = this.dest.write();
  }
  this.size += obj.length;
  this.currentBatch.write(obj);
  if (!inprogress) {
    cb();
  }
};
  
Chunker.prototype._flush = function(cb) {
  var self = this;
  this.currentBatch.on('data', function (d) {
    self.push({
      hash:d,
      start: self.place,
      end: self.place + self.size
    });
    cb();
  });
  this.currentBatch.end();
};
