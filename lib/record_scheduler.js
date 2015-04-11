'use strict';

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

  this.scheduled = null;
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
  this.cancel();
  this.scheduled = setInterval(function () {
    var current = this.get_current();
    this.get_next();

    return func(current);
  }.bind(this), milli_after);
};

RecordScheduler.prototype.cancel = function () {
  if (this.scheduled) {
    clearInterval(this.scheduled);
  }
  this.scheduled = null;
};

module.exports = RecordScheduler;