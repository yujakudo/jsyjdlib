/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview jQuery like class and some tools for DOM access.
 * depend on base.js
 * @since  2017.04.17  initial coding.
 */

/**
 * Class to handle DOM element like jQuery.
 * This instance contain DOM element and can be handled it's method.
 * instance can be created without operator 'new' like :
 * <pre>var atm = yjd.atm('<div></div>');</pre>
 * It can handle only one element unlike jQuery.
 * When you want to handle multiple elements, use yjd.elms. @see yjd.elms
 * @constructor
 * @param {function|string|object|number} q Translatable value to yjd.atm object
 * 	like query or identifier.
 * <ul><li>When function without operator 'new', it is synonym of 'yjd.atm.ready'
 *  so adds it to ready functions. @see yjd.ready
 * </li><li>When string,
 *  	<ul><li>'!fragment': create fragment element,</li>
 * 			<li>'<tag attr="value">HTML</tag>': create new element from string,</li>
 * 			<li>other string: handled as selector query then set applicable element.</li>
 *  	</ul>
 * 	</li><li>When number,
 *      <ul><li>zero or positive: set nth child element. n is a number start at 0,</li>
 * 			<li>negative: set nth child element from bottom. if -1, set last child. </li>
 * 		</ul>
 * 	</li><li>When object,
 * 		<ul><li>HTMLElement or HTMLBodyElement: set it,</li>
 * 			<li>yjd.atm: set element in it,
 * 			<li>string[]: joined to a string and handled as '<tag attr="value">HTML</tag>'.</li>
 * 		</ul>
 * </li></ul>
 * @param {string|object|number} [context=document] Element or yjd.atm object for context node.
 *  When 'q' is selector query or child number, it is resolved in the context.
 * 	It's type and meanings is almost same as argument 'q' except 
 * 	specifisation to create new element.
 *  An object with names starting with 'HTML' can be specified and it is handled
 *  as HTMLElement. Nodes in iframe are this type.
 * @return {yjd.atm} new object. If fail to create, property elm is null.
 */
yjd.atm = function(q, context) {
	if(!(this instanceof yjd.atm)) {
		if(typeof q ==='function') {
			yjd.atm.ready(q);
			return;
		}
		return new yjd.atm(q, context);
	}
	//  resolve context to element.
	context = yjd.atm.contextElm(context);
	this.elm = null;
	//  resolve q
	switch(typeof q) {
		case 'string':
			if(q==='!fragment') {
				this.elm = document.createDocumentFragment();
			} else if(q.match(/^\s*<([\s\S]+)>\s*$/)) {
				this.elm = yjd.createElementFromStr(q);
			} else {
				this.elm = context.querySelector(yjd.atm.cssEscape(q));
			}
			break;
		case 'number':
			if(q>=0) {
				this.elm = context.children[q];
			} else if(q<0) {
				var len = context.children.length;
				this.elm = context.children[len+q];
			}
			break;
		case 'object':
			if(q instanceof HTMLElement || q instanceof HTMLBodyElement) {
				this.elm = q;
			} else if(q instanceof yjd.atm) {
				this.elm = q.elm;
			} else if(q instanceof Array) {
				this.elm = yjd.createElementFromStr(q);
			}
			break;
	} 
};

/**
 * Translate to yjd.atm object.
 * It can be used as alternative of yjd.atm()
 * @param {*} atm Something to check
 * @return {yjd.atm|false} The instance specified, or newly created instance.
 *  If it can not create, return false.
 */
yjd.atm.check = function(atm) {
	if(this instanceof yjd.atm) return atm;
	atm = new yjd.atm(atm);
	if(!atm.elm) return false;
	return atm;
};

/**
 * Check the object likes DOM Element containing elements in ifames. 
 * It checks only if Top four letters of the object is 'HTML' or not.
 * You should not use objets named like that.
 * @param {Object} obj Object to check.
 * @return {boolean} True if the object likes, or false.
 */
yjd.atm.likesElement = function(obj) {
	return obj.toString().substr(0,12)==='[object HTML';
};

/**
 * Get context node.
 * Resolve context node and return it.
 * @private
 * @param {Object|yjd.atm|string} context
 * @return {Node}    context node
 */
yjd.atm.contextElm = function(context) {
	if(context instanceof HTMLElement || context instanceof HTMLDocument ||
		context instanceof HTMLBodyElement ) {
		return context;
	} else if(typeof context==='string' || typeof context==='number') {
		return yjd.atm(context, document).elm;
	} else if(context instanceof yjd.atm) {
		return context.elm;
	} else if(typeof context ==='object' && yjd.atm.likesElement(context)) {
		return context;
	}
	return document;
};

/**
 * Register function to execute when contents are loaded.
 * @param {function|true}    func    callback called after loading.
 *  'true' is used for indicater of ready and should not use for API.
 */
yjd.atm.ready = function(func) {
	var _this = yjd.atm.ready;
	if(_this.funcs===undefined) {
		_this.funcs  = [];
		_this.ready = false;
	}
	//  ready to do.
	if(func===true) {
		_this.b_ready = true;
		for(var i in _this.funcs ) _this.funcs[i]();
		_this.funcs = null;
		return;
	}
	//  register callback or do immediately
	if(_this.b_ready===true) func();
	else _this.funcs.push(func);
};

