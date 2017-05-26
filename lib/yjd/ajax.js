/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview Ajax.
 * depend on yjd.base
 * @since  2017.05.06  initial coding.
 */


/**
 * Ajax.
 * @example Simply it can be used as :<pre>
 * yjd.ajax("http://url.to.get/", this)
 * .done(function(receiedText){
 *  //  Process of success.
 * }).fail(function(xhr, status, err){
 *  console.log(err.message);
 * });</pre>
 * @example It can also used with options like :<pre>
 * var promise = yjd.ajax({
 *  methid: 'POST',
 *  data: { key1: 'value1', key2: 'value2' },
 *  timeout: 20 * 1000
 * }, this);</pre>
 * @param {Object|string}　options options or URL string.
 * @param {string} [options.method='GET'] HTTP method. ex. 'GET', 'POST', 'PUT', 'DELETE'.
 * @param {string} options.url URL.
 * @param {boolean} [options.async=true] Asynchronous processing if true, or syncronous.
 * @param {string} [options.username] User name for BASIC authentication.
 * @param {string} [options.password] Password for BASIC authentication.
 * @param {string} [options.contentType='application/x-www-form-urlencoded; charset=UTF-8'] Content Type.
 * @param {Object} [options.headers] Additional HTTP headers. it has key:value pare.
 * @param {string|Object} [options.data] Request content to send. Object would be processed.
 * @param {boolean|function} [options.processData=ture] Encode data if ture.
 * @param {number} [options.timeout=0] timeout msec. if 0, it does not timeout.
 * @param {yjd.ajax.beforeSend} [options.beforeSend] Ths callback to be called before send.
 * @param {yjd.ajax.success} [options.success] Ths callback to be called when success.
 * @param {yjd.ajax.error} [options.error] Ths callback to be called when error occured.
 * @param {yjd.ajax.complete} [options.error] Ths callback to be called after success or error callback.
 * @param {Object} [o_this] The object to be set to 'this' in callbacks. default is the oject of options.
 * @return {yjd.ajax.Promise} Promise object. Some methids are added. 
 */
yjd.ajax = function(options, o_this) {
	if(typeof options==='string') options = { url: options };
	options = yjd.extend({}, yjd.ajax.default, options);
	if(!o_this) o_this=options;
	var name = yjd.urlInfo(options.url).filename || options.url;
	var xhr = new XMLHttpRequest();
	var promise = new Promise(ajaxPromise);
	function ajaxPromise(resolve, reject){
		xhr.timeout = options.timeout;
		xhr.onreadystatechange = statechange;
		function statechange() {
			if(xhr.readyState===4) {
				if(200<=xhr.status && xhr.status<300) {
					resolve(xhr);
				}
				if(window.location.protocol==='file:' && xhr.status===0) {
					xhr.status = 200;
					resolve(xhr);
				}
				reject(new Error(xhr.statusText));
			}
		}
		xhr.open(options.method, options.url, options.async, options.username, options.password);
		xhr.setRequestHeader('content-type', options.contentType);
		for(var key in options.headers) {
			xhr.setRequestHeader(key, options.headers[key]);
		}
		if(typeof options.data ==='object' && options.processData) {
			options.data = yjd.ajax.encodeToForm(options.data);
		}
		if(options.beforeSend) {
			if(false===options.beforeSend.call(options, xhr)) {
				reject(new Error("Stoped by beforeSend."));
			}
		}
		var rep = xhr.send(options.data);
	}

	var result = {
		result: null,
		done: [], fail: [], always: []  //  functions
	};
	if(options.success) result.done.push(options.success);
	if(options.error) result.fail.push(options.error);
	if(options.complete) result.always.push(options.complete);

	promise.then( promise_then, promise_error);
	function promise_then(){
		if(window.location.protocol==='file:' && xhr.responseText.length===0) {
			promise_error(new Error('Local file length is zero. Or it could not be read. :'+name));
			return;
		}
		result.result = true;
		result.arguments = [ xhr.responseText, xhr.status, xhr ];
		for(var i in result.done) result.done[i].apply(o_this, result.arguments);
		for(i in result.always) result.always[i].call(o_this, xhr, xhr.status);
	}
	function promise_error(err){
		result.result = false;
		result.arguments = [ xhr, xhr.status, err ];
		for(var i in result.fail) result.fail[i].apply(o_this, result.arguments);
		for(i in result.always) result.always[i].call(o_this, xhr, xhr.status);
		console.log(err);
	}
	promise.done = promise_done;
	promise.fail = promise_fail;
	promise.always = promise_always;
	return promise;
	
	function promise_done(callback) {
		if(result.result===true) callback.apply(o_this, result.arguments);
		else result.done.push(callback);
		return promise;
	}
	function promise_fail(callback) {
		if(result.result===false) callback.apply(o_this, result.arguments);
		else result.fail.push(callback);
		return promise;
	}
	function promise_always(callback) {
		if(result.result!==null) callback.call(o_this, xhr, xhr.status);
		else result.always.push(callback);
		return promise;
	}
};

/**
 * @typedef yjd.ajax.beforeSend
 * @callback
 * @param {XMLHttpRequest} xhr XMLHttpRequest object.
 * @return {boolean} if false, stops to send and throws error.
 */
/**
 * @typedef yjd.ajax.success
 * @callback
 * @param {string} responseText Received content. XMLHttpRequest.responseText.
 * @param {string} status XMLHttpRequest.status. ex. '200'.
 * @param {XMLHttpRequest} xhr XMLHttpRequest object.
 */
/**
 * @typedef yjd.ajax.error
 * @callback
 * @param {XMLHttpRequest} xhr XMLHttpRequest object.
 * @param {string} status XMLHttpRequest.status. ex. '500'.
 * @param {Error} An error object to be throwed. It might be program error.
 */
