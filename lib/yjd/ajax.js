/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview Ajax and Promise.
 * depend on yjd.base
 * @since  2017.05.06  initial coding.
 */

/**
 * Wrapper of Promise.
 * @constructor
 * @extends Promise<XMLHttpRequest,Error>
 * @param {*} libThis 'this' value in functions 'then' and 'error'. It is librery level.
 * @param {function} executor Function executor of Promise.
 * @param {yjd.Promise.callback} callback Callback function called after executed.
 */
yjd.Promise = function(libThis, executor, callback) {
	var the = this;
	this.result = null;
	this.userThen = null;
	this.userCallbacks = {};
	this.promise = new Promise(promise_executor);
	this.chain = this.promise.then( promise_done, promise_fail);
	//
	function promise_executor(resolve, reject) {
		executor.apply(libThis, arguments);
	}
	function promise_done(arg){
		this.result = true;
		this.resultValue = arg;
		callback.apply(libThis, [true, the, arg]);
		return arg;
	}
	function promise_fail(arg){
		this.result = false;
		this.resultValue = arg;
		callback.apply(libThis, [false, the, arg]);
		return arg;
	}
};
/**
 * @typedef yjd.Promise.callback
 * @desc In these function, @see yjd.Promise.prototype.userCall is may be called.
 * @callback
 * @param {boolean} result result of promise.
 * @param {yjd.Promise} promise The insetance
 * @param {?} args arguments of resolve or reject.
 */

/**
 * then.
 * @param {function} onFulfilled Function called after resolved in executor.
 * @param {function} onRejected Function called after rejected in executor.
 */
yjd.Promise.prototype.then = function (onFulfilled, onRejected) {
	return this.chain.then(onFulfilled, onRejected);
};

/**
 * catch.
 */
yjd.Promise.prototype.catch = function (reason) {
	return this.chain.catch(reason);
};

/**
 * Call user level callbacks.
 * It is called from library level promise_done.
 * User level callbacks ware set by @see yjd.Promise.prototype.registerCallback
 * or wrapper of it.
 * @param {string} catName 'done', 'fail' or 'always'.
 * @param {*} o_this 'this' value in user level 'done'.
 */
yjd.Promise.prototype.userCall = function (catName, o_this, args) {
	var param = this.userCallbacks[catName];
	if(!param) param = this.userCallbacks[catName] = {funcs:[]};
	param.this = o_this;
	param.args = args;
	param.done = true;
	for(var i in param.funcs) param.funcs[i].apply(o_this, args);
};

/**
 * Register user level callback functions.
 * These functions called from callback set at constructor via @see yjd.Promise.prototype.userCall.
 * @param {string} catName callback category name. ex. 'done', 'fail' or 'always'.
 * @param {function} callback 
 */
yjd.Promise.prototype.registerCallback = function (catName, callback) {
	var param = this.userCallbacks[catName];
	if(!param) param = this.userCallbacks[catName] = {done:false, funcs:[]};
	if(param.done) callback.apply(param.this, param.args);
	else param.funcs.push(callback);
	return this;
};

/**
 * Register interface to regiter user level callbacks.
 * Makes wrapper of @see yjd.Promise.prototype.registerCallback .
 * @param {string|string[]} catName Category name or array of these.
 * 	Ex. 'done', 'fail' or 'always'.
 */
yjd.Promise.prototype.registerInterface = function (catName) {
	if(typeof catName==='string') catName = [catName];
	for(var i in catName) {
		var name = catName[i];
		this[name] = function(callback) {	// jshint ignore:line
			this.registerCallback(arguments.callee.category, callback);
			return this;
		};
		this[name].category = name;
	}
};
/**
 * @typedef yjd.Promise.interface
 * @param {...?} arguments Set parameters in library level callback.
 * @return {yjd.Promise} the instance itself.
 */

/**
 * all.
 * 
 */
yjd.Promise.all = function () {
	var prms = [];
	for(var i=0; i<arguments.length; i++) {
		for(var j in arguments[i]) {
			var arg = arguments[i][j];
			if(arg instanceof Promise) prms.push(arg);
			else if(arg instanceof yjd.Promise) prms.push(arg.promise);
		}
	}
	return Promise.all(prms);
};


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
 * @return {yjd.ajax.return} yjd.Promise object. Some methids are added. 
 */
yjd.ajax = function(options, o_this) {
	if(typeof options==='string') options = { url: options };
	var info = yjd.extend({}, yjd.ajax.default, options);
	info.userThis = o_this || info;
	info.name = yjd.urlInfo(info.url).filename || info.url;
	var promise = new yjd.Promise(info, ajaxPromise, promiseDone);
	promise.registerInterface(['done', 'fail', 'always']);
	if(info.success) promise.done(info.success);
	if(info.error) promise.fail(info.error);
	if(info.complete) promise.always(info.complete);
	return promise;
	//
	function ajaxPromise(resolve, reject) {
		var xhr = new XMLHttpRequest();
		this.xhr = xhr;
		xhr.timeout = this.timeout;
		xhr.onreadystatechange = function statechange() {
			if(xhr.readyState===4) {
				if(200<=xhr.status && xhr.status<300) {
					resolve(xhr);
				}
				if(window.location.protocol==='file:' && xhr.status===0) {
					if(xhr.responseText.length===0) {
						reject( new Error(
							'Local file length is zero. Or it could not be read.'
						));
					}
					xhr.status = 200;
					resolve(xhr);
				}
				reject(new Error(xhr.statusText));
			}
		}
		xhr.open(this.method, this.url, this.async, this.username, this.password);
		xhr.setRequestHeader('content-type', this.contentType);
		for(var key in this.headers) {
			xhr.setRequestHeader(key, this.headers[key]);
		}
		if(typeof this.data ==='object' && this.processData) {
			this.data = yjd.ajax.encodeToForm(this.data);
		}
		if(this.beforeSend) {
			if(false===this.beforeSend.call(this.userThis, xhr)) {
				reject(new Error("Stoped by beforeSend."));
			}
		}
		var rep = xhr.send(this.data);
	}
	//
	function promiseDone(result, promise, arg){
		xhr = this.xhr;
		if(result) {
			promise.userCall('done', this.userThis, [ xhr.responseText, xhr.status, xhr ]);
			promise.userCall('always', this.userThis, [ xhr, xhr.status ]);
		} else {
			promise.userCall('fail', [ xhr, xhr.status, arg ]);
			promise.userCall('always', [ xhr, xhr.status ]);
		}
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
 * @typedef yjd.ajax.return
 * @extends yjd.Promise
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