/**
 * Get tab name in lower case.
 * @return {string|false} Tag name. Or false if it does not contain element.
 */
yjd.atm.prototype.tag = function() {
	if(this.elm) return this.elm.tagName.toLowerCase();
	return false;
};

/**
 * Set or get attribute.
 * @param {string|Object} name Name of attribute. 
 *  Or, Object with name:value pairs to set values.
 * @param {string} [value] Value to set. 
 *  when omitted and 'name' is string, return attribute value.
 * @return {yjd.atm|string} The The instance itself when set. 
 *  Or, value of attribute.
 */
yjd.atm.prototype.attr = function(name, value) {
	if(typeof name==='object') {
		for(var prop in name) {
			this.elm.setAttribute(prop, name[prop]);
		}
	} else if(value!==undefined) {
		this.elm.setAttribute(name, value);
	} else {
		return this.elm.getAttribute(name);
	}
	return this;
};

/**
 * Remove attribute.
 * @param {string} name Name of attribute. 
 */
yjd.atm.prototype.removeAttr = function(name) {
	this.elm.removeAttribute(name);
	return this;
};

/**
 * Set or get data of element in the attribute with name starting 'data-'.
 * @param {string} key Name of data. 
 * @param {string|number|Object} [value] Value to set.
 *  when omitted and 'name' is string, return attribute value.
 * @return {yjd.atm|string|number|Object|null} The yjd.atm objectitself when setting. 
 *  When getting, value of data or null if data does not exist.
 */
yjd.atm.prototype.data = function(key, val) {
	key = 'data-'+key;
	if(val===undefined) {
		val = this.elm.getAttribute(key);
		if(val===null) return null;
		if(val.length>1 && val.charAt(0)==='{' && val.substr(-1)==='}') {
			val = JSON.parse(val);
		}
		return val;
	}
	if(typeof val==='object')   val = JSON.stringify(val);
	this.elm.setAttribute(key, val);
	return this;
};

/**
 * Add class to the element.
 * @param {string|strings} name Name of class or its array.
 * @return {yjd.atm} The The instance itself. 
 */
yjd.atm.prototype.addClass = function(name) {
	var names = name.split(' ');
	for(var i in names) {
		name = names[i];
		if(name) this.elm.classList.add(name);
	}
	return this;
};

/**
 * Remove class from the element.
 * @param {string|strings} name Name of class or its array.
 * @return {yjd.atm} The The instance itself. 
 */
yjd.atm.prototype.removeClass = function(name) {
	var names = name.split(' ');
	for(var i in names) {
		name = names[i];
		if(name) this.elm.classList.remove(name);
	}
	return this;
};

/**
 * Toggle class from the element.
 * @param {string|strings} name Name of class or its array.
 * @return {yjd.atm} The The instance itself. 
 */
yjd.atm.prototype.toggleClass = function(name) {
	var names = name.split(' ');
	for(var i in names) {
		name = names[i];
		if(name) this.elm.classList.toggle(name);
	}
	return this;
};

/**
 * Exam if the element has a specific class or not.
 * @param {string|strings} name Name of class or its array.
 * @return {boolean} True if the element has any class in specified.
 *  Otherwise return false.
 */
yjd.atm.prototype.hasClass = function(name) {
	var names = name.split(' ');
	for(var i in names) {
		name = names[i];
		if(name && !this.elm.classList.contains(name)) {
			return false;
		}
	}
	return true;
};

/**
 * Set or get class as attribute.
 * @param {string|string[]} [value] string of space sepalated classes.
 *  Or, array of string of class names. Omit to get value.
 * @return {yjd.atm|string} The instance itself when set.
 *  Or, string of space sepalated classes.
 */
yjd.atm.prototype.class = function(value) {
	if(value===undefined) {
		return this.elm.getAttribute('class');
	}
	var classes = value;
	if(typeof value==='object') {
		classes = '';
		for(var prop in value) {
			classes += ' '+value[prop];
		}
	}
	this.elm.setAttribute('class', classes);
	return this;
};

/**
 * Set or get style of the element owns.
 * when getting, return value is not computed style throw whole CSS.
 * if you want to get computed style, use @see getStyle.
 * @param {string|Object} name Name of style. 
 *  Or, object with key:value pairs to set. it does not affect other styles.
 * @param {string} [value] Value to set. Omit to get value.
 * @return {yjd.atm|string} The instance itself when set.
 *  Or, value of specified style of the element owns.
 */
yjd.atm.prototype.style = function(name, value) {
	var s_style='', o_style={};
	if(typeof name=='object') {
		for(var prop in name) {
			var stylename = yjd.atm.hyphen2camel(prop);
			this.elm.style[stylename] = name[prop];
		}
	} else if(value!==undefined) {
		name = yjd.atm.hyphen2camel(name);
		this.elm.style[name] = value;
	} else {
		name = yjd.atm.hyphen2camel(name);
		return this.elm.style[name];
	}
	return this;
};

/**
 * Remove style of the element owns.
 * @param {string|string[]} [name] Name of style or array of its.
 * Omit to remove all styles the element owns. 
 * @return {yjd.atm} The instance itself when set.
 */
