/*

Promisified version of `js-lzma`

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

var LZMAP = LZMAP || {};

(function(LZMA, LZMAP) {

  "use strict";

  // promisified `LZMA.decompressFile` function
  LZMAP.decode = function(inStream, outStream){
    // might be given or we create a new one
    outStream = outStream || new LZMA.oStream();
    // return promise now, will resolve in time
    return new Promise(function (resolve, reject) {
      // create the LZMA decoder object
      try {
        // invoke main decompress function
        LZMA.decompressFile(inStream, outStream)
      }
      catch (err) {
        // reject with error
        reject(err);
      }
      // resolved successfully
      resolve(outStream);
    })
  };

})(LZMA, LZMAP);
