/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview Hash algorizms.
 * depend on yjd.hash
 * @since  2017.12.16  rewrite.
 */

if(!yjd.hash) yjd.hash = {};

yjd.hash.Md5Gen = function() {
	this.au32_state = new Uint32Array(4);	//	レジスタ
	this.au32_buffer = null;				//	バッファ
	this.n_blocks = 0;						//	バッファ内のブロック数. 1block = 16dword = 64byte;
};

/**
 * 初期化.
 */
yjd.hash.Md5Gen.prototype.init = function() {
	this.au32_state[0] = 0x67452301;
	this.au32_state[1] = 0xefcdab89;
	this.au32_state[2] = 0x98badcfe;
	this.au32_state[3] = 0x10325476;
};
	
/**
 * 変換処理.
 */
yjd.hash.Md5Gen.prototype.transform = function() {
	var a, b, c, d;
	var x00, x01, x02, x03, x04, x05, x06, x07, x08, x09, x10, x11, x12, x13, x14, x15;
	var n_idx = 0;
	for( var i=0; i<this.n_blocks; i++) {
		a = this.au32_state[0];
		b = this.au32_state[1];
		c = this.au32_state[2];
		d = this.au32_state[3];
		
		x00 = this.au32_buffer[n_idx++];
		x01 = this.au32_buffer[n_idx++];
		x02 = this.au32_buffer[n_idx++];
		x03 = this.au32_buffer[n_idx++];
		x04 = this.au32_buffer[n_idx++];
		x05 = this.au32_buffer[n_idx++];
		x06 = this.au32_buffer[n_idx++];
		x07 = this.au32_buffer[n_idx++];
		x08 = this.au32_buffer[n_idx++];
		x09 = this.au32_buffer[n_idx++];
		x10 = this.au32_buffer[n_idx++];
		x11 = this.au32_buffer[n_idx++];
		x12 = this.au32_buffer[n_idx++];
		x13 = this.au32_buffer[n_idx++];
		x14 = this.au32_buffer[n_idx++];
		x15 = this.au32_buffer[n_idx++];
		
		// Round 1
		a += ((b & c) | (~b & d)) + x00 + 0xd76aa478;	a = ((a << 7) | (a >>> 25)) + b;
		d += ((a & b) | (~a & c)) + x01 + 0xe8c7b756;	d = ((d << 12) | (d >>> 20)) + a;
		c += ((d & a) | (~d & b)) + x02 + 0x242070db;	c = ((c << 17) | (c >>> 15)) + d;
		b += ((c & d) | (~c & a)) + x03 + 0xc1bdceee;	b = ((b << 22) | (b >>> 10)) + c;
		a += ((b & c) | (~b & d)) + x04 + 0xf57c0faf;	a = ((a << 7) | (a >>> 25)) + b;
		d += ((a & b) | (~a & c)) + x05 + 0x4787c62a;	d = ((d << 12) | (d >>> 20)) + a;
		c += ((d & a) | (~d & b)) + x06 + 0xa8304613;	c = ((c << 17) | (c >>> 15)) + d;
		b += ((c & d) | (~c & a)) + x07 + 0xfd469501;	b = ((b << 22) | (b >>> 10)) + c;
		a += ((b & c) | (~b & d)) + x08 + 0x698098d8;	a = ((a << 7) | (a >>> 25)) + b;
		d += ((a & b) | (~a & c)) + x09 + 0x8b44f7af;	d = ((d << 12) | (d >>> 20)) + a;
		c += ((d & a) | (~d & b)) + x10 + 0xffff5bb1;	c = ((c << 17) | (c >>> 15)) + d;
		b += ((c & d) | (~c & a)) + x11 + 0x895cd7be;	b = ((b << 22) | (b >>> 10)) + c;
		a += ((b & c) | (~b & d)) + x12 + 0x6b901122;	a = ((a << 7) | (a >>> 25)) + b;
		d += ((a & b) | (~a & c)) + x13 + 0xfd987193;	d = ((d << 12) | (d >>> 20)) + a;
		c += ((d & a) | (~d & b)) + x14 + 0xa679438e;	c = ((c << 17) | (c >>> 15)) + d;
		b += ((c & d) | (~c & a)) + x15 + 0x49b40821;	b = ((b << 22) | (b >>> 10)) + c;
		// Round 2
		a += ((b & d) | (c & ~d)) + x01 + 0xf61e2562;	a = ((a << 5) | (a >>> 27)) + b;
		d += ((a & c) | (b & ~c)) + x06 + 0xc040b340;	d = ((d << 9) | (d >>> 23)) + a;
		c += ((d & b) | (a & ~b)) + x11 + 0x265e5a51;	c = ((c << 14) | (c >>> 18)) + d;
		b += ((c & a) | (d & ~a)) + x00 + 0xe9b6c7aa;	b = ((b << 20) | (b >>> 12)) + c;
		a += ((b & d) | (c & ~d)) + x05 + 0xd62f105d;	a = ((a << 5) | (a >>> 27)) + b;
		d += ((a & c) | (b & ~c)) + x10 + 0x2441453;	d = ((d << 9) | (d >>> 23)) + a;
		c += ((d & b) | (a & ~b)) + x15 + 0xd8a1e681;	c = ((c << 14) | (c >>> 18)) + d;
		b += ((c & a) | (d & ~a)) + x04 + 0xe7d3fbc8;	b = ((b << 20) | (b >>> 12)) + c;
		a += ((b & d) | (c & ~d)) + x09 + 0x21e1cde6;	a = ((a << 5) | (a >>> 27)) + b;
		d += ((a & c) | (b & ~c)) + x14 + 0xc33707d6;	d = ((d << 9) | (d >>> 23)) + a;
		c += ((d & b) | (a & ~b)) + x03 + 0xf4d50d87;	c = ((c << 14) | (c >>> 18)) + d;
		b += ((c & a) | (d & ~a)) + x08 + 0x455a14ed;	b = ((b << 20) | (b >>> 12)) + c;
		a += ((b & d) | (c & ~d)) + x13 + 0xa9e3e905;	a = ((a << 5) | (a >>> 27)) + b;
		d += ((a & c) | (b & ~c)) + x02 + 0xfcefa3f8;	d = ((d << 9) | (d >>> 23)) + a;
		c += ((d & b) | (a & ~b)) + x07 + 0x676f02d9;	c = ((c << 14) | (c >>> 18)) + d;
		b += ((c & a) | (d & ~a)) + x12 + 0x8d2a4c8a;	b = ((b << 20) | (b >>> 12)) + c;
		// Round 3
		a += (b ^ c ^ d) + x05 + 0xfffa3942;	a = ((a << 4) | (a >>> 28)) + b;
		d += (a ^ b ^ c) + x08 + 0x8771f681;	d = ((d << 11) | (d >>> 21)) + a;
		c += (d ^ a ^ b) + x11 + 0x6d9d6122;	c = ((c << 16) | (c >>> 16)) + d;
		b += (c ^ d ^ a) + x14 + 0xfde5380c;	b = ((b << 23) | (b >>> 9)) + c;
		a += (b ^ c ^ d) + x01 + 0xa4beea44;	a = ((a << 4) | (a >>> 28)) + b;
		d += (a ^ b ^ c) + x04 + 0x4bdecfa9;	d = ((d << 11) | (d >>> 21)) + a;
		c += (d ^ a ^ b) + x07 + 0xf6bb4b60;	c = ((c << 16) | (c >>> 16)) + d;
		b += (c ^ d ^ a) + x10 + 0xbebfbc70;	b = ((b << 23) | (b >>> 9)) + c;
		a += (b ^ c ^ d) + x13 + 0x289b7ec6;	a = ((a << 4) | (a >>> 28)) + b;
		d += (a ^ b ^ c) + x00 + 0xeaa127fa;	d = ((d << 11) | (d >>> 21)) + a;
		c += (d ^ a ^ b) + x03 + 0xd4ef3085;	c = ((c << 16) | (c >>> 16)) + d;
		b += (c ^ d ^ a) + x06 + 0x4881d05;	b = ((b << 23) | (b >>> 9)) + c;
		a += (b ^ c ^ d) + x09 + 0xd9d4d039;	a = ((a << 4) | (a >>> 28)) + b;
		d += (a ^ b ^ c) + x12 + 0xe6db99e5;	d = ((d << 11) | (d >>> 21)) + a;
		c += (d ^ a ^ b) + x15 + 0x1fa27cf8;	c = ((c << 16) | (c >>> 16)) + d;
		b += (c ^ d ^ a) + x02 + 0xc4ac5665;	b = ((b << 23) | (b >>> 9)) + c;
		// Round 4
		a += (c ^ (b | ~d)) + x00 + 0xf4292244;	a = ((a << 6) | (a >>> 26)) + b;
		d += (b ^ (a | ~c)) + x07 + 0x432aff97;	d = ((d << 10) | (d >>> 22)) + a;
		c += (a ^ (d | ~b)) + x14 + 0xab9423a7;	c = ((c << 15) | (c >>> 17)) + d;
		b += (d ^ (c | ~a)) + x05 + 0xfc93a039;	b = ((b << 21) | (b >>> 11)) + c;
		a += (c ^ (b | ~d)) + x12 + 0x655b59c3;	a = ((a << 6) | (a >>> 26)) + b;
		d += (b ^ (a | ~c)) + x03 + 0x8f0ccc92;	d = ((d << 10) | (d >>> 22)) + a;
		c += (a ^ (d | ~b)) + x10 + 0xffeff47d;	c = ((c << 15) | (c >>> 17)) + d;
		b += (d ^ (c | ~a)) + x01 + 0x85845dd1;	b = ((b << 21) | (b >>> 11)) + c;
		a += (c ^ (b | ~d)) + x08 + 0x6fa87e4f;	a = ((a << 6) | (a >>> 26)) + b;
		d += (b ^ (a | ~c)) + x15 + 0xfe2ce6e0;	d = ((d << 10) | (d >>> 22)) + a;
		c += (a ^ (d | ~b)) + x06 + 0xa3014314;	c = ((c << 15) | (c >>> 17)) + d;
		b += (d ^ (c | ~a)) + x13 + 0x4e0811a1;	b = ((b << 21) | (b >>> 11)) + c;
		a += (c ^ (b | ~d)) + x04 + 0xf7537e82;	a = ((a << 6) | (a >>> 26)) + b;
		d += (b ^ (a | ~c)) + x11 + 0xbd3af235;	d = ((d << 10) | (d >>> 22)) + a;
		c += (a ^ (d | ~b)) + x02 + 0x2ad7d2bb;	c = ((c << 15) | (c >>> 17)) + d;
		b += (d ^ (c | ~a)) + x09 + 0xeb86d391;	b = ((b << 21) | (b >>> 11)) + c;
		
		this.au32_state[0] += a;
		this.au32_state[1] += b;
		this.au32_state[2] += c;
		this.au32_state[3] += d;
	}
};