yjd.atm.prototype.removeStyle = function(name) {
	if(name===undefined) {
		this.elm.removeAttribute('style');
	} else {
		if(typeof name!=='object') name = [name];
		for(var stylename in name) {
			stylename = yjd.atm.hyphen2camel(stylename);
			this.elm.style[stylename] = '';
		}
	}
	return this;
};

/**
 * Set or get ID.
 * @param {string} [value] ID to set. Omit to get text. 
 * @return {yjd.atm|string} The instance itself when set.
 * Or, ID if value omitted.
 */
yjd.atm.prototype.id = function(value) {
	if(value===undefined) {
		return this.elm.id;
	}
	this.elm.id = value;
	return this;
};

/**
 * Set or get inner HTML.
 * @param {string|string[]} [value] HTML to set or its array.
 * Omit to get HTML. 
 * @return {yjd.atm|string} The instance itself when set.
 * Or, HTML string if value omitted.
 */
yjd.atm.prototype.html = function(value) {
	if(value===undefined) {
		return this.elm.innerHTML;
	}
	if(typeof value==='object') value = value.join();
	this.elm.innerHTML = value;
	return this;
};

/**
 * Set or get inner text.
 * @param {string|string[]} [value] text to set or its array.
 * Omit to get text. 
 * @return {yjd.atm|string} The instance itself when set.
 * Or, text if value omitted.
 */
yjd.atm.prototype.text = function(value) {
	if(value===undefined) {
		return this.elm.innerText;
	}
	if(typeof value==='object') value = value.join();
	this.elm.innerText = value;
	return this;
};

/**
 * Get computed style through all CSS.
 * if you want to get style the element owns, use @see style .
 * @param {string} [name] Name of style.
 * @return {string|Object} Value of style. 
 * 	Or, whole of styles in object if name is omitted.
 */
yjd.atm.prototype.getStyle = function(name) {
	var style = window.getComputedStyle(this.elm, null);
	if(name===undefined) return style;
	name = yjd.atm.hyphen2camel(name);
	return style[name];
};

/**
 * Get elemnt width.
 * @param {number} [sw] switch of type to get. 
 * 1:with border, 2:expanded scroll client area, other or omitted: client area
 * @return {number} Width
 */
yjd.atm.prototype.width = function(sw) {
	if(sw===1) return this.elm.offsetWidth;
	else if(sw===2) return this.elm.scrollWidth;
	return this.elm.clientWidth;
};

/**
 * Get elemnt height.
 * @param {number} [sw] switch of type to get. 
 * 1:with border, 2:expanded scroll client area, other or omitted: client area
 * @return {number} Height
 */
yjd.atm.prototype.height = function(sw) {
	if(sw===1) return this.elm.offsetHeight;
	else if(sw===2) return this.elm.scrollHeight;
	return this.elm.clientHeight;
};

/**
 * Get rectangle contains position and size.
 * Style value of position should be fixed or absolute.
 * @param {yjd.arm.rect|yjd.atm} [context] Context to position value to set.
 * 	If specified, top or bottom, left or right are set to be 0.
 * @param {number} [base] When set context, set bit 0x2 to handle with attribute bottom.
 * 	and set bit 0x1 to handle with attribute right. 
 * @return {yjd.atm.rect} Rectangle.
 */
yjd.atm.prototype.getRect = function(context, base) {
	if(base===undefined) base = 0;
	var rect = new yjd.atm.rect(this);
	if(context!==undefined) {
		if(base & 2)	this.elm.style.bottom = 0;
		else this.elm.style.top = 0;
		if(base & 1)	this.elm.style.right = 0;
		else this.elm.style.left = 0;
		rect.setContext(context);
	}
	return rect;
};

/**
 * Set position.
 * @param {number} [x] X value. If null, the box is set at horizontal center.
 * @param {number} [y] Y value. If null, the box is set at vertical center.
 * @param {yjd.atm|HTMLElement} [context] Base elemnt of position.
 * 	Default is parent element.
 * @param {number} [base] When set context, set bit 0x2 to handle with attribute bottom.
 * 	and set bit 0x1 to handle with attribute right. Default is 0(top,left).
 */
yjd.atm.prototype.setPos = function(x, y, context, base) {
	if(base===undefined) base = 0;
	if(context===undefined)	context = this.elm.parentNode;
	var rect = this.getRect(context, base);
	if(base & 2)	this.elm.style.bottom = rect.bottom(x);
	else	this.elm.style.top = rect.top(x);
	if(base & 1)	this.elm.style.right = rect.right(x);
	else	this.elm.style.left = rect.left(x);
};

/**
 * Set position base element.
 * it is called befor @see pos .
 * @param {yjd.atm|string|HTMLElement|null} [base] yjd.atm object or translatable
 *	to be base of position.
 * If null or omitted, settings of position base is cleared.
 * @return {yjd.atm} The instance itself when set.
 */
