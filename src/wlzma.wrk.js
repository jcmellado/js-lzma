/*

Webworker Backend for `js-lzma`.
This is the Main Background Task.

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

"use strict";

// maybe already existing?
// sources might be joined?
var LZMA = LZMA;

// optional imports
if (!LZMA) importScripts('lzma.js');
if (!LZMA.oStream) importScripts('lzma.shim.js');

onmessage = function(e) {
  // get buffer from data
  var wid = e.data[0],
      buffer = e.data[1];
  // create the input stream instance
  var inStream = new LZMA.iStream(buffer);
  // create the output stream instance
  var outStream = new LZMA.oStream();
  // catch stream errors
  try {
    // invoke main decompress function
    LZMA.decompressFile(inStream, outStream)
    // create a continous byte array
    var buffers = outStream.buffers, pass = [];
    for (var i = 0; i < buffers.length; i++) {
      pass[i] = buffers[i].buffer;
    }
    // pass back the continous buffer
    postMessage([wid, buffers], pass);
  }
  catch (err) {
    // need to create a poor mans clone as not transferable
    var error = { message: err.message, stack: err.stack };
    // pass back the complete error object
    postMessage([wid, null, error]);
  }

}

postMessage("ready");
