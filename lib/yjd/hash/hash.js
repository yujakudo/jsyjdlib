/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview Hash algorizms.
 * depend on yjd.base
 * @since  2017.12.16  initial coding.
 */

 /**
  * Class hash
  * @param s_method {string} name of method. md5 or sha512
  */
yjd.hash = function(s_method) {
	s_method = s_method.substr(0,1).toUpperCase() + s_method.substr(1).toLowerCase();
	this.gen = new yjd.hash[s_method+'Gen']();
};

/**
 * Get hash value by string.
 * @param {string} m_arg Object to get hash. currently only supports string.
 * @return {string} hash value
 */
yjd.hash.prototype.getString = function(m_arg) {
	return this.gen.getString(m_arg);
};

/**
 * ダイジェストを得る.
 * @param s_user	ユーザーID
 * @param s_realm	realm
 * @param s_passwd	パスワード
 * @param s_method	GET or POST
 * @param s_uri		URI
 * @param s_nonce	nonce
 * @param s_cnonce	cnonce
 * @param s_nc		nc.
 * @param s_qgp		qgp.
 * @return ハッシュ値の文字列.
 */
yjd.hash.prototype.getDigest = function(s_user, s_realm, s_passwd, s_method, s_uri, s_nonce, s_cnonce, s_nc, s_qgp) {
	var s_a1 = this.gen.getString(s_user + ':' + s_realm + ':'+ s_passwd);
	var s_a2 = this.gen.getString(s_method + ':' + s_uri);
	return this.gen.getString(s_a1 + ':' + s_nonce + ':' + s_nc + ':' + s_cnonce + ':' + s_qgp + ':' + s_a2);
};

/**
 * nonceの取得.
 * @param i_length 文字列長. 省略化.
 * @return nonceの文字列
 */
yjd.hash.prototype.createNonce = function(i_length) {
	if(i_length===undefined) {
		i_length = 52;
	}
	var s_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	var i_chars = s_chars.length;
	var s_nonce = '';
	for(var i=0; i<i_length; i++) {
		s_nonce += s_chars.charAt(Math.floor(Math.random() * i_chars));
	}
	return s_nonce;
};
