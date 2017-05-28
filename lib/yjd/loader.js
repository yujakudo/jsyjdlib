/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview Class to find directive, load content 
 * and replace directive with content.
 * @since  2017.04.07  initial coding.
 */

/**
 * constructor
 */
yjd.Loader = function() {
	/** Filters of contnt. @type {object}　*/
	this.filters = {};
	/** Que of items to load. @type {yjd.Loader.item[]} */
	this.que = [];
	/** Number of items in the que. @type {number} */
	this.quedNum = 0;
	/** Callback function to be called when finish loading. @type {function} */
	this.finCallback = null;
	/** Que for errors. @type {string[]} */
	this.errors = [];

	this.setFilter('loader', this.doFilter);
};
/**
 * @typedef yjd.Loader.item
 * @desc Type of item for resource.
 * @property {string} url URL of the resource.
 * @property {string} type MIME Type of the resource.
 * @property {yjd.atm} atm Element to replace with the resource.
 * @property {boolean|null} result Result of loading. true: success, false:fail, null:other.
 * @property {string} data Data of resource when seccess.
 * @property {string} message Message when failed.
 */

/**
 * Set filter function.
 * function must take 2args as '({any}fiter_data, {string}data-type)'.
 * the function is called after loaded successfuly.
 * @param {string} name name of filter
 * @param {function} func filter function.
 */
yjd.Loader.prototype.setFilter = function(name, func) {
	this.filters[name] = func;
};

yjd.Loader.prototype.doFilter = function(data, type) {
	var type = yjd.typeInfo(data.type).synonym;
	if(type==='html') {
		this.parseHtml(data);
	}
};

/**
 * Enque item to load
 * @param {string|yjd.Loader.item} item String of resource's URL, or object of que item.
 * 	Following arguments are evaluated only when item is string.
 * @param {string} [type] Resource type. Defalult is 'text'.
 * @param {object} [atm] node element to replace with html. Default is null.
 */
yjd.Loader.prototype.enque = function(item, type, atm) {
	if(typeof item === 'string') {
		item = { url:item };
		if(type) item.type = type;
		if(atm) item.atm = atm;
	}
	item = yjd.extend({}, {
		url:'', type:'text', atm:null, result:null, data:null, message:''
	}, item);
	this.que.push(item);
	this.quedNum++;
};

/**
 * Clear.
 */
yjd.Loader.prototype.clear = function() {
	this.que = [];
	this.errors = [];
};

/**
 * Start loading.
 * @param {Object} [o_this] value to be set 'this' in the callback.
 * @param {callback} callback Callback function called when finish loading.
 * 		it take an argument of boolean to show success or NG.
 * @param {boolean} [b_html_parse] If true, parses HTML of the page and enques directions.
 */
yjd.Loader.prototype.startLoading = function(o_this, callback, b_html_parse) {
	if(typeof o_this==='function') {
		b_html_parse = callback;
		callback = o_this;
		o_this = undefined;
	}
	if(b_html_parse) this.parseHtml();
	if(callback) this.finCallback = callback;
	this.finCallback.this = this;
	if(o_this)	this.finCallback.this = o_this;
	for(var i in this.que) {
		this.loadItem(i);
	}
};
/**
 * 	@typedef yjd.Loader.finishCallback
 * @desc Type of callback function to be called when finish loading.
 * @callback
 * @param {boolean} result True when success all qued loading. Or, false when fail.
 * @param {yjd.Loader.item[]} que Items for resources.
 */

/**
 * load each item.
 * @protected
 * @param {number} idx index of que.
 */
yjd.Loader.prototype.loadItem = function(idx) {
	var item = this.que[idx];
	if(!item || item.result) return;
	yjd.ajax(item.url, this)
	.done(function(data, status, xhr){
		item.data = data;
		item.result = true;
	}).fail(function(xhr, status, err) {
		item.result = false;
		item.message = err.message;
	}).always(function(){
		if(--this.quedNum===0) this.finishLoading();
	});
};

/**
 * Procedure when finish loading.
 * @protected
 */
yjd.Loader.prototype.finishLoading = function() {
	var b_res = true;
	for(var i in this.que) {
		var item = this.que[idx];
		if(!item) continue;
		if(!item.result) {
			b_res = false;
			continue;
		}
		if(item.atm) {
			var pre = '', post = '';
			if(item.options.envelope) {
				pre = item.options.envelope;
				if(pre.match(/^<(\w)(\s+[^>]*)?>$/)) {
					post = '</'+RegExp.$1+'>';
				} 
			}
			item.atm.replaceWith(pre+item.data+post);
		}
	}
	if(this.finCallback) {
		this.finCallback.call(this.finCallback.this, b_res, this.que);
	}
};

/**
 * Parse the HTML and enque to load.
 * @param {object} context element to parse. default is document.
 * @return {boolean} result of parse.
 */
yjd.Loader.prototype.parseHtml = function(context) {
	var loader = this;
	if(context===undefined) context = document;
	yjd.atms('script[type="text/x-yjd-loader"]', context).each(function(atm){
		var text = atm.text();
		var data = null;
		try {
			data = JSON.parse(text);
		} catch(e) {
			msg = 'JSON parse error: <pre>'+text+'</pre>';
			atm.replaceWith('<div class="error">'+msg+'</div>');
			this.errors.push(msg);
			return;
		}
		var type = yjd.typeInfo(data.type).synonym;
		if(type==='javascript' && data.envelope===undefined) data.envelope = '<script>';
		if(type==='css' && data.envelope===undefined) data.envelope = '<style>';
		data.atm = atm;
		loader.enque(data);
	});
	return true;
};

/**
 * Get element to show errors.
 * @return {yjd.atm} element to show errors.
 */
yjd.Loader.prototype.getErrorAtm = function() {
	var atm_list = yjd.atm('<ul></ul>');
	for(var i in this.errors) {
		atm_list.append('<li class="error">'+this.errors[i]+'</li>');
	}
	for(i in this.que) {
		var item = this.que[i];
		if(item.result!==false) continue;
		atm_list.append('<li class="error">'+item.message+'</li>');
	}
	return atm_list;
};

/**
 * Retry load for errors.
 * Callback function and 'this' value remain when startLoading.
 */
yjd.Loader.prototype.retry = function() {
	this.quedNum = 0;
	for(var i in this.que) {
		var item = this.que[i];
		if(!item.result) {
			item.result = null;
			item.message = '';
			this.quedNum++;
		}
	}
	for(var i in this.que) {
		this.loadItem(i);
	}
};
