**js-lzma** is a port of the LZMA decompression algorithm to JavaScript.

The source code is a manual translation from the original Java version found in the [LZMA SDK](http://www.7-zip.org/sdk.html).

### Usage ###

If you have the content of a .lzma file then just call to the `decompressFile` function:

```
LZMA.decompressFile(inStream, outStream);
```

Where:
 * `inStream` is the input data stream to decompress
 * `outStream` is the output data stream


If you want more control about the process then you can use the `decompress` function:

```
LZMA.decompress(properties, inStream, outStream, outSize);
```

Where:

 * `properties` is the input data stream with LZMA properties
 * `inStream` is the input data stream to decompress
 * `outStream` is the output data stream
 * `outSize` is the expected size of output data stream

### Streams ###

Input data streams must be JavaScript objects exposing a public `readByte` function:

```js
var inStream = {
  data: [ /* Put your compressed data here */ ],
  offset: 0,
  readByte: function(){
    return this.data[this.offset ++];
  }
};
```

Output data streams must be JavaScript objects exposing a public `writeByte` function:

```js
var outStream = {
  data: [ /* Uncompressed data will be putted here */ ],
  offset: 0,
  writeByte: function(value){
    this.data[this.offset ++] = value;
  }
};
```

Ok, you can mix both on a more generic one. And change `Array` to `String`, some sort of `Typed Array`, or whatever you want.

### Properties ###

LZMA properties are described in the [LZMA SDK](http://www.7-zip.org/sdk.html).

Just five bytes. The first one containing `lc`, `lp` and `pb` parameters, and the last four the dictionary size (little endian encoding).

### Browser Example ###

```html
<html>
  <head>
    <script src="src/lzma.js"></script>
    <script src="src/lzma.shim.js"></script>
  </head>
  <body>
    <script>
      var oReq = new XMLHttpRequest();
      oReq.open("GET", /* Put the url to your compressed file here */, true);
      oReq.responseType = "arraybuffer";
      oReq.onload = function(oEvent){
        var buffer = oReq.response;
        var input = new LZMA.iStream(buffer);
        var output = new LZMA.oStream();
        LZMA.decompressFile(input, output);
      };
      oReq.send();
    </script>
  </body>
</html>
```

### Benchmarks ###

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
TESTING: big-bin (17.5MB with good to compress binary data)*
pako-gz x 6.02 ops/sec ±2.49% (33 runs sampled) (94.49 MB/s - 40.71%)
js-pwlzma x 1.11 ops/sec ±1.71% (10 runs sampled) (18.99 MB/s - 40.41%)
js-lzma x 0.61 ops/sec ±22.32% (7 runs sampled) (10.57 MB/s - 40.39%)
TESTING: extreme-bin (75MB with hard to compress binary data)*
pako-gz x 1.32 ops/sec ±0.45% (11 runs sampled) (94.52 MB/s - 90.43%)
node-lz4 x 1.67 ops/sec ±0.16% (13 runs sampled) (4.11 MB/s - 2760%)
js-lzma x 0.08 ops/sec ±2.34% (5 runs sampled) (5.81 MB/s - 85.82%)
js-pwlzma x 0.24 ops/sec ±2.63% (6 runs sampled) (17.79 MB/s - 87.04%)
```

*Note*: lz4 did not seem to return usefull results for this size. I also
did not even try to benchmark node-lzma, as it would be way too slow.
I'm a bit astonished by the speed of pako. But given the nature of zlib
and the data (not much dictionary use) and the matureness of the pako
zlib library, I'm willing to accept these results. But I must admit,
that I did not check the data integrity for every test case!

### Limitations ###

Output size is limited to 32 bits.

### What about compression function? ###

Sorry, don't. This library is part of another project of mine that only needed the decompression algorithm.