var Cabs = require('./cabs');


Cabs.read  = function (path, hash, limit){
  var cabs = new Cabs(path, hash, limit);
  return cabs.readStream();
};
Cabs.write = function (path, hash, limit){
  var cabs = new Cabs(path, hash, limit);
  return cabs.writeStream();
};
Cabs.writeFile = function (path, hash, limit){
  var cabs = new Cabs(path, hash, limit);
  return cabs.write();
};

module.exports = Cabs;
