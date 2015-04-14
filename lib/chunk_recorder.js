'use strict';

var RecordScheduler = require('./record_scheduler');

function ChunkRecorder (recorder_generator, params) {
  params = params || {};

  // Need to slice params.
  this.scheduler = new RecordScheduler(recorder_generator, params);
  this.chunk_index = 0;
  this.chunks = [];

  // encoding_method: (recorder, callback) -> null
  // callback: (err, blob) -> null
  this.encoding_method = params.encoding_method;
  if (!this.encoding_method) {
    throw "Encoding method is required.";
  }

  // 0 means that no segmenting.
  this.chunk_interval = params.chunk_interval || 0;
}

ChunkRecorder.prototype.change_chunk_interval = function (interval) {
  this.chunk_interval = interval;
};

ChunkRecorder.prototype.get_chunks = function () {
  return this.chunks;
};

ChunkRecorder.prototype.get_recorder = function () {
  return this.scheduler.get_current();
};

ChunkRecorder.prototype.record = function () {
  var recorder = this.get_recorder();
  if (!recorder) {
    return;
  }
  recorder.record();

  if (this.chunk_interval > 0) {
    this.scheduler.schedule(function (current_recorder, next_recorder) {
      next_recorder.record();
      this._store_chunk(current_recorder);
    }.bind(this), this.chunk_interval);
  }
};

ChunkRecorder.prototype.stop = function (callback) {
  this.scheduler.cancel();

  var recorder = this.get_recorder();
  this._store_chunk(recorder, callback);
};

ChunkRecorder.prototype.pause = function (callback) {
  this.scheduler.pause();

  var recorder = this.get_recorder();
  recorder.stop();
};

ChunkRecorder.prototype.clear = function () {
  this.scheduler.cancel();
  this.chunks = [];
  this.chunk_index = 0;
};

ChunkRecorder.prototype._store_chunk = function (recorder, callback) {
  // for ensuring chunk order.
  var after_encoding = (function () {
    var index = this.chunk_index;

    return function (err, blob) {
      recorder.stop();
      this.chunks.push({
        index: index,
        blob: blob
      });
      recorder.clear();

      if (callback) {
        callback(null, blob);
      }
    };
  }.bind(this))();

  this.chunk_index += 1;
  this.encoding_method.call(this, recorder, after_encoding.bind(this));
};

module.exports = ChunkRecorder;