/*yjd.atm.prototype.setPosBase = function(base) {
	if(base===undefined || base===null) {
		delete this.posBase;
	} else {
		this.posBase = yjd.atm.check(base);
	}
	return this;
};
*/
/**
 * Set or get 'top', 'bottom', 'left' or 'right' value of style.
 * when the element position is absolute and the parent node's position is relative,
 * It is easy to set position to align another element.
 * Before use this, set base element by @see setPosBase .
 * The argument value to set specifies relateive value from position base.
 * An actual value to be set is computed from value and base.
 * If position base is not set, the value is directory set.
 * @param {string} name One of the followings: 'top', 'bottom', 'left' or 'right' 
 * @param {number} [value] Value to set. Omit to get value.
 * @return {yjd.atm|string} The instance itself when set.
 * 	Or, actual value to be set.
 */
/*yjd.atm.prototype.pos = function(name, value) {
	if(value===undefined) {
		return this.elm.style[name];
	}
	if(value===null || value==='') {
		this.elm.style[name] = null;
	} else {
		if(this.posBase) {
			var curBase;
			if(this.getStyle('position')==='absolute') curBase = this.parent();
			var offset = new yjd.atm.rect(this.posBase, curBase);
			value += offset[name]();
		}
		this.elm.style[name] = value+'px';
	}
	return this;
};
*/
/**
 * Set or get top of style.
 * the argument value is relative from position base. See @see yjd.atm.prototype.pos
 * @param {number} [value] Value to set. Omit to get value.
 * @return {yjd.atm|string} The instance itself when set.	Or, actual value to be set.
 */
/*yjd.atm.prototype.top = function(value) {
	if(value!==undefined) this.pos('bottom', null);
	return this.pos('top', value);
};
*/
/**
 * Set or get bottom of style.
 * the argument value is relative from position base. See @see yjd.atm.prototype.pos
 * @param {number} [value] Value to set. Omit to get value.
 * @return {yjd.atm|string} The instance itself when set.	Or, actual value to be set.
 */
/*yjd.atm.prototype.bottom = function(value) {
	if(value!==undefined) this.pos('top', null);
	return this.pos('bottom', value);
};
*/
/**
 * Set or get left of style.
 * the argument value is relative from position base. See @see yjd.atm.prototype.pos
 * @param {number} [value] Value to set. Omit to get value.
 * @return {yjd.atm|string} The instance itself when set.	Or, actual value to be set.
 */
/*yjd.atm.prototype.left = function(value) {
	if(value!==undefined) this.pos('right', null);
	return this.pos('left', value);
};
*/
/**
 * Set or get right of style.
 * the argument value is relative from position base. See @see yjd.atm.prototype.pos
 * @param {number} [value] Value to set. Omit to get value.
 * @return {yjd.atm|string} The instance itself when set.	
 * 	Or, actual value to be set.
 */
/*yjd.atm.prototype.right = function(value) {
	if(value!==undefined) this.pos('left', null);
	return this.pos('right', value);
};
*/
/**
 * Get parent or closest ancestor node.
 * @param {string} [selector] Seletor query of ancestor to get. if omitted, return parent.
 * @return {yjd.atm} Parent or the ancestor node.
 */
yjd.atm.prototype.parent = function(selector){
	var elm = this.elm.parentElement;
	if(selector) elm = elm.closest(selector);
	return new yjd.atm(elm);
};

/**
 * Get closest ancestor.
 * @param {string} [selector] Seletor query of ancestor to get. if omitted, return parent.
 * Currentry support only 'tagName.className'.
 * @return {yjd.atm} Closest ancestor.
 * @todo not work for all selector
 */
/*yjd.atm.prototype.ancestor = function(selector) {
	var elm = this.elm.parentElement;
	if(selector) {
		elm = this.elm.closest(selector);  //  Getting other tree?
		// var tagName = selector;
		// var className = '';
		// var pos = selector.indexOf('.');
		// if(pos) {
		// 	tagName = selector.substr(0, pos);
		// 	className = selector.substr(pos+1);
		// }
		// while(elm && (
		// 	(tagName!=='' && elm.tagName!==tagName)
		// 	|| (className!=='' && !elm.classList.contains(className))
		// )) {
		// 	elm = elm.parentElement;
		// }
	}
	return new yjd.atm(elm);
};
*/
/**
 * Get a child node.
 * @param {number|string} [q] Selector string or ordinal number of child 
 * 	starting from zero.
 * 	Negative number can be specified to get from last child.
 * 	If omitted, it returns first child.
 * @return {yjd.atm|false} yjd.atm object of a Child node. Or false if not found.
 */
yjd.atm.prototype.child = function(q) {
	if(q===undefined) q = 0;
	if(typeof q==='number') {
		var atm = yjd.atm(q, this);
		return atm;
	}
	var atms = this.children(q);
	if(!atms.elms || atms.elms.length===0) return false;
	return atms.item(0);
};

/**
 * Get matched nodes 
 * @private
 * @param {NodeList|Node[]} nodelist Array of test elements.
 * @param {string} [selector] Selector for nodes. If omitted, returns all nodes.
 * @return {Node[]} Array of nodes matched.
 */
yjd.atm.getNodes = function (nodelist, selector) {
	var elms = [];
	for(var i=0; i<nodelist.length; i++) {
		var test = nodelist[i];
		if(selector===undefined || test.matches(selector)) elms.push(test);
	}
	return elms;
};

