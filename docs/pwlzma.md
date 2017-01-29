# pwlzma.js #

Parallel custom decompressor for [`wlzma.js`](wlzma.md).

## Introduction ##

Uses a custom file format for parallel chunks!

This is a working proof of concept for parallel decoding of lzma.
It prerequisites the wlzma-js package to manage the worker threads.
I mainly created this custom file format, since I wasn't able to
find how native lzma splits its content for parallel processing.
AFAICS the lzma cli tool will create on dictionary for the full
file if only one CPU is used during compression. Due to the nature
how parallel compression is done, there has to be some sort of
block size when parallel compression is used. But I'm not even
sure that a file compressed in single CPU mode can be decoded
in parallel? Any hints would be welcome!

So to solve this problem for my use case, I've come up with a
custom file format, which I simply named `.plzma`. Standing
for parallel lzma. The format is dead simple and can be explained
in a few paragraphs.

- bytes [0-6]: static header `PLZMA1` for mime type check
- bytes [6-10]: number of blocks in big-endian order
- bytes [10-10+4*blocks]: block sizes in big-endian order

After `10+4*blocks` are the data blocks. All blocks can
be decoded like regular lzma files. The results are simply
concatenated to form the final result.

## Creating custom archives ##

I included a [simple perl script][1] to create such archives. The
options are very limited and it might not be the platform most
people feel comfortable with (you should be fine on linux though!).
If you have the need for this feature I hope you can port this over
to your favourite programming language. In the long run it would be
best to figure out how to do this with native lzma streams!

```bash
$ perl plzma.pl test.dat 1>/dev/null
```

[1]: ../scripts/plzma.pl

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
  // invoke async parallel decoding
  PWLZMA.decode(wlzma, oReq.response)
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

It has the same interface as [`WLZMA.decodeFile`](wlzma.md)!

## Credits ##

- Main Author: [Marcel Greter](https://github.com/mgreter)
