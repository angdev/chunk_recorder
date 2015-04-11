'use strict';

var EventScheduler = require('../lib/event_scheduler');

exports.test = {
  setUp: function (done) {
    this.scheduler = new EventScheduler(function () {});
    done();
  }
};