/**
 * Get child nodes.
 * @param {string} [selector] Selector for children. If omitted, Returns all child nodes.
 * @return {yjd.atms} Child nodes.
 */
yjd.atm.prototype.children = function(selector){
	if(selector===undefined) return new yjd.atms(this.children);
	var elms = yjd.atm.getNodes(this.elm.children, selector);
	return new yjd.atms(elms);
};

/**
 * Remove specific child
 * @param {string} [selector] Selector to remove children. 
 * 	If omitted. Removes all children. Text nodes are remained.
 */
yjd.atm.prototype.removeChild = function(selector) {
	var matches = [];
	var elms = yjd.atm.getNodes(this.children, selector);
	for(var i in elms) this.elm.removeChild(elms[i]);
	return this;
};

/**
 * Get child and decsendent nodes matching query.
 * @param {string} selector Query
 * @return {yjd.atms} nodes found.
 */
yjd.atm.prototype.find = function(selector){
	return new yjd.atms(selector, this);
};

/**
 * Get first child and decsendent node matching query.
 * @param {string} selector Query
 * @return {yjd.atm} nodes found.
 */
yjd.atm.prototype.findOne = function(selector){
	return new yjd.atm(selector, this);
};

/**
 * Add specified element at last of the node.
 * @param {yjd.atm|HTMLElement|string|number} atm yjd.atm object 
 * 	or translatable to be added.
 * @return {yjd.atm} The instance itself.
 */
yjd.atm.prototype.append = function(atm) {
	atm = yjd.atm.check(atm);
	this.elm.appendChild(atm.elm);
	return this;
};

/**
 * Add specified element at first of the node.
 * @param {yjd.atm|HTMLElement|string|number} atm yjd.atm object 
 * 	or translatable to be added.
 * @return {yjd.atm} The instance itself.
 */
yjd.atm.prototype.prepend = function(atm) {
	atm = yjd.atm.check(atm);
	this.elm.insertBefore(atm.elm, this.elm.firstChild);
	return this;
};

/**
 * Add specified element befor the node as sibling.
 * @param {yjd.atm|HTMLElement|string|number} atm yjd.atm object 
 * 	or translatable to be added.
 * @return {yjd.atm} The instance itself.
 */
yjd.atm.prototype.before = function(atm) {
	atm = yjd.atm.check(atm);
	this.elm.parentElement.insertBefore(atm.elm, this.elm);
	return this;
};

/**
 * Add specified element after the node as sibling.
 * @param {yjd.atm|HTMLElement|string|number} atm yjd.atm object 
 * 	or translatable to be added.
 * @return {yjd.atm} The instance itself.
 */
yjd.atm.prototype.after = function(atm) {
	atm = yjd.atm.check(atm);
	this.elm.parentElement.insertBefore(atm.elm, this.elm.nextSibling);
	return this;
};

/**
 * Remove the node from parent.
 * @return {yjd.atm} The instance itself.
 */
yjd.atm.prototype.remove = function() {
	if(!this.elm || !this.elm.parentElement) return this;
	this.elm.parentElement.removeChild(this.elm);
	return this;
};

/**
 * Set ot get value of input or textarea.
 * @param {string} [value] Value to set. omit to get value. 
 * @return {yjd.atm|string} The instance itself. Or, value of element if getting.
 */
yjd.atm.prototype.val = function(value) {
	if(value===undefined) {
		return this.atm.value;
	}
	this.atm.value = value;
	return this;
};

/**
 * Forcus.
 * @return {yjd.atm|string} The instance itself.
 */
yjd.atm.prototype.focus = function() {
	this.elm.focus();
	return this;
};

/**
 * Blur.
 * @return {yjd.atm|string} The instance itself.
 */
yjd.atm.prototype.blur = function() {
	this.elm.blur();
	return this;
};

/**
 * Click.
 * @return {yjd.atm|string} The instance itself.
 */
yjd.atm.prototype.click = function() {
	this.elm.click();
	return this;
};
/**
 * Replace the node with specified element on the parent.
 * @param {yjd.atm|HTMLElement|string|number} atm yjd.atm object 
 * 	or translatable to be placed.
 * @return {yjd.atm} The instance itself.
 */
yjd.atm.prototype.replaceWith = function(atm) {
	atm = yjd.atm.check(atm);
	this.elm.parentNode.replaceChild(atm.elm, this.elm);
	this.elm = null;
	return this;
};

/**
 * Switch clone of the node, or replace original with clone.
 * Use this to avoid DOM rendering and make it fast.
 * for example: <pre>
 * atm.switchClone(true);
 * for(var i in str) atm.appned(str[i]);
 * atm.switchClone(false);</pre>
 * @param {boolean} b_clone When true, create clone and replace with it
 * 	so operation on the instance becomes not to display.
 * 	When false, replace original node to the clone so operation results are applied.
 * @return {yjd.atm} The instance itself.
 */
yjd.atm.prototype.switchClone = function(b_clone) {
	if(b_clone) {
		this.org = this.elm;
		this.elm = yjd.atm( this.org.cloneNode(true) );
	} else {
		this.elm.parentNode.replaceChild(this.elm, this.org);
		this.elm = this.org;
		delete this.org;
	}
	return this;
};

