/*
Copyright (c) 2011 Juan Mellado

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

LZMA.iStream = function(buffer)
{
	this.buffer = buffer;
	this.array = new Uint8Array(buffer);
	this.readed = 0;
}

LZMA.iStream.prototype.readByte = function()
{
	return this.array[this.readed++];
}

LZMA.oStream = function()
{
	this.output = [];
	this.written = 0;
}

LZMA.oStream.prototype.writeByte = function writeByte(byte)
{
	this.output[this.written++] = String.fromCharCode(byte);
}

LZMA.oStream.prototype.toString = function (byte)
{
	return this.output.join("");
}
