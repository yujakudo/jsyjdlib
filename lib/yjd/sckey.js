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
		var map = searchMapToCall(code, sck.focused, bInput) 
						|| searchMapToCall(code, sck.root, bInput);
		if(map) {
			callback = map[code];
			callback.func.apply(callback.this, callback.args);
		}
	}
	function searchMapToCall(code, map, bInput) {
		var mapCall = null;
		while(map && !callback) {
			if(map[code] && (callback.enforce || !bInput) ) mapCall = map;
			map = map.parent? map.parent: (map.next? map.next: null);
		}
		return mapCall;
	}
};

yjd.Sckey.SHIFT =	0x0100;
yjd.Sckey.ALT =		0x0200;	//	option
yjd.Sckey.CTRL =	0x0400;	//	command
yjd.Sckey.CODE =	0x00FF;	//	mask

yjd.Sckey.Key2str = [];
yjd.Sckey.Key2str[ DOM_VK_CANCEL ] = 'Cancel';
yjd.Sckey.Key2str[ DOM_VK_HELP ] = 'Help';
yjd.Sckey.Key2str[ DOM_VK_BACK_SPACE ] = 'BackSpace';
yjd.Sckey.Key2str[ DOM_VK_TAB ] = 'Tab';
yjd.Sckey.Key2str[ DOM_VK_CLEAR ] = 'Clear';
yjd.Sckey.Key2str[ DOM_VK_RETURN ] = 'Return';
yjd.Sckey.Key2str[ DOM_VK_ENTER ] = 'Enter';
yjd.Sckey.Key2str[ DOM_VK_SHIFT ] = 'Shift';
yjd.Sckey.Key2str[ DOM_VK_CONTROL ] = 'Control';
yjd.Sckey.Key2str[ DOM_VK_ALT ] = 'Alt';
yjd.Sckey.Key2str[ DOM_VK_PAUSE ] = 'Pause';
yjd.Sckey.Key2str[ DOM_VK_CAPS_LOCK ] = 'CapsLock';
yjd.Sckey.Key2str[ DOM_VK_ESCAPE ] = 'Escape';
yjd.Sckey.Key2str[ DOM_VK_SPACE ] = 'Space';
yjd.Sckey.Key2str[ DOM_VK_PAGE_UP ] = 'PageUp';
yjd.Sckey.Key2str[ DOM_VK_PAGE_DOWN ] = 'PageDown';
yjd.Sckey.Key2str[ DOM_VK_END ] = 'End';
yjd.Sckey.Key2str[ DOM_VK_HOME ] = 'Home';
yjd.Sckey.Key2str[ DOM_VK_LEFT ] = 'Left';
yjd.Sckey.Key2str[ DOM_VK_UP ] = 'Up';
yjd.Sckey.Key2str[ OM_VK_RIGHT ] = 'Right';
yjd.Sckey.Key2str[ DOM_VK_DOWN ] = 'Down';
yjd.Sckey.Key2str[ DOM_VK_PRINTSCREEN ] = 'PrintScreen';
yjd.Sckey.Key2str[ DOM_VK_INSERT ] = 'Insert';
yjd.Sckey.Key2str[ DOM_VK_DELETE ] = 'Delete';
yjd.Sckey.Key2str[ DOM_VK_CONTEXT_MENU ] = 'ContextMenu';
yjd.Sckey.Key2str[ DOM_VK_NUMPAD0 ] = 'Numpad0';
yjd.Sckey.Key2str[ DOM_VK_NUMPAD1 ] = 'Numpad1';
yjd.Sckey.Key2str[ DOM_VK_NUMPAD2 ] = 'Numpad2';
yjd.Sckey.Key2str[ DOM_VK_NUMPAD3 ] = 'Numpad3';
yjd.Sckey.Key2str[ DOM_VK_NUMPAD4 ] = 'Numpad4';
yjd.Sckey.Key2str[ DOM_VK_NUMPAD5 ] = 'Numpad5';
yjd.Sckey.Key2str[ DOM_VK_NUMPAD6 ] = 'Numpad6';
yjd.Sckey.Key2str[ DOM_VK_NUMPAD7 ] = 'Numpad7';
yjd.Sckey.Key2str[ DOM_VK_NUMPAD8 ] = 'Numpad8';
yjd.Sckey.Key2str[ DOM_VK_NUMPAD9 ] = 'Numpad9';
yjd.Sckey.Key2str[ DOM_VK_MULTIPLY ] = 'Multiply';
yjd.Sckey.Key2str[ DOM_VK_ADD ] = 'Add';
yjd.Sckey.Key2str[ DOM_VK_SEPARATOR ] = 'Separator';
yjd.Sckey.Key2str[ DOM_VK_SUBTRACT ] = 'Subtract';
yjd.Sckey.Key2str[ DOM_VK_DECIMAL ] = 'Decimal';
yjd.Sckey.Key2str[ DOM_VK_DIVIDE ] = 'Divide';
yjd.Sckey.Key2str[ DOM_VK_NUM_LOCK ] = 'NumLock';
yjd.Sckey.Key2str[ DOM_VK_SCROLL_LOCK ] = 'ScrollLock';
yjd.Sckey.Key2str[ DOM_VK_COMMA ] = 'Comma';
yjd.Sckey.Key2str[ DOM_VK_PERIOD ] = 'Period';
yjd.Sckey.Key2str[ DOM_VK_SLASH ] = 'Slash';
yjd.Sckey.Key2str[ DOM_VK_BACK_QUOTE ] = 'BackQuote';
yjd.Sckey.Key2str[ DOM_VK_OPEN_BRACKET ] = 'OpenBracket';
yjd.Sckey.Key2str[ DOM_VK_BACK_SLASH ] = 'BackSlash';
yjd.Sckey.Key2str[ DOM_VK_CLOSE_BRACKET ] = 'CloseBracket';
yjd.Sckey.Key2str[ DOM_VK_QUOTE ] = 'Quote';
yjd.Sckey.Key2str[ DOM_VK_META ] = 'Meta';

