/*

UTF-8 decoding only library for `js-lzma`.
Based on https://github.com/mathiasbynens/utf8.js

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

var UTF8 = UTF8 || {};

(function (UTF8) {

  "use strict";

  // http://canonical.org/~kragen/strlen-utf8.html
  // http://www.daemonology.net/blog/2008-06-05-faster-utf8-strlen.html
  // returns the number of code points for the utf8 sequence
  // usefull when pre-allocating storage for decoded results
  function utf8count(bytes) {
    // local variable access
    var j = 0, i = bytes.length;
    // process all bytes
    // order is not important
    while (i --) {
      // condition to check is quite simple
      if ((bytes[i] & 0xC0) != 0x80) ++ j;
    }
    // nr of code points
    return j;
  }

  // closures for the decoding
  // easier than to pass around
  // only one decoder active ever
  var byteArray;
  var byteCount;
  var byteIndex;

  // local variable/function access
  var fromCharCode = String.fromCharCode;

  // special check for long surrogate pairs?
  function checkScalarValue(codePoint) {
    if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
      throw Error(
        'Lone surrogate U+' + codePoint.toString(16).toUpperCase() +
        ' is not a scalar value'
      );
    }
  }
  // checkScalarValue

  // read additional bytes for a code point
  function readContinuationByte() {
    if (byteIndex >= byteCount) {
      throw Error('Invalid byte index');
    }

    var continuationByte = byteArray[byteIndex++] & 0xFF;

    if ((continuationByte & 0xC0) == 0x80) {
      return continuationByte & 0x3F;
    }

    // If we end up here, it’s not a continuation byte
    throw Error('Invalid continuation byte');
  }
  // EO readContinuationByte

  // decode one code point from byte sequence
  // stores states in the closure variables!
  function decodeSymbol() {
    var byte1 = 0;
    var byte2 = 0;
    var byte3 = 0;
    var byte4 = 0;
    var codePoint = 0;

    if ((byteIndex|0) > (byteCount|0)) {
      throw Error('Invalid byte index');
    }

    // Read first byte
    byte1 = byteArray[byteIndex] & 0xFF;
    byteIndex = (byteIndex + 1)|0;

    // 1-byte sequence (no continuation bytes)
    if ((byte1 & 0x80) == 0) {
      return byte1;
    }

    // 2-byte sequence
    if ((byte1 & 0xE0) == 0xC0) {
      byte2 = readContinuationByte();
      codePoint = ((byte1 & 0x1F) << 6) | byte2;
      if (codePoint >= 0x80) {
        return codePoint;
      } else {
        throw Error('Invalid continuation byte');
      }
    }

    // 3-byte sequence (may include unpaired surrogates)
    if ((byte1 & 0xF0) == 0xE0) {
      byte2 = readContinuationByte();
      byte3 = readContinuationByte();
      codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
      if (codePoint >= 0x0800) {
        checkScalarValue(codePoint);
        return codePoint;
      } else {
        throw Error('Invalid continuation byte');
      }
    }

    // 4-byte sequence
    if ((byte1 & 0xF8) == 0xF0) {
      byte2 = readContinuationByte();
      byte3 = readContinuationByte();
      byte4 = readContinuationByte();
      codePoint = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0C) |
        (byte3 << 0x06) | byte4;
      if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
        return codePoint;
      }
    }

    throw Error('Invalid UTF-8 detected');
  }
  // decodeSymbol

  // decode Uint8Array to Uint16Array
  // UTF8 byte sequence to code points
  function utf8decode(bytes)
  {

    // count code points
    var points = 0;
    // pre-allocate for code points
    var size = utf8count(bytes);
    var codes = new Uint16Array(size);

    // init closures
    byteIndex = 0;
    byteArray = bytes;
    byteCount = bytes.length;

    // If we have a BOM skip it
    if (((byteCount|0) > 2) &
      ((byteArray[0]|0) == 0xef) &
      ((byteArray[1]|0) == 0xbb) &
      ((byteArray[2]|0) == 0xbf))
    {
      byteIndex = 3;
    }

    // process until everything is read
    while ((byteIndex|0) < (byteCount|0)) {
      // decode code point from bytes
      var code = decodeSymbol()|0;
      // add code point to output
      codes[points++] = code;
    }
    
    // Uint16Array
    return codes;
  }
  // EO utf8decode

  // export functions
  UTF8.count = utf8count;
  UTF8.decode = utf8decode;

  // hook into LZMA to be picked up
  if (typeof LZMA != 'undefined') {
    LZMA.UTF8 = UTF8;
  }

})(UTF8);

