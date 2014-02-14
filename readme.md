CABS
====

Content Addressable Blob Store

write
====

```javascript
cabs.write(path, limit);
```

pipe in a stream, get objects for the various pieces stored, each object has a hash of the block, as well as the starting and ending locations within the stream.
```

read
====

```javascript
cabs.read(path)
```

pipe in the objects from write, returns a readable stream

Low Level Class
=====

you also have access to the base Cabs class located at `cabs.Cabs`, initialize it with a location and it has the following methods.

```javascript
var store = new cabs.Cabs('./location');

store.write(buffer, callback);
//stores buffer, callback is called with the hash

store.read(hash, callback);
//calls the callback with the blob

store.rm(hash, callback);
//removes the file with the given hash

store.destroy(callback);
//deletes all the files related to the store, just a shortcut to rimraf so beaware.
```