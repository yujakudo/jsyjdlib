/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview button
 * @since  2017.06.10  initial coding.
 */

/**
 * @typedef yjd.wdg.Button.structure
 * @property {string} label HTML of label.
 * @property {function} [callback] Callback function when clicked.
 * @property {*} [this] 'This' value in callback.
 * @property {*[]} [args] arguments to call callback. 
 * @property {boolean} [default] set defaukt if true. 
 */
/**
 * Button
 * @param {yjd.wdg.Button.structure|string} label HTML of label. 
 * 	Or, An object representing arguments. 
 * @param {function} [callback] Callback function when clicked.
 * @param {*} [o_this] 'This' value in callback.
 * @param {*|*[]} [args] arguments to call callback. 
 */
yjd.wdg.Button = function(label, callback, o_this, args) {
	if(typeof label==='object') {
		yjd.extend(this, label);
	} else {
		this.label = label;
		this.callback = callback;
		this.this = o_this;
		if(!(args instanceof Array)) args = [args];
		this.args = args;
	}
	label = yjd.wdg.getLabelAndKey(this.label);
	this.key = yjd.wdg.getLabelAndKey(this.label);
	this.atm = yjd.atm('<button class="yjd-wdg-button">'+label.label+'</button>');
	this.events = {};
};

/**
 * explicitly release properties
 */
yjd.wdg.Button.prototype.destroy = function() {
	this.atm.remove();
	yjd.obj.prototype.destroy.call(this);
};

/**
 * bind event listeners
 */
yjd.wdg.Button.prototype.bind = function() {
	if(!this.callback) return;
	this.events.click = this.atm.bind('click', this, onclick, true);
	function onclick(event, atm) {
		this.callback.apply(this.this, this.args);
	}
};

/**
 * unbind all event listeners
 */
yjd.wdg.Button.prototype.unbindAll = yjd.wdg.prototype.unbindAll;

/**
 * set tab index
 * @param {number} n number of tab index.
 */
yjd.wdg.Button.prototype.setTabIndex = function(n) {
	this.atm.attr('tabindex', n);
};