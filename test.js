var should = require('chai').should();
var cab = require('./cab');
var fs = require('fs');
var through = require('through2');
var rimraf = require('rimraf');
var result = [ 
  {
    start: 0,
    end: 3,
    hash: 'ceyun6xbmmsfibs9ny4sr7w530v39cz1z2drmm2ww1otd414dfe72260gc1x1cqzlai3zyo2lg5' 
  } 
];
describe('cab', function(){
  after(function(done){
    rimraf('./testData', done);
  });
  it('should work', function(done){
    var tdata = through();
    tdata.write(new Buffer('abc'));
    tdata.end();
    cab.write(tdata, './testData', function(err, data){
      data.should.deep.equal(result);
      done();
    });
  });
  it('should be readable', function(done){
    var times = 0;
    var thing = cab.read(result,'./testData')
      .pipe(through(function(data, _, cb){
        data.should.deep.equal(new Buffer('abc'));
        done();
        cb();
    }));
  });
});