/**
 * Set or get data in script tag.
 * @param {string} type Value of type of script tab like 'text/x-foo'
 * @param {string|Object|boolean} [data=true] data to be set when it is string or object. 
 * 	If boolean or omitted, it gets value then parse it as JSON when 'data' is true.
 * @return {yjd.atm|string|object|null|false} The instance itself when set.
 * Or, Data string or object gotten.
 * It returns null if specified type of script had not found.
 * It returns false if the data could not parse as JSON.
 */
yjd.atm.prototype.scriptData = function(type, data) {
	var selector = 'script[type="'+type+'"]';
	var elm = this.elm.querySelector(selector);
	if(!elm) return null;
	if(data===undefined || typeof data==='boolean') {
		var b_json = (data===undefined)? true: data;
		data = elm.innerText;
		if(b_json) data = yjd.jsonDecode(data);
		return data;
	}
	if(typeof data==='object') data = JSON.stringify(data, null, "\t");
	elm.innerText = data;
	return this;
};

/**
 * Bind event listner to the node.
 * This can also call as bind(event, func);
 * @param {string} s_event event type.
 * 	@see https://developer.mozilla.org/en-US/docs/Web/Events
 * @param {object} [o_this] Object to be set to 'this' in callback
 * @param {yjd.atm.bind.callback} func callback to be called when the event occurs.
 * @param {boolean} [capture=false] Use capture mode if true.
 * @return {yjd.atm.bind.handler} handler to use when unbind.
 */
yjd.atm.prototype.bind = function(s_event, o_this, func, capture) {
	if( typeof o_this==='function' ) {
		//  arguments are event, func, capture
		this.elm.addEventListener(s_event, o_this, func);
		return [this.elm, s_event, o_this, func ];
	}
	if(!o_this) o_this = this;
	if(!capture) capture=false;
	this.elm.addEventListener(s_event, onevent, capture);
	return [this.elm, s_event, onevent, capture ];

	function onevent(event){
		var atm = yjd.atm(event.currentTarget);
		var args = [ event, atm ];
		func.apply(o_this, args);
	}
};

/**
 * @typedef yjd.atm.bind.callback
 * @callback
 * @param {Event} event Event object.
 * @param {yjd.atm} atm Element on that event binded.
 */
/**
 * @typedef yjd.atm.bind.handler
 * @property {Node} 0 Node of HTML 
 * @property {string} 1 Event code
 * @property {function} 2 callback
 * @property {boolean} 3 capture 
 */

/**
 * Unbind event listner.
 * @param {yjd.atm.bind.handler} handler handler returned by bind
 */
yjd.atm.unbind = function(handler) {
	handler[0].removeEventListener(handler[1], handler[2], handler[3]);
};

/**
 * Toggle interface apperance by class and get on or off.
 * @param {string} [s_class='on'] class name.
 * @return {boolean} has the class or not.
 */
yjd.atm.prototype.toggle = function(s_class) {
	s_class = s_class || 'on';
	this.elm.classList.toggle(s_class);
	return this.elm.classList.contains(s_class);
};

/**
 * Class to handle a list of nodes.
 * @param {string|NodeList|yjd.atms|Node[]|yjd.atm[]} q selector string ,nodelist, 
 * 	yjd.atms object, or an array of nodes or yjd.atm.
 * @param {string|object|number} [context=document] Element or yjd.atm object for context node.
 * 	See @see yjd.atm .
 */
yjd.atms = function(q, context) {
	if(!(this instanceof yjd.atms)) {
		return new yjd.atms(q, context);
	}
	context = yjd.atm.contextElm(context);
	if(typeof q==='string') {
		this.elms = context.querySelectorAll(yjd.atm.cssEscape(q));
	} else if(typeof q==='object') {
		if(q instanceof NodeList) {
			this.elms = q;
		} if(q instanceof yjd.atms) {
			this.elms = q.elms;
		} if(q instanceof Array) {
			this.elms = [];
			for(var i in q) {
				if(q instanceof yjd.atms) {
					this.elms.push(q[i].elm);
				} else if(yjd.atm.likesElement(q[i])) {
					this.elms.push(q[i]);
				}
			}
		}
	}
};

/**
 * Loop and do function for each element.
 * It can also be called like atms.each(func);
 * In this case, yjd.atms object is set to be 'this'.
 * @param {Object} [o_this=yjd.atms] object to be set to 'this' in callback.
 * @param {string} [selector] Selector to select element.
 * @param {yjd.atms.each.callback} func callback to be called in loop.
 * @return {yjd.atm} The instance itself.
 */
yjd.atms.prototype.each = function(o_this, selector, func) {
	if(!this.elms || this.elms.length===0) return;
	if(arguments.length===1) {
		o_this = this;
		selector = undefined;
		func = arguments[0];
	} else if(arguments.length===2) {
		o_this = this;
		selector = arguments[0];
		func = arguments[1];
	}
	for(var i=0; i<this.elms.length; i++) {
		if(selector===undefined || this.elms[i].matches(selector)) {
			var atm = yjd.atm(this.elms[i]);
			if(false===func.call(o_this,atm)) break;
		}
	}
	return this;
};
/**
 * @typedef yjd.atms.each.callback
 * @callback
 * @param {yjd.atm} atm the Element
 * @return {boolean} if returns explicitly false, then exit loop.
 */

