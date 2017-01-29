# wlzma.js #

WebWorker version of [`lzmap.js`](lzmap.md).

## Introduction ##

This version of `js-lzma` decompresses the lzma data stream in a
background thread. The interface is the same promisified one
as with [`js-lzmap`](lzmap.md). Since we use background workers,
this interface must be asynchronous and no synced methods exist.

## Usage ##

Here's a complete example with an ajax loaded url:

```js
// create worker manager (pass relative path)
// loading workers has some drawbacks with urls
var wlzma = new WLZMA.Manager(4, "wlzma.wrk.js");
// create ajax request to load asset
var oReq = new XMLHttpRequest();
oReq.open("GET", url, true);
oReq.responseType = "arraybuffer";
oReq.onload = function(oEvent)
{
  // invoke asynchronous decoding
  wlzma.decode(oReq.response)
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

It has the same interface as [`LZMAP.decodeFile`](lzmap.md)!

## Constructing the Manager ##

### `WLZMA.Manager(workers, worker_url)` ###

Whenever dealing with WebWorkers (threads), you need to have a central
manager that schedules the jobs to the available workers. We do not want
to spawn workers uncontrolled on high demand. There needs to be some kind
of cap. You need to provide a count of workers yourself, or we use the
default of 8 WebWorkers for decompression. There are some ways to get
an estimate of available CPUs. Some instructions to do so might will
be added later to this documentation!

You probably need to define the path to resolve the worker source. This
is unfortunately some headache with webworkers, as we need to give a url
that us relative to the main html file. Since only you can know the exact
location you are encouraged to pass an explicit url on construction.

On easy way to set the worker url globally, is to set `WLZMA.wrkurl`:

```html
<script>WLZMA.wrkurl = '/js-lzma/wlzma.wrk.min.js';</script>
``` 

### Exposed methods

#### `wlzma.decode(iStream|Uint8Array|ArrayBuffer)` ####

Decode an in memory lzma document. Returns a promise that will resolve
with a [`LZMA.iStream`](lzma.shim.md) object, which may consist of
multiple array buffers (call `toUint8Array` for a continous array).

## Credits ##

- Main Author: [Marcel Greter](https://github.com/mgreter)
