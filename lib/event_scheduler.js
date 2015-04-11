'use strict';

function EventScheduler (event) {
  this.event = event;
  this.elapsed_total = 0;

  this.interval = 0;
  this.paused = false;
  this.recently_scheduled_start_time = 0;
  this.handle = null;
}

EventScheduler.prototype.set_event = function (event) {
  this.event = event;
};

EventScheduler.prototype.schedule = function (milli_after) {
  if (this.paused) {
    this.resume();
    return;
  }

  this.interval = milli_after;
  this.cancel();
  this.recently_scheduled_start_time = new Date();

  this.handle = setTimeout(function () {
    var end_time = new Date();
    this.elapsed_total += (end_time - this.recently_scheduled_start_time);

    this.event();

    if (this.handle !== null) {
      this.schedule(milli_after);
    }
  }.bind(this), milli_after);
};

EventScheduler.prototype.cancel = function () {
  if (this.handle) {
    clearTimeout(this.handle);
  }
  this.handle = null;
};

EventScheduler.prototype.pause = function () {
  this.cancel();
  this.paused = true;
  this.elapsed = (new Date() - this.recently_scheduled_start_time);
  this.elapsed_total += this.elapsed;
};

EventScheduler.prototype.resume = function () {
  if (!this.paused) {
    return;
  }

  this.paused = false;
  this.recently_scheduled_start_time = new Date();
  var remaining = this.interval - this.elapsed;

  this.handle = setTimeout(function () {
    var end_time = new Date();
    this.elapsed_total += (end_time - this.recently_scheduled_start_time);

    this.event();

    if (this.handle !== null) {
      this.schedule(this.interval);
    }
  }.bind(this), remaining);
};

module.exports = EventScheduler;