/**
 * Get number of items in.
 * @return {number} Number of items.
 */
yjd.atms.prototype.length = function() {
	if(!this.elms) return 0;
	return this.elms.length;
};

/**
 * Get (n)th element.
 * @param {number} n index of item starting zero. 
 * 	If nevative, it count from last.
 * @return {yjd.atm|false} specified indexed element.
 * Or, returns false 
 */
yjd.atms.prototype.item = function(n) {
	if(!this.elms || this.elms.length===0) return false;
	if(n<0) n = this.elms.length + n;
	var elm = this.elms[n];
	return new yjd.atm(elm);
};

/**
 * Get nodes matching query in the instance.
 * @param {string} selector Selector
 * @return {yjd.atms} nodes found.
 */
yjd.atms.prototype.find = function(selector){
	var elms = yjd.atm.getNodes(this.elms, selector);
	return new yjd.atms(elms, this);
};

/**
 * Scroll to show the element.
 * @todo This is experimental imprement. Do not work.
 * @param {Object|yjd.atm|string} [container=window] 
 * 	Container that has scroll bar and to be scrolled.
 * 
 */
yjd.atm.prototype.scrollTo = function (container) {
	if(container===undefined) {
		container = window;
	} else {
		container = yjd.atm.contextElm(container);
	}
	var rect = this.elm.getBoundingClientRect();
	var x = rect.left + container.pageXOffset + (rect.width - container.innerWidth)/2;
	var y = rect.top + container.pageYOffset + (rect.height - container.innerHeight)/2;
	container.scrollTo(x, y);
};

/**
 * Convert hyphnated string to camel cased.
 * @param {string} str String to convert.
 * @return {string} Converted string.
 */
yjd.atm.hyphen2camel = function(str) {
	return str.replace(/\-([a-z])/g, function(matched, p1){
		return p1.toUpperCase();
	});
};

/**
 * Convert camel cased string to hyphnated.
 * @param {string} str String to convert.
 * @return {string} Converted string.
 */
yjd.atm.camel2hyphen = function(str) {
	str = str.replace(/([A-Z])/g, function(matched){
		return '-'+matched.toLowerCase();
	});
	if(str.indexOf(0)==='-') str = str.substr(1);
	return str;
};

/** 
 * Convert Object to text of styles.
 * @param {Object} style object of styles wuth key:value pairs.
 * @return {string} String of styles.
 */
yjd.atm.getStyleText = function (obj) {
	var s_style = '';
	for(var prop in obj) {
		if(typeof obj[prop] ==='string' || typeof obj[prop] ==='number') {
			s_style += yjd.atm.camel2hyphen(prop) + ':' + obj[prop] + ';';
		}
	}
	return s_style;
};

/**
 * Convert text to object of styles with key:value pairs.
 * @param {string} style String of styles.
 * @param {boolean} [b_camel=false] Convert key to camel case if true.
 * @return {object} Object of styles.
 */
yjd.atm.getStyleObj = function(str, b_camel) {
	var obj = {};
	var rules = str.split(';');
	for(var i in rules) {
		if(rules[i].match(/^\s*([\w-]+)\s*:\s*(.+)$/)) {
			var key = b_camel? yjd.atm.hyphen2camel(RegExp.$1): RegExp.$1;
			obj[key] = RegExp.$2.trim;
		}
	}
	return obj;
};

/**
 * escape css special charactors
 * @todo is it needed?
 */
yjd.atm.cssEscape = function(str) {
	return str;
//    return str.replace(/([\.\:\(\)\{\}\[\]\\])/g, function(c){
//        return '\\'+c;
//    });
};

/**
 * Class of rectangle.
 * There are two I/F to create instance.
 * <ul><li>new yjd.atm.rect(x,y,w,h) :
 * 	create rectangle with x, y, width, height.</li>
 * 	<li>new yjd.atm.rect(atm, [context]) :
 * 	create rectangle with position and size of yjd.atm object.
 * 	if context is secified, top(), bottom(), left() and rgiht() are
 * 	calcurated as the element is in the context.</li>
 * </ul>
 * @constructor
 * @param {number|yjd.atm|yjd.atm.rect} x X. Or, element or rect to get area.
 * @param {number|yjd.atm|yjd.atm.rect} [y] Y when x specified by number. 
 * 	Or, element or rect to be context area.
 * @param {number|yjd.atm} [w] Width when x specified by number.
 * @param {number|yjd.atm} [h] Height when x specified by number.
 * @return {yjd.atm.rect} The instance.
 */
yjd.atm.rect = function(x,y,w,h) {
	var rect;
	if(!(this instanceof yjd.atm.rect)) {
		rect = new yjd.atm.rect(x,y,w,h);
	}
	if(typeof x!=='number') {
		if(x instanceof yjd.atm.rect) {
			this.x = x.x;
			this.y = x.y;
			this.w = x.w;
			this.h = x.h;
		} else {
			var atm = yjd.atm.check(x);
			if(atm) {
				rect = atm.elm.getBoundingClientRect();
				this.x = rect.left;
				this.y = rect.top;
				this.w = rect.width;
				this.h = rect.height;
			}
		}
	} else {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}
};

