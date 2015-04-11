'use strict';

// Test of ChunkRecoder is separated by two parts :
// Test suites required browser and not required browser.

var ChunkRecorder = require('../lib/chunk_recorder.js');

var Recorder = require('./recorder_mock');
var recorder_generator = function () {
  return new Recorder();
};

var encoding_method = function (recorder, callback) {
  callback(null, 'blob');
};

exports.test = {
  setUp: function (done) {
    this.chunk_recorder = new ChunkRecorder(recorder_generator, {
      chunk_interval: 200,
      encoding_method: encoding_method
    });
    done();
  },
  tearDown: function (done) {
    this.chunk_recorder.clear();
    done();
  },
  record: {
    'chunked recording': function (test) {
      var chunk_recorder = this.chunk_recorder;

      chunk_recorder.record();
      setTimeout(function () {
        test.equal(chunk_recorder.get_chunks().length, 1);
        test.done();
      }, 300);
    },
    'no chunked recording': function (test) {
      var chunk_recorder = this.chunk_recorder;

      chunk_recorder.change_chunk_interval(0);
      chunk_recorder.record();
      setTimeout(function () {
        test.equal(chunk_recorder.get_chunks().length, 0);
        test.done();
      }, 300);
    }
  },
  pause: function (test) {
    var chunk_recorder = this.chunk_recorder;

    chunk_recorder.record();
    chunk_recorder.pause();

    test.equal(chunk_recorder.get_chunks().length, 0);

    chunk_recorder.stop(function () {
      test.equal(chunk_recorder.get_chunks().length, 1);
      test.done();
    });
  },
  stop: {
    'chunked stop': function (test) {
      var chunk_recorder = this.chunk_recorder;

      chunk_recorder.record();
      setTimeout(function () {
        chunk_recorder.stop(function () {
          test.equal(chunk_recorder.get_chunks().length, 2);
          test.done();
        });
      }, 300);
    },
    'no chunked stop': function (test) {
      var chunk_recorder = this.chunk_recorder;

      chunk_recorder.change_chunk_interval(0);
      chunk_recorder.record();
      setTimeout(function () {
        chunk_recorder.stop(function () {
          test.equal(chunk_recorder.get_chunks().length, 1);
          test.done();
        });
      }, 300);
    }
  },
  clear: function (test) {
    var chunk_recorder = this.chunk_recorder;

    chunk_recorder.record();
    chunk_recorder.stop(function () {
      test.equal(chunk_recorder.get_chunks().length, 1);
      test.equal(chunk_recorder.chunk_index, 1);

      chunk_recorder.clear();

      test.equal(chunk_recorder.get_chunks().length, 0);
      test.equal(chunk_recorder.chunk_index, 0);

      test.done();
    });
  }
};