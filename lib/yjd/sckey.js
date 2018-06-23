/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview Short cut keys
 * depend on base, key
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
		var code = yjd.key.getCode(event);
		var focusedElm = document.activeElement.nodeName.toLowerCase();
		var bInput = focusedElm==='input' || focusedElm==='textarea' || focusedElm==='select';
		var map = searchMapToCall(code, sck.focused, bInput) 
						|| searchMapToCall(code, sck.root, bInput);
		if(map) {
			var callback = map[code];
			callback.func.apply(callback.this, callback.args);
		}
	}

	function searchMapToCall(code, map, bInput) {
		var mapCall = null;
		while(map) {
			if(map[code] && (callback.enforce || !bInput) ) mapCall = map;
			map = map.parent? map.parent: (map.next? map.next: null);
		}
		return mapCall;
	}
};

/**
 * @typedef yjd.Sckey.map	linked list item that has callback
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
 * @property {yjd.Sckey.code} code Keycode with modification like yjd.Sckey.SHIFT.
 * @property {function} [callback] Callback function 
 * @property {*} [this] Value of this in callback. 
 * @property {*[]} [args] Arguments when call callback. 
 * @property {boolean} [enforce] force enable even if input or button has focus.
 */

/**
 * Add keyset.
 * @param {string} index Index of key set. 
 * 	Strings to be recognized as 0 are not allowed.
 * 	'root' also should be avoided. 
 * @param {yjd.Sckey.keydef[]} keyset Array of key definition.
 * @param {Object} [options] Opions.
 * @property {function} [callback] Default callback function 
 * @property {*} [this] Default value of this in callback. 
 * @property {*[]} [args] Arguments to overwrite arguments of each callbacks in set. 
 * @property {boolean} [enforce] Default value of enforce.
 * @property {string} [parent] Parent keyset. If omitted, this keyset become root keyset.
 * @property {function} [onFocus] Callback function to be called when focus is changed.
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
	if(!options.parent) {	//	connect to linked list.
		map.prev = null;
		map.next = this.root;
		if(this.root) this.root.prev = map;
		this.root = map;
	} else {	//	connect to tree.
		map.parent = this.set[options.parent] || null;
		if(map.parent) map.parent.children[map.index] = map;
	}
	map.onFocus = options.onFocus;
	map.children = {};
	this.set[index] = map;
};

/**
 * Remove keyset.
 * @param {string} index Index to remove.
 */
yjd.Sckey.prototype.remove = function(index) {
	this.removeChildren(index, true);
	var map = this.set[index];
	if(this.focused && this.focused.index===index) {
		this.focus(null, true);
	}
	if(map.parent) {
		delete map.parent.children[map.index];
		this.focus(map.parent.index);
	}
	delete this.set[index];
};

/**
 * Remove children keysets.
 * @param {string} index Index to remove it's children.
 * @param {boolean} [disableCall=false] Disable to call callback on focus.
 */
yjd.Sckey.prototype.removeChildren = function(index, disableCall) {
	if(disableCall===undefined) disableCall = false;
	if(this.focused && this.focused.index===index) this.focused = null;
	var map = this.set[index];
	if(map.next===undefined) {	//	tree
		if( call.deleteTree(this, map) ) this.focus(index, disableCall);
	} else {	//	linked list
		if(map.index===this.root.index) this.focus(null, true);
		call.deleteLink(this, map);
	}
	//
	function deleteTree(map) {
		var hasFocus = false;
		for(var prop in map.children) {
			hasFocus = hasFocus || deleteTree(map.children[prop]);
			if(this.focused && this.focused.index===map.children[prop].index) {
				hasFocus = true;
				this.focus(null, true);
			}
			delete map.children[prop];
		}
		delete map.parent;
		return hasFocus;
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
 * @param {string|null} [index] Index of set. set null to disable all.
 * @param {boolean} [disableCall=false] Disable to call callback function.
 * @return {string|null} Index of focus
 */
yjd.Sckey.prototype.focus = function(index, disableCall) {
	if(disableCall===undefined) disableCall = false;
	if(index!==undefined) {
		if( (!this.focused && index!==null) 
			|| (this.focused && index!==this.focused.index)) {
			
			callOnFocus.call(this, false);
			this.focused = this.set[index];
			callOnFocus.call(this, true);
		}
	}
	return this.focused? this.focused.index: null;
	//
	function callOnFocus(val) {
		if(!disableCall && this.focused && this.focused.onFocus) {
			this.focused.onFocus.call(this.focused.this, val);
		}
	}
};