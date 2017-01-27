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
node-lz4 x 95.38 ops/sec ±2.22% (56 runs sampled) (11.76 MB/s - 47.22%)
pako-gz x 50.32 ops/sec ±11.95% (51 runs sampled) (10.72 MB/s - 33.19%)
js-lzma x 6.79 ops/sec ±4.23% (36 runs sampled) (7.53 MB/s - 26.50%)
node-lzma x 1.70 ops/sec ±1.89% (13 runs sampled) (2.08 MB/s - 26.50%)
TESTING: col (1'869KB pretty noisy raw Float32Array raw data)
node-lz4 x 79.13 ops/sec ±2.32% (54 runs sampled) (16.75 MB/s - 100%)
pako-gz x 26.41 ops/sec ±2.52% (44 runs sampled) (13.67 MB/s - 75.92%)
js-lzma x 3.40 ops/sec ±2.49% (21 runs sampled) (5.81 MB/s - 53.20%)
node-lzma x 0.63 ops/sec ±2.51% (8 runs sampled) (1.13 MB/s - 53.20%)
TESTING: pos 1'869KB less noisy raw Float32Array raw data)
node-lz4 x 74.85 ops/sec ±2.54% (51 runs sampled) (15.88 MB/s - 84.65%)
pako-gz x 29.32 ops/sec ±2.96% (49 runs sampled) (14.73 MB/s - 70.50%)
js-lzma x 3.05 ops/sec ±2.53% (19 runs sampled) (5.24 MB/s - 58.84%)
node-lzma x 0.60 ops/sec ±2.71% (7 runs sampled) (1.09 MB/s - 58.84%)
```

### Limitations ###

Output size is limited to 32 bits.

### What about compression function? ###

Sorry, don't. This library is part of another project of mine that only needed the decompression algorithm.