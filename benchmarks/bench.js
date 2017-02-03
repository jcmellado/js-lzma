// urls to load for tests
var urls = [
	[
		['pako-gz', '../data/stars.names.json.gz'],
		['node-lz4', '../data/stars.names.json.lz4'],
		['js-lzma', '../data/stars.names.json.lzma'],
		['js-lzmasm', '../data/stars.names.json.lzma'],
		['js-pwlzma', '../data/stars.names.json.plzma'],
		['node-lzma', '../data/stars.names.json.lzma']
	], [
		['pako-gz', '../data/stars.col.db.gz'],
		['node-lz4', '../data/stars.col.db.lz4'],
		['js-lzma', '../data/stars.col.db.lzma'],
		['js-lzmasm', '../data/stars.col.db.lzma'],
		['js-pwlzma', '../data/stars.col.db.plzma'],
		['node-lzma', '../data/stars.col.db.lzma']
	], [
		['pako-gz', '../data/stars.pos.db.gz'],
		['node-lz4', '../data/stars.pos.db.lz4'],
		['js-lzma', '../data/stars.pos.db.lzma'],
		['js-lzmasm', '../data/stars.pos.db.lzma'],
		['js-pwlzma', '../data/stars.pos.db.plzma'],
		['node-lzma', '../data/stars.pos.db.lzma']
	]
];

// name mappings
var names = [
	'names',
	'col',
	'pos'
];

// route logs to browser window
console.log = function(msg) {
	document.body.innerHTML += msg + "<br>";
}

// debugger function
function hexArr(arr)
{
	var bytes = [], msg = '';
	for (var i = 0; i < arr.length; i++) {
		var hex = arr[i].toString(16);
		if (arr[i] < 16) hex = "0" + hex;
		bytes.push(hex);
		if (i % 4 == 3) {
			// bytes.reverse();
			msg += bytes.join(" ");
			bytes.length = 0;
		}
		if (i % 8 == 7) msg += "\n";
		else if (i % 8 == 3) msg += " ";
	}
	return msg += bytes.join(" ");
}

// debugger function
function hexStr(str)
{
	var arr = new Uint8Array(str.length);
	for (var i = 0; i < str.length; i++) {
		arr[i] = test.charCodeAt(i);
	}
	return hexStr(arr);
}

function decodePakoGZ(buffer)
{
	return new Promise(function (resolve, reject) {
		// console.log('compressed size: ', buffer.byteLength);
		var result = pako.inflate(buffer);
		// console.log('uncompressed size ', result.byteLength);
		resolve(result);
	})
}

var wlzma = new WLZMA.Manager(0, "../src/wlzma.wrk.js");

function decodeJsPWLZMA(buffer)
{
	var input = new JSLZMA.iStream(buffer);
	return new Promise(function (resolve, reject) {
		PWLZMA.decode(wlzma, input)
		.then(function(output) {
			resolve(output.toUint8Array());
		})
		.catch(reject)
	});
}

function decodeJsLZMA(buffer)
{
	return new Promise(function (resolve, reject) {
		var input = new JSLZMA.iStream(buffer);
		var output = new JSLZMA.oStream();
		JSLZMA.decompressFile(input, output);
		resolve(output.toUint8Array());
	});
}

function decodeNodeLZMA(buffer)
{
	return new Promise(function (resolve, reject)
	{
		var compressed = new Uint8Array(buffer);
		// console.log('compressed size: ', buffer.byteLength);
		lzma.decompress(compressed, function (result) {
			// console.log('uncompressed size ', result.length);
			if (typeof result == "string") {
				resolve(new Uint8Array(result.split('')));
			} else {
				resolve(result);
			}
		});

	})
}

var LZ4 = require('lz4');
// somewhat strange import?
var Buffer = require('buffer').Buffer;

function decodeNodeLZ4(buffer)
{
	return new Promise(function (resolve, reject) {
		// console.log('compressed size: ', buffer.byteLength);
		var compressed = new Uint8Array(buffer);
		var uncompressed = new Uint8Array( 1322930 * 2 );
		var size = LZ4.decodeBlock(compressed, uncompressed);
		// console.log('uncompressed size ', result.length);
		resolve(uncompressed.slice(0, size));
	})
}

// the decoder to test
var decoder = {
	'pako-gz': decodePakoGZ,
	'node-lz4': decodeNodeLZ4,
	'js-lzma': decodeJsLZMA,
	'js-pwlzma': decodeJsPWLZMA,
	// 'node-lzma': decodeNodeLZMA,
};

// statistics
var size_in = {},
    size_out = {};

// fetched async
var buffers = {};

// conversion factor
var B2MB = 1024 * 1024;	

// helper function
function formatNr(nr)
{
	return nr.toFixed(nr < 100 ? 2 : 0);
}

// called when buffer is filled
function loadedBuffers()
{
	size_in = {}, size_out = {};
	return new Promise(function (resolve, reject) {

		// create a new benchmark suite
		var suite = new Benchmark.Suite;

		// patched benchmark reporting
		function report(type) {
			var tp = size_out[type] / B2MB;
			tp *= this.stats.sample.length;
			tp /= this.times.elapsed;
			var ratio = 100 * size_in[type] / size_out[type];
			console.warn(size_out[type], size_in[type], ratio)
			tp = formatNr(tp), ratio = formatNr(ratio);
			return " (" + tp + " MB/s - " + ratio + "%)";
		}

		// setup test for each decoder
		for (var type in decoder) {
			(function(type) {
				suite.add(type, function(deferred) {
					size_in[type] = buffers[type].byteLength;
					decoder[type](buffers[type])
					.then(function (result) {
						deferred.resolve();
						if (size_out[type]) {
							if (size_out[type] != result.length) {
								throw Error("Uncompressed sizes vary!?");
							}
						}
						size_out[type] = result.length;
					})
				}, { defer: true, report: function () {
					return report.call(this, type);
				} })
			})(type);
		}

		// setup suite
		suite
		.on('cycle', function(event) {
			console.log(String(event.target));
		})
		.on('complete', function() {
			// console.log('Fastest is ' + this.filter('fastest').map('name'));
			resolve();
		})
		// run async
		.run({ 'async': true });
	})
}

// load url for test suite
function loadUrl(type, url)
{
	return new Promise(function (resolve, reject) {
		var oReq = new XMLHttpRequest();
		oReq.open("GET", url, true);
		oReq.responseType = "arraybuffer";
		oReq.onload = function(oEvent)
		{
			// if response contains valid content-encoding
			// header, the UA will already unwrap content!
			buffers[type] = oReq.response;
			// if you want to access the bytes:
			// var byteArray = new Uint8Array(arrayBuffer);
			// If you want to use the image in your DOM:
			// var blob = new Blob(arrayBuffer, {type: "image/png"});
			// var url = URL.createObjectURL(blob);
			// someImageElement.src = url;
			resolve();
		};
		oReq.send();
	})
}

// auto advancing test function
function testAssets(set)
{
	set = set || 0;
	var promises = [];
	console.log('TESTING: ' + names[set]);
	for(var i = 0; i < urls[set].length; i++) {
		var type = urls[set][i][0],
			url = urls[set][i][1];
		promises.push(loadUrl(type, url));
	}
	// wait until all urls are loaded
	Promise.all(promises)
	// invoke test runner
	.then(loadedBuffers)
	// schedule more sets
	.then(function()
	{
		if (++ set < urls.length) {
			testAssets(set); // next
		}
	})
}

