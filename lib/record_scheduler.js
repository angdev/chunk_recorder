'use strict';

var EventScheduler = require('./event_scheduler');

function RecordScheduler (recorder_generator, params) {
  params = params || {};
  this.buffer_size = params.buffer_size || 2;
  if (this.buffer_size < 2) {
    throw "Buffer Size should be greater than 1.";
  }

  this.buffer = [];
  this.buffer_index = 0;
  for (var i = 0; i < this.buffer_size; ++i) {
    this.buffer.push(recorder_generator());
  }

  this.scheduled = new EventScheduler();
}

RecordScheduler.prototype.get_current = function () {
  return this.buffer[this.buffer_index];
};

RecordScheduler.prototype.get_next = function () {
  var length = this.buffer.length;
  this.buffer_index = (this.buffer_index + length + 1) % length;
  return this.get_current();
};

RecordScheduler.prototype.schedule = function (func, milli_after) {
  if (this.scheduled.paused) {
    this.scheduled.resume();
    return;
  }

  this.cancel();
  this.scheduled.set_event(function () {
    var current = this.get_current();
    var next = this.get_next();

    return func(current, next);
  }.bind(this));
  this.scheduled.schedule(milli_after);
};

RecordScheduler.prototype.pause = function () {
  this.scheduled.pause();
};

RecordScheduler.prototype.cancel = function () {
  this.scheduled.cancel();
};

module.exports = RecordScheduler;