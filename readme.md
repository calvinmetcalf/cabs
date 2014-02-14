CABS
====

exports read and write methods

write
====

```javascript
cab.write(path, limit);
```

pipe in a stream, get objects, (you will need to pipe to read)

read
====

```javascript
cab.read(path)
```

pipe in the objects from write, returns a readable stream