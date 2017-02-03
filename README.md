# JavaScript LZMA Decompressor #

`js-lzma` is a manual port of the LZMA decompression algorithm, from the original
Java version found in the [LZMA SDK](http://www.7-zip.org/sdk.html). It supports
files created by the `lzma` or any compatible compression utility.

## Simple Ajax Example ##

```js
var url = "/some/file/to/load";
var oReq = new XMLHttpRequest();
oReq.open("GET", url, true);
oReq.responseType = "arraybuffer";
oReq.onload = function(oEvent) {
  var inStream = new LZMA.iStream(oReq.response);
  var outStream = LZMA.decompressFile(inStream);
  var bytes = outStream.toUint8Array();
  var string = outStream.toString();
};
oReq.send();
```

## API Documentation ##

### `LZMA.decompressFile` ###

If you have the content of a `.lzma` file then just call to the `decompressFile` function:

```js
outStream = LZMA.decompressFile(inStream, outStream);
```

 * `inStream` is the input data stream to decompress
 * `outStream` is the output data stream to write to

The `outStream` argument is optional and the function will create a new `LZMA.oStream`
if it's omitted or null. You must pass an existing output stream if you want to append
to it or if you need to use a different implementation. You may also try to export
your output stream class to `LZMA.oStream`, which may or may not work ...

### `LZMA.decompress(properties, inStream, outStream, outSize)` ###

If you want more control about the process then you can use the `decompress` function:

```js
LZMA.decompress(properties, inStream, outStream, outSize);
```

 * `properties` is the input data stream with LZMA properties
 * `inStream` is the input data stream to decompress
 * `outStream` is the output data stream to write to
 * `outSize` is the expected size of output data stream

### `LZMA.Decoder` ###

You may also interact with the `LZMA.Decoder` directly:

```js
// create main decoder instance
var decoder = new LZMA.Decoder();
// read all the header properties
var header = decoder.decodeHeader(inStream);
// get maximum output size (not guaranteed)
// this is often just set to 0xFFFFFFFF !
var maxSize = header.uncompressedSize;
// setup/init decoder states
decoder.setProperties(header);
// invoke the main decoder function
if ( !decoder.decodeBody(inStream, outStream, maxSize) ){
  // only generic error given here
  throw Error("Error in lzma data stream");
}
```

The LZMA header has the following format:

```js
// +------------+----+----+----+----+--+--+--+--+--+--+--+--+
// | Properties |  Dictionary Size  |   Uncompressed Size   |
// +------------+----+----+----+----+--+--+--+--+--+--+--+--+
decoder.setProperties({
  // The number of high bits of the previous
  // byte to use as a context for literal encoding.
  lc: header.lc,
  // The number of low bits of the dictionary
  // position to include in literal_pos_state.
  lp: header.lp,
  // The number of low bits of the dictionary
  // position to include in pos_state.
  pb: header.pb,
  // Dictionary Size is stored as an unsigned 32-bit
  // little endian integer. Any 32-bit value is possible,
  // but for maximum portability, only sizes of 2^n and
  // 2^n + 2^(n-1) should be used.
  dictionarySize: header.dictionarySize,
  // Uncompressed Size is stored as unsigned 64-bit little
  // endian integer. A special value of 0xFFFF_FFFF_FFFF_FFFF
  // indicates that Uncompressed Size is unknown.
  uncompressedSize: header.uncompressedSize
})
```

## Streams ##

Input data streams must be JavaScript objects or class instances exposing a `readByte` function:

```js
var inStream = {
  data: [ /* Put your compressed data here */ ],
  offset: 0,
  readByte: function(){
    return this.data[this.offset ++];
  }
};
```

Output data streams must be JavaScript objects or class instances exposing a `writeByte` or `writeBytes` function:

```js
var outStream = {
  data: [ /* Uncompressed data will be putted here */ ],
  offset: 0,
  // you only need either one
  writeByte: function(value){
    this.data[this.offset ++] = value;
  },
  // this is faster and preferred
  writeBytes: function(bytes){
    this.data = this.data.concat(bytes);
    this.offset += bytes.length;
  }
};
```

You may also mix both in a more generic class. You could use an `Array`, `String`, some sort of `Typed Array`, etc.

## `LZMA.oStream` and `LZMA.iStream` ##

For convenience this repository contains a pretty complete [stream class implementation](docs/lzma.shim.md).

## Different interfaces and implementations ##

- [WebWorker implementation](docs/wlzma.md)
- [Promisifed implementation](docs/lzmap.md)
- [Custom parallel decompression](docs/pwlzma.md)

## Header Properties ##

LZMA properties are described in the [LZMA SDK][1] or in the [Format Descriptions][2] of the xz project.

Just five bytes. The first one containing `lc`, `lp` and `pb` parameters, and the last four the dictionary size (little endian encoding).
Afterwards comes the maximum expected uncompressed file size (which is oftern just 0xFFFFFFFF).

[1]: http://www.7-zip.org/sdk.html
[2]: https://github.com/joachimmetz/xz/blob/master/doc/lzma-file-format.txt

## Complete Browser Example ##

```html
<html>
  <head>
    <script src="src/lzma.js"></script>
    <script src="src/lzma.shim.js"></script>
  </head>
  <body>
    <script>
      var url = "/some/file/to/load";
      var oReq = new XMLHttpRequest();
      oReq.open("GET", url, true);
      oReq.responseType = "arraybuffer";
      oReq.onload = function(oEvent){
        var buffer = oReq.response;
        var inStream = new LZMA.iStream(buffer);
        var outStream = LZMA.decompressFile(inStream);
      };
      oReq.send();
    </script>
  </body>
</html>
```

## Benchmarks ##

- System: Core i7-3770 @ 3.90Ghz (16GB RAM)
- Browser: Chrome 55.0.2883.87 (Official Build)

```
TESTING: names (1'292KB json)
node-lz4 x 99.44 ops/sec ±1.92% (60 runs sampled) (12.71 MB/s - 47.22%)
js-lzma x 11.02 ops/sec ±0.86% (55 runs sampled) (11.94 MB/s - 17.15%)
pako-gz x 52.30 ops/sec ±10.82% (55 runs sampled) (11.67 MB/s - 33.19%)
js-pwlzma x 31.43 ops/sec ±3.23% (52 runs sampled) (11.16 MB/s - 17.07%)
node-lzma x 1.70 ops/sec ±1.89% (13 runs sampled) (2.08 MB/s - 26.50%)
TESTING: col (1'869KB pretty noisy raw Float32Array raw data)
node-lz4 x 81.41 ops/sec ±1.79% (57 runs sampled) (17.78 MB/s - 100%)
pako-gz x 26.24 ops/sec ±8.37% (47 runs sampled) (14.24 MB/s - 75.92%)
js-pwlzma x 12.87 ops/sec ±2.75% (35 runs sampled) (11.04 MB/s - 55.41%)
js-lzma x 4.56 ops/sec ±0.55% (26 runs sampled) (7.77 MB/s - 51.16%)
node-lzma x 0.63 ops/sec ±2.51% (8 runs sampled) (1.13 MB/s - 53.20%)
TESTING: pos (1'869KB less noisy raw Float32Array raw data)
node-lz4 x 77.80 ops/sec ±1.78% (54 runs sampled) (16.87 MB/s - 84.65%)
pako-gz x 30.79 ops/sec ±0.81% (51 runs sampled) (15.74 MB/s - 70.50%)
js-pwlzma x 12.76 ops/sec ±3.31% (35 runs sampled) (11.17 MB/s - 53.97%)
js-lzma x 4.28 ops/sec ±0.56% (25 runs sampled) (7.34 MB/s - 52.39%)
node-lzma x 0.60 ops/sec ±2.71% (7 runs sampled) (1.09 MB/s - 58.84%)
```

*Note*: lz4 did not seem to return usefull results for this size. I also
did not even try to benchmark node-lzma, as it would be way too slow.
I'm a bit astonished by the speed of pako. But given the nature of zlib
and the data (not much dictionary use) and the matureness of the pako
zlib library, I'm willing to accept these results. But I did not check
the data integrity for every test case!

## Limitations ##

Output size is limited to 32 bits.

## What about compression? ##

Sorry, that is not planned. This library is part of another project of
mine that only needed the decompression algorithm.
