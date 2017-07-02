/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview Short cut keys
 * depend on yjd.base
 * @since  2017.07.02  initial coding.
 */

/**
 * Call short cut keys.
 * This set an event listenser on the document so make only one instance.
 * @constructor
 */
yjd.Sckey = function() {
	this.set = {};
	this.root = null;
	this.focused = null;
	var sck = this;
	document.addEventListener('keydown', onKeyDown, false);
	//
	function onKeyDown(event) {
		var code = event.keyCode;
		if(event.shiftKey)	code |= yjd.Sckey.SHIFT;
		if(event.altKey)	code |= yjd.Sckey.ALT;
		if(event.ctrlKey || event.metaKey)	code |= yjd.Sckey.CTRL;
		var focusedElm = document.activeElement.nodeName.toLowerCase();
		var bInput = focusedElm==='input' || focusedElm==='textarea' || focusedElm==='select';
		var callback = searchCallback(sck.focused, bInput) || searchCallback(sck.root, bInput);
		if(callback) {
			callback.func.apply(callback.this, callback.args);
		}
	}
	function searchCallback(map, bInput) {
		var callback = null;
		while(map && !callback) {
			if(map[code] && (callback.enforce || !bInput) ) callback = map[code];
			map = map.parent? map.parent: (map.next? map.next: null);
		}
		return callback;
	}
};

yjd.Sckey.SHIFT =	0x10000;
yjd.Sckey.ALT =		0x20000;	//	option
yjd.Sckey.CTRL =	0x40000;	//	command
yjd.Sckey.MODIFY =	0xF0000;	//	mask

/**
 * @typedef yjd.Sckey.map
 * @type {object}
 * @property {string} index Index of key set.
 * @property {yjd.Sckey.map|null} [parent] Parent key map.
 * @property {yjd.Sckey.map[]} [children] Children key maps.
 * @property {yjd.Sckey.map|null} [prev] Previous key map when linked list.
 * @property {yjd.Sckey.map|null} [next] Next key map when linked list.
 * @property {function} [callback] Callback function.
 * @property {*} [this] Value of this in callback.
 * @property {*[]} [args] Arguments when call callback.
 * @property {boolean} [enforce] if true, enforce evaluate key when any input is focused.
 */
/**
 * @typedef yjd.Sckey.keydef A short cut key definition.
 * @type {object}
 * @property {string} index Index of key set. Strings to be recognized as 0 are not allowed.
 * 	'root' also should be avoided. 
 * @property {number} code Keycode with modification like yjd.Sckey.SHIFT.
 * @property {function} [callback] Callback function 
 * @property {*} [this] Value of this in callback. 
 * @property {*[]} [args] Arguments when call callback. 
 * @property {boolean} [enforce] force enable even if input or button has focus.
 */

/**
 * Add keyset.
 * @param {string} index Index of key set. Strings to be recognized as 0 are not allowed.
 * 	'root' also should be avoided. 
 * @param {yjd.Sckey.keydef[]} keyset Array of key definition.
 * @param {Object} [options] Opions.
 * @property {function} [callback] Default callback function 
 * @property {*} [this] Default value of this in callback. 
 * @property {*[]} [args] Arguments to overwrite arguments of each callbacks in set. 
 * @property {boolean} [enforce] Default value of enforce.
 */
yjd.Sckey.prototype.add = function(index, keyset, options) {
	if(options===undefined) options = {};
	if(this.set[index]) {
		throw new Error(index+' is already set in Sckey.');
	}
	var map = {index: index};
	for(var i in keyset) {
		var callback = {};
		callback.func = keyset[i].callback || options.callback;
		callback.this = keyset[i].this || options.this;
		callback.args = yjd.extend([], keyset[i].args, options.args);
		callback.enforce = (keyset[i].enforce!==undefined)? keyset[i].enforce: options.enforce;
		map[keyset[i].code] = callback;
	}
	if(!options.parent) {	//	conect link list.
		map.prev = null;
		map.next = this.root;
		if(this.root) this.root.prev = map;
		this.root = map;
	} else {	//	conect tree.
		map.parent = this.set[options.parent] || null;
		if(map.parent) map.parent.children[map.index] = map;
	}
	map.children = {};
	this.set[index] = map;
};

/**
 * Remove keyset.
 * @param {string} index Index to remove.
 */
yjd.Sckey.prototype.remove = function(index) {
	if(this.focused.index===index) {
		this.focused = this.focused.parent;
	}
	var map = this.set[index];
	if(map.next===undefined) {	//	tree
		if(map.parent) delete map.parent.children[map.index];
		deleteTree(map);
	} else {	//	link list
		if(map.index===this.root.index) this.root = map.next;
		deleteLink(map);
	}
	delete this.set[index];
	//
	function deleteTree(map) {
		for(var prop in map.children) {
			deleteTree(map.children[prop]);
			delete map.children[prop];
		}
		delete map.parent;
	}
	function deleteLink(map) {
		if(map.prev) {
			map.prev.next = map.next;
		}
		if(map.next) {
			map.next.prev = map.prev;
		}
		delete map.next;
		delete map.prev;
	}
};

/**
 * Get and set focus to a keyset.
 * @param {string|null} index Index of set. set null to disable all.
 * @return {string|null} Index of focus
 */
yjd.Sckey.prototype.focus = function(index) {
	if(index!==undefined) this.focused = this.set[index];
	return this.focused;
};