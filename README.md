# chunk_recorder

Record chunked audio (Recorder interface: [Recorderjs](https://github.com/mattdiamond/Recorderjs))

## Getting Started

### In the browser
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/FeGs/chunk_recorder/master/dist/chunk_recorder.min.js
[max]: https://raw.github.com/FeGs/chunk_recorder/master/dist/chunk_recorder.js

In your web page:

```html
<script src="dist/chunk_recorder.min.js"></script>
<script>
// Recorder class from Recorderjs.
var input = audio_context.createMediaStreamSource(stream);
var chunk_recorder = new ChunkRecorder(function () {
  return new Recorder(input);
}, {
  chunk_interval: 10000, // Interval of each chunk is 10 seconds.
  encoding_method: function (recorder, callback) {
    recorder.exportWAV(function (blob) {
      callback(null, blob);
    });
  }
});
</script>
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

_Also, please don't edit files in the "dist" subdirectory as they are generated via Grunt. You'll find source code in the "lib" subdirectory!_

## Release History
_(Nothing yet)_

## License
Copyright (c) 2015 Hong ChulJu
Licensed under the MIT license.
