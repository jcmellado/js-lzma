# lzma.shim.js #

This file provides a few classes to make `js-lzma` compatible to run in a
modern Browser. The decoder needs some simple stream objects to read and
write data. We don't have the need for a full fledged streaming interface,
but it makes our life much easier even at this level!

## Exported classes ##

- `LZMA.iStream(Uint8Array)`
- `LZMA.oStream([buffer, ...])`

## Implementation ##

This stream implementation is specifically made for js-lzma. It has no
intention to be compatible with node.js or with any other "sanctioned"
stream implementation. If the need arises it probably should be easy
to add more compatibility with other implementations. For now this
acts as a standalone shim to get js-lzma working nicely in Browsers.

### Input Streams (`LZMA.iStream`) ###

Browsers don't have any real streaming interfaces for most parts AFAIK.
There might be some ways to get a streaming interface working with some
progress events on XHRrequests. But I doubt this would be very portable.
Therefore this interface only supports a crude in memory representation.

### `LZMA.iStream(Uint8Array)` ###

The constructor only accepts a `Uint8Array` or an `ArrayBuffer`. You can
i.e. pass the result buffer from a `XHRrequest` directly:

```js
var oReq = new XMLHttpRequest();
oReq.open("GET", url, true);
oReq.responseType = "arraybuffer";
oReq.onload = function(oEvent)
{
  var buffer = oReq.response;
  var input = new LZMA.iStream(buffer);
  LZMAP.decompress(input)
  .then(function (outStream) {
    outStream.toUint8Array();
  })
};
oReq.send();
```

### Output Streams (`LZMA.oStream`) ###

This is also backed by an in memory implementation. It is similar to a string
stream in other types languages.

### `LZMA.oStream([buffer, ...])` ###

Construc a new output stream. Optionally pass an array of existing `Uint8Array`
arrays. Normally you want to omit any options when constructing a new instance.

#### Exposed properties ####

- `oStream.size` - current aggregated byte size
- `oStream.buffers` - array of Uint8Array chunks

#### Exposed methods ####

#### `oStream.writeBytes(Uint8Array, size)` ####

Used internally to fill the output buffers. With `js-lzma` we pass quite big
chunks back from the decoder, which we store in the `buffers` property.

#### `oStream.toUint8Array()` ####

Create a continous `Uint8Array` buffer. Usefull if you need the full decoded
file in memory. Re-use the underlying buffer for other array views.

#### `oStream.toCodePoints()` ####

Returns a continous typed array of codepoints; depending if the UTF8 decoder
is loaded, we treat the byte sequence either as an UTF8 sequence or as a fixed
one byte encoding (i.e. US-ASCII). The result can be converted to a JS string.

#### `oStream.toString()` ####

Convert the buffer to a javascript string object. When the UTF8 decoder is
loaded, the underlying bytes are correctly converted from the UTF8 sequence.
Otherwise it will fall back to a fixed one byte encoding (i.e. US-ASCII).

#### `oStream.forEach(fn)` ####

The given function is invoked for every `Uint8Array`.

```js
var md5 = new MD5();
function digest(bytes) {
  for (var i = 0; i < bytes.length; i++) {
    md5.addByte(bytes[i]);
  }
}
oStream.forEach(digest);
console.info(md5.getHex());
```

### Stream format and String representation ###

Underlying these streams is always a `Uint8Array`, therefore these are binary
containers. Converting the data to a string is probably more expensive than
you might think. Strings in JavaScript are Unicode Codepoints and therefore
one character can contain more than 8 bits. To convert a byte array to a string
will need to apply some encoding to it. If the string only contains US-ASCII
(lower than 127), it could be simply converted with `String.fromCharCode`.
To support Unicode we need to decode the binary sequence into Codepoints.
The most common encoding format being `UTF-8` today. Support has not been
added yet, but will probably be one of the next features on the ToDo list.

### Dynamically growing the storage buffer? ###

I considered a few implementations for handling resources wisely. as we
may use considerable amount of memory. It also seems that requesting big
continous junks of memory can cause out of memory errors quite easily.
Probably more common when the heap of the Browser gets more fragmented.

Growing the buffer dynamically would mean that we need double the amount
of memory to allocate the new container and then copy the old values over.
With this in mind, I've chosen to keep only chunks of memory arrays. This
should allow us to better store bigger amounts of memory. You might need
a continous representation anyway. In that case we try to construct that
array on demand and copy all existing data to it. If successfull, we will
replace the internal memory chunks with the new full array too. This has
the same constraints as growing the buffer dynamically, but only on demand.
It also plays nicely that way for streaming interfaces. There is some
experimental API with `ArrayBuffer.transfer` that could change this.

## Credits ##

- Main Author: [Marcel Greter](https://github.com/mgreter)