/**
 * @typedef yjd.Sckey.code
 * @type {Number}
 * @description Key code and modified key info.
 * Logical OR of a constant of key code and modifier like 'yjd.Sckey.SHIFT'.
 * Constants of key code is like 'DOM_VK_0'. ex.'DOM_VK_+[0-9]|[A-Z]|F[1-24]|SEMICOLON|EQUALS'
 * (See source code of defined yjd.Sckey.Key2str.) 
 * Modifiers represent keys pressed simultaneously, take yjd.Sckey.SHIFT, yjd.Sckey.ALT, and/or yjd.Sckey.CTRL.
 */

/**
 * Get string of key name.
 * @param {yjd.Sckey.code} code Key code. Specify the logical OR of a constant like '' and the flag
 */
yjd.Sckey.getKeyName = function(code) {
	var str = '';
	var key = code & yjd.Sckey.CODE;
	if(code & yjd.Sckey.CTRL) str += (yjd.os.family==='Mac')? 'Command+': 'Ctrl+';
	if(code & yjd.Sckey.ALT) str += (yjd.os.family==='Mac')? 'Option+': 'Alt+';
	if(code & yjd.Sckey.SHIFT) str += 'Shift+';
	if(48<=key && key<=90) str += String.fromCharCode(key).toUpperCase();
	else if(112<=key && key<=135) str += 'F'+(key-111);
	else if(yjd.Sckey.Key2str[key]!==undefined) {
		str += yjd.Sckey.Key2str[key];
	} else {
		str = '';
	}
	return str;
};

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
 * @property {yjd.Sckey.code} code Keycode with modification like yjd.Sckey.SHIFT.
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
	if(!options.parent) {	//	connect link list.
		map.prev = null;
		map.next = this.root;
		if(this.root) this.root.prev = map;
		this.root = map;
	} else {	//	conect tree.
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
 * @param {boolean} [disableCall] Disable to call callback on focus.
 */
yjd.Sckey.prototype.removeChildren = function(index, disableCall) {
	if(this.focused && this.focused.index===index) this.focused = null;
	var map = this.set[index];
	if(map.next===undefined) {	//	tree
		if( deleteTree(map) ) this.focus(index, disableCall);
	} else {	//	link list
		if(map.index===this.root.index) this.focus(null, true);
		deleteLink(map);
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
 * @param {boolean} [disableCall] Disable to call callback function.
 * @return {string|null} Index of focus
 */
yjd.Sckey.prototype.focus = function(index, disableCall) {
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