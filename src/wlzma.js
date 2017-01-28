/*

Webworker Frontend for `js-lzma`.
This is the Main Foreground Task.

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

var LZMA = LZMA || {};
var WLZMA = WLZMA || {};

(function(LZMA, WLZMA) {

  "use strict";

  // You may overwrite this globally from outside
  WLZMA.wrkurl = WLZMA.wrkurl || "wlzma.wrk.js";

  // create manager to schedule work
  // allocate a fixed amount of threads
  // we then distribute work as needed
  WLZMA.Manager = function Manager(workers, url) {
    // set default workers
    workers = workers || 6;
    // work that has been queued
    this.queue = [];
    // our worker farm
    this.workers = [];
    url = url || WLZMA.wrkurl;
    // ready listeners
    this.listeners = [];
    this.isReady = false;
    this.started = 0;
    // create the worker threads
    for (var i = 0; i < workers; i ++) {
      var worker = new Worker(url);
      worker.onmessage = onReady;
      this.workers.push(worker);
      worker.manager = this;
      worker.idle = true;
    }
    // mark all idle
    this.idle = workers;
    // next worker
    this.next = 0;
  }

  // called in worker context
  function onResult(msg) {
    // local variable access
    var wid = msg.data[0],
        // Uint8Array result
        buffers = msg.data[1],
        // optional error msg
        error = msg.data[2],
        // parent manager
        mgr = this.manager;
    // mark us idle again
    this.idle = true, mgr.idle ++;
    // use us if we are lower in slots
    if (mgr.next == -1 || mgr.next > wid) {
      mgr.next = wid;
    }
    // invoke the promise handlers
    if (error) { this.reject(error); }
    else if (!buffers) { this.reject(null); }
    else { this.resolve(new LZMA.oStream(buffers)); }
    // reset promise interface
    this.resolve = null;
    this.reject = null;
    // continue working
    tick.call(mgr);
  }

  // called in manager context
  function onManagerReady()
  {
    var listeners = this.listeners,
        length = listeners.length;
    // invoke all registered handlers
    // this will work correctly even if you
    // add more handler during execution!
    while (listeners.length) {
      // remove from the array
      listeners.shift().call(this);
    }
    // we are ready now
    this.isReady = true;
  }

  // called in worker context
  function onReady(msg)
  {
    var manager = this.manager;
    // check for startup message
    if (msg.data === "ready") {
      // switch to real handler
      this.onmessage = onResult;
      // we are ready now
      this.isReady = true;
      // incerement counter
      manager.started ++;
      // check if we are fully ready now
      if (manager.started == manager.workers.length) {
        // invoke private handler
        onManagerReady.call(manager);
      }
    }
    else {
      // this indicates implementation issues
      throw Error("Worker did not startup!?")
    }
  }

  // dequeue work
  function tick() {
    // schedule more jobs if possible
    while(this.queue.length && this.idle) {
      // get worker id
      var wid = this.next;
      // get the jon from the queue
      var job = this.queue.shift();
      // jobs may be lazy loaded
      if (typeof job[0] == "function") {
        // invoke the job function
        job[0] = job[0].call(this);
      }
      // get the next free worker
      var worker = this.workers[wid];
      if (!worker) debugger;
      // invoke the worker
      worker.postMessage([wid, job[0]], [job[0]]);
      // attack promise to worker instance
      worker.resolve = job[1];
      worker.reject = job[2];
      // one less worker idle
      worker.idle = false;
      this.idle -= 1;
      // find the next idle worker
      // this.next = -1; // mark is unknown
      // workers coming back mark them self as idle
      // therefore we can just keep looking updwards
      for (var i = wid; i < this.workers.length; i++) {
        if (this.workers[i].idle) {
          this.next = i;
          return;
        }
      }
      // mark is busy
      this.next = -1;
    }
  }

  // resolve compatible types
  function getArrayBuffer(object)
  {
    if (typeof object == "object") {
      if (object instanceof LZMA.iStream) {
          object = object.array;
      }
      if (object instanceof Uint8Array) {
          object = object.buffer;
      }
    }
    return object;
  }

  // register on ready handlers which are called when
  // all workers have started up. This is not strictly
  // needed, but might prove handy at some point ...
  WLZMA.Manager.prototype.ready = function ready(handler)
  {
    if (this.isReady) { handler.call(this); }
    else { this.listeners.push(handler); }
  }

  // promisified webworker `LZMA.decompressFile` function
  WLZMA.Manager.prototype.decode = function decode(buffer)
  {
    // local closure
    var mgr = this;
    // unwrap expected array type
    buffer = getArrayBuffer(buffer);
    // might be given or we create a new one
    // outStream = outStream || new LZMA.oStream();
    // return promise now, will resolve in time
    return new Promise(function (resolve, reject) {
      // put the job on to the work queue
      mgr.queue.push([buffer, resolve, reject]);
      // invoke tick function
      tick.call(mgr)
    })
  }

})(LZMA, WLZMA);