/**
 * @typedef yjd.ajax.complete
 * @callback
 * @param {XMLHttpRequest} xhr XMLHttpRequest object.
 * @param {string} status XMLHttpRequest.status. ex. '500'.
 */
/**
 * @typedef yjd.ajax.Promise	xhr, xhr.status, err
 * @extends Promise<XMLHttpRequest,Error>
 * @property {function(callback: yjd.ajax.success)} done 
 *  Set function to be called when success.
 * @property {function(callback: yjd.ajax.error)} fail 
 *  Set function to be called when error occured.
 * @property {function(callback: yjd.ajax.complete)} always 
 *  Set function to be called after success and error callback.
 */

/**
 * Encode object to string of form
 * @param {Object} object to encode.
 * @return {string} Encoded string.
 */
yjd.ajax.encodeToForm = function(obj) {
	var str = '';
	for(var prop in obj ) {
		str += ((str!=='')? '&': '') +
			encodeURIComponent(prop) +
			'=' + encodeURIComponent( obj[prop] );
	}
	return str.replace( /%20/g, '+' );
};

/**
 * Default values of ajax options.
 */
yjd.ajax.default = {
		method: 'GET',  //  GET, POST, PUT, DELETE
		url:    '',     //  URL
		async:  true,  //  asyncronus
		username:   '', //  user
		password:   '', //  password
		contentType:    'application/x-www-form-urlencoded; charset=UTF-8',    //  content-type
		headers:    {},     //  headers
		data:   null,     //  {string|object}
		processData:    true,   //  proc to convert form string
		timeout:    0,  //  timeout msec
		beforeSend :    null,
		success:    null,
		error:  null,
		complete:   null,   //  function(xhr, status)
};

/**
 * Overwrite default options for ajax.
 * Values of parameters not specified are kept. 
 * @param {Object|string} options Options. if string, it is handled as key.
 * @param {*} [value] value if options is string.
 */
yjd.ajax.setDefault = function(options, value) {
	if(typeof options==='string') {
		var key = options;
		options = {};
		options[key] = value;
	}
	yjd.extend(yjd.ajax.default, options);
};

/**
 * Wrapper of promise.
 * @constructor
 * @param {*} o_this 'this' value in functions 'then' and 'error'.
 * @param {function} executor Function executor of Promise.
 * @param {function} [then] Function called after resolved in executor.
 * @param {function} [error] Function called after rejected in executor.
 */
yjd.ajax.Promise = function(o_this, executor, then, error) {
	var the = this;
	this.this = o_this;
	this.result = null;
	this.done = [];
	this.fail = [];
	this.always = [];
	this.then = then;
	this.error = error;
	this.promise = new Promise(promise_executor).then( promise_then, promise_error);
	//
	function promise_executor(resolve, reject) {
		executor.apply(the.this, arguments);
	}
	function promise_then(){
		if(the.then) the.then.apply(the.this, arguments);
		else the.setResult(true, o_this);
		the.finish();
	}
	function promise_error(){
		if(the.error) the.error.apply(the.this, arguments);
		else the.setResult(false, o_this);
		the.finish();
	}
};

/**
 * Overwrite then.
 * @param {function} then Function called after resolved in executor.
 * @param {function} error Function called after rejected in executor.
 */
yjd.ajax.Promise.prototype.then = function (then, error) {
	this.then = then;
	this.error = error;
};

/**
 * Set execution result.
 * It is called from functions 'then' or 'error'.
 * @param {boolean} result result.
 * @param {*} o_this 'this' value in callbacks 'done', 'fail' and 'always'.
 * @param {*[]} args arguments to call 'done' or 'fail'.
 * @param {*[]} argsAlways arguments to call 'always'.
 */
yjd.ajax.Promise.prototype.setResult = function (result, o_this, args, argsAlways) {
	this.result = result;
	this.arguments = { this: o_this, always: argsAlways };
	if(result) this.arguments.done = args;
	else this.arguments.fail = args;
};

/**
 * Procedure when finish with success or fail.
 * Call each registered functions.
 * @private
 */
yjd.ajax.Promise.prototype.finish = function () {
	var i;
	var args = this.arguments;
	if(this.result) {
		for(i in this.done) this.done[i].apply(args.this, args.done);
		for(i in this.always) this.always[i].apply(args.this, args.always);
	} else {
		if(args.fail[0] instanceof Error) console.log(args.fail[0]);
		for(i in this.fail) this.fail[i].apply(args.this, args.fail);
		for(i in this.always) this.always[i].apply(args.this, args.always);
	}
};

/**
 * Register function to be called when success.
 * @param {function} callback Callback function.
 * @return {yjd.ajax.Promise} the instance.
 */
yjd.ajax.Promise.prototype.done = function (callback) {
	var args = this.arguments;
	if(this.result===true) callback.apply(args.this, args.done);
	else this.done.push(callback);
	return this;
};

/**
 * Register function to be called when fail.
 * @param {function} callback Callback function.
 * @return {yjd.ajax.Promise} the instance.
 */
yjd.ajax.Promise.prototype.fail = function (callback) {
	var args = this.arguments;
	if(this.result===false) callback.apply(args.this, args.fail);
	else this.fail.push(callback);
	return this;
};

/**
 * Register function to be called when finished after done or fail.
 * @param {function} callback Callback function.
 * @return {yjd.ajax.Promise} the instance.
 */
yjd.ajax.Promise.prototype.always = function (callback) {
	var args = this.arguments;
	if(this.result!==null) callback.apply(args.this, args.always);
	else this.always.push(callback);
	return this;
};
