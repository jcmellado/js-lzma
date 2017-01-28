# lzmap.js

Simple `Promise.js` wrapper for [`lzma.js`](lzma.md).

This is a bit pointless, since the `js-lzma` is already
synchronous only. But it may make sense in case you want
to change between worker and regular implementation.

## Usage

Here's a complete example with an ajax loaded url:

```js
// create ajax request to load asset
var oReq = new XMLHttpRequest();
oReq.open("GET", url, true);
oReq.responseType = "arraybuffer";
oReq.onload = function(oEvent)
{
  // invoke synchronous decoding
  LZMAP.decode(oReq.response)
  // wait for results to come back
  .then(function (outStream) {
    // create a continous array buffer
    var bytes = outStream.toUint8Array();
  })
  // good chance it failed
  .catch(function(err) {
    // make user aware of problem
    throw new Error(err.message);
  })
};
oReq.send();
```

It basically wraps `LZMA.decodeFile` into a promise!
