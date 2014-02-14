var int = require('int-encoder');
var mkdirp = require('mkdirp');
var crypto = require("crypto");
var fs = require('fs');
var rimraf = require("rimraf");
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

function Cabs(basePath) {
  if(!(this instanceof Cabs)){
    return new Cabs(basePath);
  }
  if(!basePath){
    throw new Error('path required');
  }
  this.basePath = basePath;
  if (this.basePath[-1] !== '/') {
    this.basePath = this.basePath + '/';
  }
}

Cabs.prototype.write = function(chunk, callback) {
  var self = this;
  var hash = makeHash(chunk);
  var pathParts = makePath(hash);
  var fName = pathParts.pop();
  var path = this.basePath + pathParts.join('/');
  mkdirp(path, function (err) {
    if (err) {
      return callback(err);
    }
    var fullPath = path + '/' + fName;
    fs.writeFile(fullPath, chunk, function(err){
      if (err) {
        return callback(err);
      }
      callback(null, hash);
    });
  });
};
Cabs.prototype.read = function(hash, callback) {
  var path = this.basePath + makePath(hash).join('/');
  var self = this;
  fs.readFile(path, callback);
};
Cabs.prototype.rm = function(hash, callback) {
  var pathParts = makePath(hash);
  var self = this;
  var path = this.basePath + pathParts.join('/');
  function checkEmpty(){
    pathParts.pop();
    if(!pathParts.length){
      return callback();
    }
    var dirPath = self.basePath + pathParts.join('/');
    fs.rmdir(dirPath, function (err){
      if(err){
        return callback();
      } else {
        process.nextTick(checkEmpty);
      }
    });
  }
  fs.unlink(path, function (err) {
    if (err) {
      return callback(err);
    }
    checkEmpty();
  });
};
Cabs.prototype.destroy = function(callback) {
  rimraf(this.basePath, callback);
};
module.exports = Cabs;