/*

Custom Parallel File Format for `js-lzma`.

Copyright (c) 2017 Marcel Greter (http://github.com/mgreter)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var PWLZMA = PWLZMA || {};

(function(LZMA, PWLZMA) {

  "use strict";

  // support for parallelized decompression
  // custom file format with parallel chunks
  PWLZMA.decode = function(wlzma, inStream, outStream){

    // upgrade ArrayBuffer to input stream
    if (inStream instanceof ArrayBuffer) {
      inStream = new LZMA.iStream(inStream);
    }

    return new Promise(function (resolve, reject) {

      var lengths = [];

      if (
        // check our custom static header
        // every file starts with "PLZMA1"
        inStream.readByte() !== 80 ||
        inStream.readByte() !== 76 ||
        inStream.readByte() !== 90 ||
        inStream.readByte() !== 77 ||
        inStream.readByte() !== 65 ||
        inStream.readByte() !== 49
      ) {
        throw Error("Invalid PLZMA1 header!");
      }

      // read number of parallel blocks
      var blocks = inStream.readByte();
      blocks += inStream.readByte() << 8;
      blocks += inStream.readByte() << 16;
      blocks += inStream.readByte() << 24;

      // read in offsets for each block
      for (var i = 0; i < blocks; i++) {
        lengths[i]  = inStream.readByte() << 0;
        lengths[i] += inStream.readByte() << 8
        lengths[i] += inStream.readByte() << 16
        lengths[i] += inStream.readByte() << 24
      }

      // pre-allocate result buffer
      // fail early, no way around
      // var result = new Uint8Array(size);
      var promises = [];

      var offset = 10 + blocks * 4;
      var buffer = inStream.array.buffer;
      // schedule all jobs (lazy loaded)
      for (var i = 0; i < blocks; i++) {
        // closure for iterator variables
        (function(i, offset) {
          // schedule a new decompress worker job
          promises.push(wlzma.decode(function() {
            // return jobs lazy to copy chunks on demand
            // those chunks are sent directly to the workers
            // unfortunately no way to share a read-only buffer
            return buffer.slice(offset, offset + lengths[i]);
          }));
        // create scope
        })(i, offset);
        // increment offset
        offset += lengths[i];
      }

      // wait for all jobs
      Promise.all(promises)
      // react on success
      .then(function (outStreams) {
        // create output stream from buffers
        resolve(new LZMA.oStream(outStreams));
      })
      // return errors
      .catch(reject);

    });
    // EO Promise

  };
  // EO PWLZMA.decompress

})(LZMA, PWLZMA);