/**
 * Set context rect and original rect.
 * @param {yjd.arm.rect|yjd.atm} context Context to position value to set.
 * @param {yjd.arm.rect|yjd.atm} [org] Original position to calc new element values.
 * 	If omitted, takes this object.
 */
yjd.atm.rect.prototype.setContext = function(context, org) {
	if(org===undefined) org = this;
	if(!(org instanceof yjd.atm.rect)) org = new yjd.atm.rect(org);
	this.org = {
		top:	org.y,
		left:	org.x,
		bottom:	org.y + org.h -1,
		right:	org.x + org.w -1
	};
	if(context!==undefined) {
		context = new yjd.atm.rect(context);
		this.context = {
			x:		context.x,
			y:		context.y,
			w:		context.w,
			h:		context.h,
			top:	context.y,
			left:	context.x,
			bottom:	context.y + context.h -1,
			right:	context.x + context.w -1
		};
	}
};

/**
 * Set and get 'top' value.
 * If the instance has context, it returns value in context area.
 * @param {number|null} [value] Value of top in the context.
 * 	If null, set to vertical center of the context.
 * @return {string} Value of top.
 */
yjd.atm.rect.prototype.top = function(value) {
	if(value===null) value = (this.context.h - this.h) / 2;
	if(value!==undefined) this.y = this.context.top + value;
	return (this.y - this.org.top).toString()+'px';
};

/**
 * Set and get 'bottom' value.
 * If the instance has context, it returns value in context area.
 * @param {number|null} [value] Bottom value to set calcurated value to this.y.
 * 	If null, set to vertical center of the context.
 * @return {string} Value of bottom.
 */
yjd.atm.rect.prototype.bottom = function(value) {
	if(value===null) value = (this.context.h - this.h) / 2;
	if(value!==undefined) this.y = this.context.bottom - value - this.h + 1;
	return (this.org.bottom - this.y+this.h-1).toString()+'px';
};

/**
 * Set and get 'left' value.
 * If the instance has context, it returns value in context area.
 * @param {number|null} [value] Value to set this.x.
 * 	If null, set to horizontal center of the context.
 * @return {string} Value of left.
 */
yjd.atm.rect.prototype.left = function(value) {
	if(value===null) value = (this.context.w - this.w) / 2;
	if(value!==undefined) this.x = this.context.left + value;
	return (this.x - this.org.left).toString()+'px';
};

/**
 * Set and get 'right' value.
 * If the instance has context, it returns value in context area.
 * @param {number|null} [value] Right value to set calcurated value to this.x.
 * 	If null, set to horizontal center of the context.
 * @return {string} Value of right.
 */
yjd.atm.rect.prototype.right = function(value) {
	if(value===null) value = (this.context.w - this.w) / 2;
	if(value!==undefined) this.x = this.context.right - value - this.w + 1;
	return (this.org.right - this.x+this.w-1).toString()+'px';
};

/**
 * Shift rectangle.
 * @param {number|yjd.atm.rect} x Value to be added to this.x.
 * Or, rectangle to get relative position from.
 * @param {number} [y] Value to be added to this.y when x is number.
 * @return {yjd.atm.rect} the instnce itself.
 */
yjd.atm.rect.prototype.shift = function(x,y) {
	if(x instanceof yjd.atm.rect) {
		y = -x.y;
		x = -x.x;
	}
	this.x += x;
	this.y += y;
	return this;
};

/**
 * Check this covers specified area.
 * @param {number|yjd.atm.rect} x X. Or rect object.
 * @param {number} [y] Y.
 * @param {number} [w] Width.
 * @param {number} [h] Height.
 */
yjd.atm.rect.prototype.covers = function(x,y,w,h) {
	if(x instanceof yjd.atm.rect) {
		w = x.w; h = x.h; y = x.y; x = x.x;
	}
	if(x < this.x) return false;
	if(this.x+this.w < x+w) return false;
	if(y < this.y) return false;
	if(this.y+this.h < y+h) return false;
	return true;
};

/**
 * Get screen rect.
 * @param {yjd.atm} [atm] Element to nallow range. If omitted, returns window size.
 * @return {yjd.atm.rect} rectangle.
 */
yjd.atm.getScreenRect = function(atm) {
	var scr = new yjd.atm.rect(0,0,window.innerWidth,window.innerHeight);
	if(atm===undefined || !atm.elm) return scr;
	var rect = new yjd.atm.rect(atm);
	if(rect.x < scr.x) {
		rect.w -= (scr.x - rect.x);
		rect.x = scr.x;
	}
	if(rect.right()>scr.right()) {
		rect.w -= (scr.x + scr.w) - (rect.x + rect.w);
	}
	if(rect.y < scr.y) {
		rect.h -= (scr.y - rect.y);
		rect.y = scr.y;
	}
	if(rect.right()>scr.right()) {
		rect.h -= (scr.y + scr.h) - (rect.y + rect.h);
	}
	return rect;
};

//  add event listener for this lib.
window.addEventListener('load', function(){
	yjd.atm.ready(true);
}, false);
