(function (self) {

	function md5cycle(x, k)
	{

		var a = x[0], b = x[1], c = x[2], d = x[3];

		a = ff(a, b, c, d, k[0], 7, -680876936);
		d = ff(d, a, b, c, k[1], 12, -389564586);
		c = ff(c, d, a, b, k[2], 17,  606105819);
		b = ff(b, c, d, a, k[3], 22, -1044525330);
		a = ff(a, b, c, d, k[4], 7, -176418897);
		d = ff(d, a, b, c, k[5], 12,  1200080426);
		c = ff(c, d, a, b, k[6], 17, -1473231341);
		b = ff(b, c, d, a, k[7], 22, -45705983);
		a = ff(a, b, c, d, k[8], 7,  1770035416);
		d = ff(d, a, b, c, k[9], 12, -1958414417);
		c = ff(c, d, a, b, k[10], 17, -42063);
		b = ff(b, c, d, a, k[11], 22, -1990404162);
		a = ff(a, b, c, d, k[12], 7,  1804603682);
		d = ff(d, a, b, c, k[13], 12, -40341101);
		c = ff(c, d, a, b, k[14], 17, -1502002290);
		b = ff(b, c, d, a, k[15], 22,  1236535329);

		a = gg(a, b, c, d, k[1], 5, -165796510);
		d = gg(d, a, b, c, k[6], 9, -1069501632);
		c = gg(c, d, a, b, k[11], 14,  643717713);
		b = gg(b, c, d, a, k[0], 20, -373897302);
		a = gg(a, b, c, d, k[5], 5, -701558691);
		d = gg(d, a, b, c, k[10], 9,  38016083);
		c = gg(c, d, a, b, k[15], 14, -660478335);
		b = gg(b, c, d, a, k[4], 20, -405537848);
		a = gg(a, b, c, d, k[9], 5,  568446438);
		d = gg(d, a, b, c, k[14], 9, -1019803690);
		c = gg(c, d, a, b, k[3], 14, -187363961);
		b = gg(b, c, d, a, k[8], 20,  1163531501);
		a = gg(a, b, c, d, k[13], 5, -1444681467);
		d = gg(d, a, b, c, k[2], 9, -51403784);
		c = gg(c, d, a, b, k[7], 14,  1735328473);
		b = gg(b, c, d, a, k[12], 20, -1926607734);

		a = hh(a, b, c, d, k[5], 4, -378558);
		d = hh(d, a, b, c, k[8], 11, -2022574463);
		c = hh(c, d, a, b, k[11], 16,  1839030562);
		b = hh(b, c, d, a, k[14], 23, -35309556);
		a = hh(a, b, c, d, k[1], 4, -1530992060);
		d = hh(d, a, b, c, k[4], 11,  1272893353);
		c = hh(c, d, a, b, k[7], 16, -155497632);
		b = hh(b, c, d, a, k[10], 23, -1094730640);
		a = hh(a, b, c, d, k[13], 4,  681279174);
		d = hh(d, a, b, c, k[0], 11, -358537222);
		c = hh(c, d, a, b, k[3], 16, -722521979);
		b = hh(b, c, d, a, k[6], 23,  76029189);
		a = hh(a, b, c, d, k[9], 4, -640364487);
		d = hh(d, a, b, c, k[12], 11, -421815835);
		c = hh(c, d, a, b, k[15], 16,  530742520);
		b = hh(b, c, d, a, k[2], 23, -995338651);

		a = ii(a, b, c, d, k[0], 6, -198630844);
		d = ii(d, a, b, c, k[7], 10,  1126891415);
		c = ii(c, d, a, b, k[14], 15, -1416354905);
		b = ii(b, c, d, a, k[5], 21, -57434055);
		a = ii(a, b, c, d, k[12], 6,  1700485571);
		d = ii(d, a, b, c, k[3], 10, -1894986606);
		c = ii(c, d, a, b, k[10], 15, -1051523);
		b = ii(b, c, d, a, k[1], 21, -2054922799);
		a = ii(a, b, c, d, k[8], 6,  1873313359);
		d = ii(d, a, b, c, k[15], 10, -30611744);
		c = ii(c, d, a, b, k[6], 15, -1560198380);
		b = ii(b, c, d, a, k[13], 21,  1309151649);
		a = ii(a, b, c, d, k[4], 6, -145523070);
		d = ii(d, a, b, c, k[11], 10, -1120210379);
		c = ii(c, d, a, b, k[2], 15,  718787259);
		b = ii(b, c, d, a, k[9], 21, -343485551);

		x[0] = add32(a, x[0]);
		x[1] = add32(b, x[1]);
		x[2] = add32(c, x[2]);
		x[3] = add32(d, x[3]);

	}

	function cmn(q, a, b, x, s, t)
	{
		a = add32(add32(a, q), add32(x, t));
		return add32((a << s) | (a >>> (32 - s)), b);
	}

	function ff(a, b, c, d, x, s, t)
	{
		return cmn((b & c) | ((~b) & d), a, b, x, s, t);
	}

	function gg(a, b, c, d, x, s, t)
	{
		return cmn((b & d) | (c & (~d)), a, b, x, s, t);
	}

	function hh(a, b, c, d, x, s, t)
	{
		return cmn(b ^ c ^ d, a, b, x, s, t);
	}

	function ii(a, b, c, d, x, s, t)
	{
		return cmn(c ^ (b | (~d)), a, b, x, s, t);
	}


	function MD5()
	{
		// initial state values
		this.state = [1732584193, -271733879, -1732584194, 271733878];
		// the buffer to hold the bytes
		this.buffer = new ArrayBuffer(64);
		// view to fill in bytes for digest
		this.bytes = new Uint8Array(this.buffer);
		// view to get value for md5 calculations
		this.md5blk = new Uint32Array(this.buffer);
		// buffer positions
		this.position = 0;
		// input data size
		this.size = 0;
	}

	MD5.prototype.addString = function addString(str)
	{
		for (var i = 0; i < str.length; i++) {
			this.addByte(str.charCodeAt(i));
		}
	}

	MD5.prototype.addBytes = function addBytes(bytes)
	{
		var size = bytes.length, off = 0;
		if (size == 0) return;

		// maybe everything fits into this block
		if (size + this.position < 64) {
			for (var i = 0; i < size; i++) {
				this.addByte(bytes[i]);
			}
		}
		// otherwise we fill up at least one block
		// hopefully more than just one (to be fast)
		else {
			// we need to full up current block fist
			while (this.position > 0) {
				// this will flush at some point
				// then the loop condition will exit
				this.addByte(bytes[off++]);
			}
			// the position is not at the start
			// we can now fast pass array views
			while (off + 64 < size) {
				// create a array view for this block
				var view = new Uint32Array(bytes.buffer, off, 16);
				// update state after full md5blk
				md5cycle(this.state, view);
				off += 64;
			}
			// finalize given data
			while (off < size) {
				// add any trailing bytes
				this.addByte(bytes[off++]);
			}
		}
	}

	MD5.prototype.addByte = function addByte(byte)
	{
		// local variable access
		var buffer = this.bytes;
		// append the next byte to the buffer
		buffer[this.position++] = byte;
		// flush when end of windows reached
		if (this.position == 64) {
			// update state after full md5blk
			md5cycle(this.state, this.md5blk);
			// reset buffer pointer
			this.position = 0;
		}
		// increment size
		this.size ++;
	}

	MD5.prototype.getDigest = function getDigest()
	{
		// initialize the tail state array
		var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];
		for (var i=0; i < this.position; i++)
			tail[i>>2] |= this.bytes[i] << ((i%4) << 3);
		tail[i>>2] |= 0x80 << ((i%4) << 3);
		if (i > 55) {
			md5cycle(this.state, tail);
			for (i=0; i<16; i++) tail[i] = 0;
		}
		tail[14] = this.size*8;
		md5cycle(this.state, tail);
		return this.state;
	}

	var hex_chr = '0123456789abcdef'.split('');

	function rhex(n)
	{
		var s = '', j = 0;
		for(; j < 4; j ++)
			s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]
			   + hex_chr[(n >> (j * 8)) & 0x0F];
		return s;
	}

	MD5.prototype.getHex = function getHex()
	{
		var x = this.getDigest();
		for (var i=0; i<x.length; i++)
			x[i] = rhex(x[i]);
		return x.join('');
	}

	function md5hex(s) {
		var md5 = new MD5();
		md5.addString(s);
		return md5.getHex();
	}

	/* this function is much faster,
	so if possible we use it. Some IEs
	are the only ones I know of that
	need the idiotic second function,
	generated by an if clause.  */

	function add32(a, b) {
		return (a + b) & 0xFFFFFFFF;
	}

	if (md5hex('hello') != '5d41402abc4b2a76b9719d911017c592') {
		function add32(x, y) {
			var lsw = (x & 0xFFFF) + (y & 0xFFFF),
			msw = (x >> 16) + (y >> 16) + (lsw >> 16);
			return (msw << 16) | (lsw & 0xFFFF);
		}
	}

	// exports
	self.MD5 = MD5;
	MD5.hex = md5hex;

})(self);
