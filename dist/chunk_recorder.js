/*! chunk_recorder - v0.1.0 - 2015-04-14
* https://github.com/FeGs/chunk_recorder
* Copyright (c) 2015 Hong ChulJu; Licensed MIT */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ChunkRecorder = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./record_scheduler":3}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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
},{"./event_scheduler":2}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY2h1bmtfcmVjb3JkZXIuanMiLCJsaWIvZXZlbnRfc2NoZWR1bGVyLmpzIiwibGliL3JlY29yZF9zY2hlZHVsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgUmVjb3JkU2NoZWR1bGVyID0gcmVxdWlyZSgnLi9yZWNvcmRfc2NoZWR1bGVyJyk7XG5cbmZ1bmN0aW9uIENodW5rUmVjb3JkZXIgKHJlY29yZGVyX2dlbmVyYXRvciwgcGFyYW1zKSB7XG4gIHBhcmFtcyA9IHBhcmFtcyB8fCB7fTtcblxuICAvLyBOZWVkIHRvIHNsaWNlIHBhcmFtcy5cbiAgdGhpcy5zY2hlZHVsZXIgPSBuZXcgUmVjb3JkU2NoZWR1bGVyKHJlY29yZGVyX2dlbmVyYXRvciwgcGFyYW1zKTtcbiAgdGhpcy5jaHVua19pbmRleCA9IDA7XG4gIHRoaXMuY2h1bmtzID0gW107XG5cbiAgLy8gZW5jb2RpbmdfbWV0aG9kOiAocmVjb3JkZXIsIGNhbGxiYWNrKSAtPiBudWxsXG4gIC8vIGNhbGxiYWNrOiAoZXJyLCBibG9iKSAtPiBudWxsXG4gIHRoaXMuZW5jb2RpbmdfbWV0aG9kID0gcGFyYW1zLmVuY29kaW5nX21ldGhvZDtcbiAgaWYgKCF0aGlzLmVuY29kaW5nX21ldGhvZCkge1xuICAgIHRocm93IFwiRW5jb2RpbmcgbWV0aG9kIGlzIHJlcXVpcmVkLlwiO1xuICB9XG5cbiAgLy8gMCBtZWFucyB0aGF0IG5vIHNlZ21lbnRpbmcuXG4gIHRoaXMuY2h1bmtfaW50ZXJ2YWwgPSBwYXJhbXMuY2h1bmtfaW50ZXJ2YWwgfHwgMDtcbn1cblxuQ2h1bmtSZWNvcmRlci5wcm90b3R5cGUuY2hhbmdlX2NodW5rX2ludGVydmFsID0gZnVuY3Rpb24gKGludGVydmFsKSB7XG4gIHRoaXMuY2h1bmtfaW50ZXJ2YWwgPSBpbnRlcnZhbDtcbn07XG5cbkNodW5rUmVjb3JkZXIucHJvdG90eXBlLmdldF9jaHVua3MgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmNodW5rcztcbn07XG5cbkNodW5rUmVjb3JkZXIucHJvdG90eXBlLmdldF9yZWNvcmRlciA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuc2NoZWR1bGVyLmdldF9jdXJyZW50KCk7XG59O1xuXG5DaHVua1JlY29yZGVyLnByb3RvdHlwZS5yZWNvcmQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciByZWNvcmRlciA9IHRoaXMuZ2V0X3JlY29yZGVyKCk7XG4gIGlmICghcmVjb3JkZXIpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgcmVjb3JkZXIucmVjb3JkKCk7XG5cbiAgaWYgKHRoaXMuY2h1bmtfaW50ZXJ2YWwgPiAwKSB7XG4gICAgdGhpcy5zY2hlZHVsZXIuc2NoZWR1bGUoZnVuY3Rpb24gKGN1cnJlbnRfcmVjb3JkZXIsIG5leHRfcmVjb3JkZXIpIHtcbiAgICAgIG5leHRfcmVjb3JkZXIucmVjb3JkKCk7XG4gICAgICB0aGlzLl9zdG9yZV9jaHVuayhjdXJyZW50X3JlY29yZGVyKTtcbiAgICB9LmJpbmQodGhpcyksIHRoaXMuY2h1bmtfaW50ZXJ2YWwpO1xuICB9XG59O1xuXG5DaHVua1JlY29yZGVyLnByb3RvdHlwZS5zdG9wID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gIHRoaXMuc2NoZWR1bGVyLmNhbmNlbCgpO1xuXG4gIHZhciByZWNvcmRlciA9IHRoaXMuZ2V0X3JlY29yZGVyKCk7XG4gIHRoaXMuX3N0b3JlX2NodW5rKHJlY29yZGVyLCBjYWxsYmFjayk7XG59O1xuXG5DaHVua1JlY29yZGVyLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICB0aGlzLnNjaGVkdWxlci5wYXVzZSgpO1xuXG4gIHZhciByZWNvcmRlciA9IHRoaXMuZ2V0X3JlY29yZGVyKCk7XG4gIHJlY29yZGVyLnN0b3AoKTtcbn07XG5cbkNodW5rUmVjb3JkZXIucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLnNjaGVkdWxlci5jYW5jZWwoKTtcbiAgdGhpcy5jaHVua3MgPSBbXTtcbiAgdGhpcy5jaHVua19pbmRleCA9IDA7XG59O1xuXG5DaHVua1JlY29yZGVyLnByb3RvdHlwZS5fc3RvcmVfY2h1bmsgPSBmdW5jdGlvbiAocmVjb3JkZXIsIGNhbGxiYWNrKSB7XG4gIC8vIGZvciBlbnN1cmluZyBjaHVuayBvcmRlci5cbiAgdmFyIGFmdGVyX2VuY29kaW5nID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLmNodW5rX2luZGV4O1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlcnIsIGJsb2IpIHtcbiAgICAgIHJlY29yZGVyLnN0b3AoKTtcbiAgICAgIHRoaXMuY2h1bmtzLnB1c2goe1xuICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgIGJsb2I6IGJsb2JcbiAgICAgIH0pO1xuICAgICAgcmVjb3JkZXIuY2xlYXIoKTtcblxuICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGJsb2IpO1xuICAgICAgfVxuICAgIH07XG4gIH0uYmluZCh0aGlzKSkoKTtcblxuICB0aGlzLmNodW5rX2luZGV4ICs9IDE7XG4gIHRoaXMuZW5jb2RpbmdfbWV0aG9kLmNhbGwodGhpcywgcmVjb3JkZXIsIGFmdGVyX2VuY29kaW5nLmJpbmQodGhpcykpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaHVua1JlY29yZGVyOyIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gRXZlbnRTY2hlZHVsZXIgKGV2ZW50KSB7XG4gIHRoaXMuZXZlbnQgPSBldmVudDtcbiAgdGhpcy5lbGFwc2VkX3RvdGFsID0gMDtcblxuICB0aGlzLmludGVydmFsID0gMDtcbiAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcbiAgdGhpcy5yZWNlbnRseV9zY2hlZHVsZWRfc3RhcnRfdGltZSA9IDA7XG4gIHRoaXMuaGFuZGxlID0gbnVsbDtcbn1cblxuRXZlbnRTY2hlZHVsZXIucHJvdG90eXBlLnNldF9ldmVudCA9IGZ1bmN0aW9uIChldmVudCkge1xuICB0aGlzLmV2ZW50ID0gZXZlbnQ7XG59O1xuXG5FdmVudFNjaGVkdWxlci5wcm90b3R5cGUuc2NoZWR1bGUgPSBmdW5jdGlvbiAobWlsbGlfYWZ0ZXIpIHtcbiAgaWYgKHRoaXMucGF1c2VkKSB7XG4gICAgdGhpcy5yZXN1bWUoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmludGVydmFsID0gbWlsbGlfYWZ0ZXI7XG4gIHRoaXMuY2FuY2VsKCk7XG4gIHRoaXMucmVjZW50bHlfc2NoZWR1bGVkX3N0YXJ0X3RpbWUgPSBuZXcgRGF0ZSgpO1xuXG4gIHRoaXMuaGFuZGxlID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGVuZF90aW1lID0gbmV3IERhdGUoKTtcbiAgICB0aGlzLmVsYXBzZWRfdG90YWwgKz0gKGVuZF90aW1lIC0gdGhpcy5yZWNlbnRseV9zY2hlZHVsZWRfc3RhcnRfdGltZSk7XG5cbiAgICB0aGlzLmV2ZW50KCk7XG5cbiAgICBpZiAodGhpcy5oYW5kbGUgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuc2NoZWR1bGUobWlsbGlfYWZ0ZXIpO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMpLCBtaWxsaV9hZnRlcik7XG59O1xuXG5FdmVudFNjaGVkdWxlci5wcm90b3R5cGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5oYW5kbGUpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5oYW5kbGUpO1xuICB9XG4gIHRoaXMuaGFuZGxlID0gbnVsbDtcbn07XG5cbkV2ZW50U2NoZWR1bGVyLnByb3RvdHlwZS5wYXVzZSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5jYW5jZWwoKTtcbiAgdGhpcy5wYXVzZWQgPSB0cnVlO1xuICB0aGlzLmVsYXBzZWQgPSAobmV3IERhdGUoKSAtIHRoaXMucmVjZW50bHlfc2NoZWR1bGVkX3N0YXJ0X3RpbWUpO1xuICB0aGlzLmVsYXBzZWRfdG90YWwgKz0gdGhpcy5lbGFwc2VkO1xufTtcblxuRXZlbnRTY2hlZHVsZXIucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLnBhdXNlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMucGF1c2VkID0gZmFsc2U7XG4gIHRoaXMucmVjZW50bHlfc2NoZWR1bGVkX3N0YXJ0X3RpbWUgPSBuZXcgRGF0ZSgpO1xuICB2YXIgcmVtYWluaW5nID0gdGhpcy5pbnRlcnZhbCAtIHRoaXMuZWxhcHNlZDtcblxuICB0aGlzLmhhbmRsZSA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIHZhciBlbmRfdGltZSA9IG5ldyBEYXRlKCk7XG4gICAgdGhpcy5lbGFwc2VkX3RvdGFsICs9IChlbmRfdGltZSAtIHRoaXMucmVjZW50bHlfc2NoZWR1bGVkX3N0YXJ0X3RpbWUpO1xuXG4gICAgdGhpcy5ldmVudCgpO1xuXG4gICAgaWYgKHRoaXMuaGFuZGxlICE9PSBudWxsKSB7XG4gICAgICB0aGlzLnNjaGVkdWxlKHRoaXMuaW50ZXJ2YWwpO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMpLCByZW1haW5pbmcpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudFNjaGVkdWxlcjsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudFNjaGVkdWxlciA9IHJlcXVpcmUoJy4vZXZlbnRfc2NoZWR1bGVyJyk7XG5cbmZ1bmN0aW9uIFJlY29yZFNjaGVkdWxlciAocmVjb3JkZXJfZ2VuZXJhdG9yLCBwYXJhbXMpIHtcbiAgcGFyYW1zID0gcGFyYW1zIHx8IHt9O1xuICB0aGlzLmJ1ZmZlcl9zaXplID0gcGFyYW1zLmJ1ZmZlcl9zaXplIHx8IDI7XG4gIGlmICh0aGlzLmJ1ZmZlcl9zaXplIDwgMikge1xuICAgIHRocm93IFwiQnVmZmVyIFNpemUgc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiAxLlwiO1xuICB9XG5cbiAgdGhpcy5idWZmZXIgPSBbXTtcbiAgdGhpcy5idWZmZXJfaW5kZXggPSAwO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYnVmZmVyX3NpemU7ICsraSkge1xuICAgIHRoaXMuYnVmZmVyLnB1c2gocmVjb3JkZXJfZ2VuZXJhdG9yKCkpO1xuICB9XG5cbiAgdGhpcy5zY2hlZHVsZWQgPSBuZXcgRXZlbnRTY2hlZHVsZXIoKTtcbn1cblxuUmVjb3JkU2NoZWR1bGVyLnByb3RvdHlwZS5nZXRfY3VycmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuYnVmZmVyW3RoaXMuYnVmZmVyX2luZGV4XTtcbn07XG5cblJlY29yZFNjaGVkdWxlci5wcm90b3R5cGUuZ2V0X25leHQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmJ1ZmZlci5sZW5ndGg7XG4gIHRoaXMuYnVmZmVyX2luZGV4ID0gKHRoaXMuYnVmZmVyX2luZGV4ICsgbGVuZ3RoICsgMSkgJSBsZW5ndGg7XG4gIHJldHVybiB0aGlzLmdldF9jdXJyZW50KCk7XG59O1xuXG5SZWNvcmRTY2hlZHVsZXIucHJvdG90eXBlLnNjaGVkdWxlID0gZnVuY3Rpb24gKGZ1bmMsIG1pbGxpX2FmdGVyKSB7XG4gIGlmICh0aGlzLnNjaGVkdWxlZC5wYXVzZWQpIHtcbiAgICB0aGlzLnNjaGVkdWxlZC5yZXN1bWUoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLmNhbmNlbCgpO1xuICB0aGlzLnNjaGVkdWxlZC5zZXRfZXZlbnQoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjdXJyZW50ID0gdGhpcy5nZXRfY3VycmVudCgpO1xuICAgIHZhciBuZXh0ID0gdGhpcy5nZXRfbmV4dCgpO1xuXG4gICAgcmV0dXJuIGZ1bmMoY3VycmVudCwgbmV4dCk7XG4gIH0uYmluZCh0aGlzKSk7XG4gIHRoaXMuc2NoZWR1bGVkLnNjaGVkdWxlKG1pbGxpX2FmdGVyKTtcbn07XG5cblJlY29yZFNjaGVkdWxlci5wcm90b3R5cGUucGF1c2UgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuc2NoZWR1bGVkLnBhdXNlKCk7XG59O1xuXG5SZWNvcmRTY2hlZHVsZXIucHJvdG90eXBlLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5zY2hlZHVsZWQuY2FuY2VsKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY29yZFNjaGVkdWxlcjsiXX0=
