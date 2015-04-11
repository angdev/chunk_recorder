'use strict';

var chunk_recorder = require('../lib/chunk_recorder.js');

exports.awesome = {
  setUp: function(done) {
    // setup here
    done();
  },
  'no args': function(test) {
    test.expect(1);
    // tests here
    test.equal(chunk_recorder.awesome(), 'awesome', 'should be awesome.');
    test.done();
  }
};
