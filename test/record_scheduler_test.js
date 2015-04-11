'use strict';

var RecordScheduler = require('../lib/record_scheduler');

var Recorder = function (value) {
  this.value = value;
};
Recorder.prototype.get = function () {
  return this.value;
};

var recorder_generator_gen = function () {
  var i = 0;
  return function () {
    return new Recorder(i++);
  };
};

exports.scheduler = {
  setUp: function (done) {
    this.scheduler = new RecordScheduler(recorder_generator_gen());
    done();
  },
  default_parameter_test: function (test) {
    var scheduler = new RecordScheduler(recorder_generator_gen());
    test.equal(scheduler.buffer_size, 2);
    test.done();
  },
  get_current: function (test) {
    var current = this.scheduler.get_current();
    test.equal(current.get(), 0);
    test.done();
  },
  get_next: function (test) {
    var current = this.scheduler.get_current();
    var next = this.scheduler.get_next();

    test.equal(current.get(), 0);
    test.equal(next.get(), 1);

    next = this.scheduler.get_next();

    test.equal(next.get(), 0, 'scheduler buffer should be working as circular queue.');
    test.done();
  },
  schedule: function (test) {
    this.scheduler.schedule(function (current) {
      this.scheduler.cancel();

      test.equal(current.get(), 1);
      test.equal(this.scheduler.get_current().get(), 0);
      test.done();
    }.bind(this), 200);

    var next = this.scheduler.get_next();
    test.equal(next.get(), 1);
  },
  cancel: function (test) {
    this.scheduler.schedule(function () {
      this.scheduler.cancel();
      setTimeout(function () {
        var current = this.scheduler.get_current();
        test.equal(current.get(), 1);
        test.done();
      }.bind(this), 500);
    }.bind(this), 200);
  }
};