/**
 * パディング
 * @param n_length データ長(byte).
 */
yjd.hash.Md5Gen.prototype.padding = function(n_length) {
	var n_mod = n_length % 4;
	var n_idx = (n_length - n_mod) / 4;
	this.au32_buffer[n_idx++] |= (0x80 << (n_mod * 8));
	while(n_idx % 16!=14) {
		this.au32_buffer[n_idx++] = 0;
	}
	var n_bit_len = n_length * 8;
	this.au32_buffer[n_idx++] = n_bit_len;
	this.au32_buffer[n_idx++] = Math.floor(n_bit_len / 4294967296);
	this.n_blocks = n_idx / 16;
};
	
/**
 * 文字列をUTF-8に変換してバッファにセットする.
 * @param s_str	文字列.
 * @return サイズ.(byte)
 */
yjd.hash.Md5Gen.prototype.setString = function(s_str) {
	var n_max_bytes = s_str.length * 4;
	var n_buff_size = (Math.floor((n_max_bytes + 8) / 64) + 1) * 16;
	this.au32_buffer = new Uint32Array(n_buff_size);
	var n_len = s_str.length;
	var n_idx = 0, n_shift = 0, n_code;
	for(var i=0; i<n_len; i++) {
		n_code = s_str.charCodeAt(i);
		if(n_code < 0x80) {
			this.au32_buffer[n_idx] |= (n_code << n_shift);	(n_shift==24)? (n_idx++, n_shift=0): n_shift += 8;
		} else if(n_code < 0x800) {
			this.au32_buffer[n_idx] |= ((0xc0 | (n_code >>> 6)) << n_shift);	(n_shift==24)? (n_idx++, n_shift=0): n_shift += 8;
			this.au32_buffer[n_idx] |= ((0x80 | (n_code & 0x3f)) << n_shift);	(n_shift==24)? (n_idx++, n_shift=0): n_shift += 8;
		} else if(n_code < 0xd800 || n_code >= 0xe000) {
			this.au32_buffer[n_idx] |= ((0xe0 | (n_code >>> 12)) << n_shift);	(n_shift==24)? (n_idx++, n_shift=0): n_shift += 8;
			this.au32_buffer[n_idx] |= ((0x80 | ((n_code>>>6) & 0x3f)) << n_shift);	(n_shift==24)? (n_idx++, n_shift=0): n_shift += 8;
			this.au32_buffer[n_idx] |= ((0x80 | (n_code & 0x3f)) << n_shift);	(n_shift==24)? (n_idx++, n_shift=0): n_shift += 8;
		} else {
			this.au32_buffer[n_idx] |= ((0xf0 | (n_code >>>18)) << n_shift);	(n_shift==24)? (n_idx++, n_shift=0): n_shift += 8;
			this.au32_buffer[n_idx] |= ((0x80 | ((n_code>>>12) & 0x3f)) << n_shift);	(n_shift==24)? (n_idx++, n_shift=0): n_shift += 8;
			this.au32_buffer[n_idx] |= ((0x80 | ((n_code>>>6) & 0x3f)) << n_shift);	(n_shift==24)? (n_idx++, n_shift=0): n_shift += 8;
			this.au32_buffer[n_idx] |= ((0x80 | (n_code & 0x3f)) << n_shift);	(n_shift==24)? (n_idx++, n_shift=0): n_shift += 8;
		}
	}
	return n_idx * 4 + n_shift / 8;
};

