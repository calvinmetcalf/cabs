var Cabs = require('./cabs');


Cabs.read  = function (path, hash, limit){
  var cabs = new Cabs({
    path: path,
    hashFunc: hash,
    limit: limit
  });
  return cabs.readStream();
};
Cabs.write = function (path, hash, limit){
  var cabs = new Cabs({
    path: path,
    hashFunc: hash,
    limit: limit
  });
  return cabs.writeStream();
};
Cabs.writeFile = function (path, hash, limit){
  var cabs = new Cabs({
    path: path,
    hashFunc: hash,
    limit: limit
  });
  return cabs.write();
};

module.exports = Cabs;
