/*! chunk_recorder - v0.1.0 - 2015-04-11
* https://github.com/FeGs/chunk_recorder
* Copyright (c) 2015 Hong ChulJu; Licensed MIT */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ChunkRecorder = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

exports.awesome = function() {
  return 'awesome';
};
},{}],2:[function(require,module,exports){
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
}

RecordScheduler.prototype.get_current = function () {
  return this.buffer[this.buffer_index];
};

RecordScheduler.prototype.get_next = function () {
  var length = this.buffer.length;
  this.buffer_index = (this.buffer_index + length + 1) % length;
  return this.get_current();
};

module.exports = RecordScheduler;
},{}]},{},[1,2])(2)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJsaWIvY2h1bmtfcmVjb3JkZXIuanMiLCJsaWIvcmVjb3JkX3NjaGVkdWxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5hd2Vzb21lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnYXdlc29tZSc7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gUmVjb3JkU2NoZWR1bGVyIChyZWNvcmRlcl9nZW5lcmF0b3IsIHBhcmFtcykge1xuICBwYXJhbXMgPSBwYXJhbXMgfHwge307XG4gIHRoaXMuYnVmZmVyX3NpemUgPSBwYXJhbXMuYnVmZmVyX3NpemUgfHwgMjtcbiAgaWYgKHRoaXMuYnVmZmVyX3NpemUgPCAyKSB7XG4gICAgdGhyb3cgXCJCdWZmZXIgU2l6ZSBzaG91bGQgYmUgZ3JlYXRlciB0aGFuIDEuXCI7XG4gIH1cblxuICB0aGlzLmJ1ZmZlciA9IFtdO1xuICB0aGlzLmJ1ZmZlcl9pbmRleCA9IDA7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5idWZmZXJfc2l6ZTsgKytpKSB7XG4gICAgdGhpcy5idWZmZXIucHVzaChyZWNvcmRlcl9nZW5lcmF0b3IoKSk7XG4gIH1cbn1cblxuUmVjb3JkU2NoZWR1bGVyLnByb3RvdHlwZS5nZXRfY3VycmVudCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuYnVmZmVyW3RoaXMuYnVmZmVyX2luZGV4XTtcbn07XG5cblJlY29yZFNjaGVkdWxlci5wcm90b3R5cGUuZ2V0X25leHQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmJ1ZmZlci5sZW5ndGg7XG4gIHRoaXMuYnVmZmVyX2luZGV4ID0gKHRoaXMuYnVmZmVyX2luZGV4ICsgbGVuZ3RoICsgMSkgJSBsZW5ndGg7XG4gIHJldHVybiB0aGlzLmdldF9jdXJyZW50KCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY29yZFNjaGVkdWxlcjsiXX0=
