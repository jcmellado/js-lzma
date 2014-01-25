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

```
var inStream = {
  data: [ /* Put your compressed data here */ ],
  offset: 0,
  readByte: function(){
    return this.data[this.offset ++];
  }
};
```

Output data streams must be JavaScript objects exposing a public `writeByte` function:

```
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

### Limitations ###

Output size is limited to 32 bits.

### What about compression function? ###

Sorry, don't. This library is part of another project of mine that only needed the decompression algorithm.