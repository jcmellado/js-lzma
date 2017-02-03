# lzmap.js #

Simple `Promise.js` wrapper for [`lzma.js`](../README.md).
This is a bit pointless, since `js-lzma` is synchronous only.
But it may make sense to use it if you want to switch
to/from the webworker based implementation later.

## Usage ##

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

It basically wraps [`LZMA.decodeFile`](../README.md) into a promise!

## Credits ##

- Main Author: [Marcel Greter](https://github.com/mgreter)
