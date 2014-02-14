var should = require('chai').should();
var cabs = require('./');
var fs = require('fs');
var through = require('through2');
var result = [ 
  {
    start: 0,
    end: 3,
    hash: 'ceyun6xbmmsfibs9ny4sr7w530v39cz1z2drmm2ww1otd414dfe72260gc1x1cqzlai3zyo2lg5' 
  } 
];
describe('cab', function(){
  it('should work', function(done){
    var tdata = through();
    tdata.write(new Buffer('abc'));
    tdata.end();
    var outstream = cabs.write('./testData');
    outstream.on('data',function(data){
      data.should.deep.equal(result[0]);
      done();
    });
    tdata.pipe(outstream);
  });
  it('should be readable', function(done){
    var times = 0;
    var thing = cabs.read('./testData');
    thing.write(result[0]);
    thing.end();
    thing.pipe(through(function(data, _, cb){
        data.should.deep.equal(new Buffer('abc'));
        done();
        cb();
    }));
  });
   it('should be removable', function(done){
    var obj = new cabs.Cabs('./testData');
    fs.readdir('./testData', function(err,data){
      if(err){
        return done(err);
      }
      data.should.have.length(1);
      obj.rm(result[0].hash, function(err){
        if(err){
          return done(err);
        }
        fs.readdir('./testData', function(err,data){
          if(err){
            return done(err);
          }
          data.should.have.length(0);
          done();
        });
      });
    });
  });
  it('should be destroyable', function (done) {
    fs.existsSync('./testData').should.equal(true);
    var obj = cabs.Cabs('./testData');
    obj.destroy(function(err){
      fs.existsSync('./testData').should.equal(false);
      done(err);
    });
  });
  it('should throw an error if no path is provided', function(){
    (function(){
      var obj = new cabs.Cabs();
    }).should.throw();
  });
});