/**
 * ハッシュ値を文字列で得る.
 * @return 文字列(32文字).
 */
yjd.hash.Md5Gen.prototype.getValueByStr = function() {
	var n_reg, c0, c1, c2, c3, c4, c5, c6, c7;
	var s_str = '';
	for(var i=0; i<4; i++) {
		n_reg = this.au32_state[i];
		c0 = (n_reg >>> 4) & 0xF;
		c1 = n_reg & 0xF;
		c2 = (n_reg >>> 12) & 0xF;
		c3 = (n_reg >>> 8) & 0xF;
		c4 = (n_reg >>> 20) & 0xF;
		c5 = (n_reg >>> 16) & 0xF;
		c6 = (n_reg >>> 28) & 0xF;
		c7 = (n_reg >>> 24) & 0xF;
		s_str += c0.toString(16) + c1.toString(16) + c2.toString(16) + c3.toString(16)
				+ c4.toString(16) + c5.toString(16) + c6.toString(16) + c7.toString(16);
	}
	return s_str;
};
	
/**
 * ハッシュ値を文字列で取得.
 *	@param m_arg 現在は文字列のみ対応.
 */
yjd.hash.Md5Gen.prototype.getString = function(m_arg) {
	this.init();
	var n_bytes = this.setString(m_arg);
	this.padding(n_bytes);
	this.transform();
	return this.getValueByStr();
};

/**
 *	ハッシュ値を得る.
 *	@return ハッシュ値の16進文字列.（32文字）
 */
yjd.hash.md5 = function (m_arg) {
	var gen = new yjd.hash.Md5Gen();
	return gen.getString(m_arg);
};
