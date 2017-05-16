/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview fundamental of yjd lib.
 * @since  2017.05.06  initial coding.
 */

var yjd = {};

/**
 * copy properties from objects to subject.
 * this can take multiple arguments.
 * @param {object} obj source object.
 * @return this
 */
yjd.extend = function(subject, obj) {
    for(var i=1; i<arguments.length; i++) {
        obj = arguments[i];
        if(typeof obj !=='object') continue;
        for( var prop in obj) {
            if( (typeof obj[prop] === 'object') && obj[prop]!==null && obj[prop].constructor===Object) {
                if(subject[prop]===null || typeof subject[prop] !== 'object') subject[prop] = {};
                yjd.extend( subject[prop], obj[prop]);
            } else {
                subject[prop] = obj[prop];
            }
        }
    }
    return subject;
};

/**
 * HTML escape
 * @param {str} string
 */
yjd.htmlEscape = function(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/`/g, '&#x60;');
};

/**
 * create element from string
 * @param {string|string[]} str HTML string
 * @param {element}
 */
yjd.createElementFromStr = function(str) {
    if(str instanceof Array) str = str.join();
    var node = document.createElement('div');
    node.innerHTML = str;
    return node.children[0];
};

/**
 * get absolute URL
 * if baseurl is not spesified, document url is reffered.
 * @param {string} url URL
 * @param {string} baseurl URL. optional.
 * @return {string} absolute URL
 */
yjd.getAbsoluteUrl = function(url, baseurl) {
    if(url.match('://'))    return url;
    if(baseurl===undefined) {
        var anchor = document.createElement('a');
        anchor.href = url;
        return anchor.href;
    }
    while(url.substr(0,2)==='./')   url = url.substr(2);
    baseurl = baseurl.substr(0, baseurl.lastIndexOf('/')+1);
    while(url.substr(0,3)==='../') {
        url = url.substr(3);
        baseurl = baseurl.substr(0, baseurl.length-1);
        baseurl = baseurl.substr(0, baseurl.lastIndexOf('/')+1);
    }
    return baseurl+url;
};

/**
 * extract URL and get those.
 * if following URL were passed,
 * 'http://user:pass@www.example.com:8000/path/to/index.html?param=value#place'
 * it returned : {
 *  scheme :    'http',
 *  authority:  'user:pass@www.example.com:8000',
 *  path:       '/path/to/index.html',
 *  query:      'param=value',
 *  fragment:   'place',
 *  user:       'user',
 *  password:   'pass',
 *  host:       'www.example.com',
 *  port:       '8000',
 *  dir:        '/path/to',
 *  filename:   'index.html',
 *  filebody:   'index',
 *  ext:        'html'
 * }
 * @param {string} url absolute URL
 * @return {object|false} extracted object. or false when fail.
 */
yjd.urlInfo = function(url) {
    if(!url.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/)) return false;
    var rep = {};
    rep.scheme = RegExp.$2;
    rep.authority = RegExp.$4;
    rep.path = RegExp.$5;
    rep.query = RegExp.$7;
    rep.fragment = RegExp.$9;
    if(rep.authority.match(/^(([^:@]+):([^:@]+)@)?([^:@]+)(:(\d+))?$/)) {
        rep.user = RegExp.$2;
        rep.password = RegExp.$3;
        rep.host = RegExp.$4;
        rep.port = RegExp.$6;
    }
    if(rep.path.match(/(\/([^\/]+))$/)) {
        rep.dir = RegExp.leftContext;
        rep.filename = RegExp.$2;
        if(rep.filename.match(/(\.([^\.]+))$/)) {
            rep.filebody = RegExp.leftContext;
            rep.ext = RegExp.$2;
        }
    }
    return rep;
};

/**
 * wrapper of setTimeout to pass 'this' value.
 * @param {*} o_this value of 'this' in callback.
 * @param {function} callback callback function
 * @param {number} delay delay time in millisecond
 * @param {...*} arguments to be passed callback
 */
yjd.timeout = function(o_this, callback, delay) {
    var args = Array.prototype.splice.call(arguments, 3);
    setTimeout(timeout, delay);
    function timeout() {
        callback.apply(o_this, args);
    }
};

/**
 * extend from parent class.
 * this function add two properies.
 * o_this.prototype.parentClass keeps parent class
 * o_this.parent is protype of parent class to call parent method.
 * @param {function} child constructor of class to inherit
 * @param {function} parent constructor of parent to be extended
 */
yjd.extendClass = function(child, parent) {
    yjd.extend(child.prototype, parent.prototype);
    child.prototype.parentClass = parent;
    child.parent = parent.prototype;
};

/**
 * inherit some mthods.
 * @param {function} child constructor of class to inherit
 * @param {function} parent constructor of parent to be extended
 * @param {string[]} methods array of mames of methods to be inherited
 */
yjd.useMethods = function(child, parent, methods) {
    for(var i in methods) {
        var func = methods[i];
        child.prototype[func] = parent.prototype[func];
        yjd.extend(child.prototype[func], parent.prototype[func]);
    }
};

/**
 * call same named method for each objects.
 * @param {string[]} objs array of objects
 * @param {string|string[]|number|number[]|null} idxes indexes of objs.
 * if empty, all object's method is called.
 * @param {string} method name of method
 * @param {object} o_this passed object as 'this'. if null, each object is set.
 * @param {*[]} args arguments of method calls
 */
yjd.eachCall = function(objs, idxes, method, o_this, args) {
    var a_this = o_this;
	if(idxes || idxes===0) {
		if(typeof idxes!=='object') idxes=[idxes];
		for(var i in idxes) callMethod(idxes[i]);
		return;
	}
    for(var idx in objs) callMethod(idx);
	//
	function callMethod(idx) {
        if(!o_this) a_this = objs[idx];
        objs[idx][method].apply(a_this, args);
	}
};

/**
 * create methods to call each poroperty method as same name.
 * @param {function} a_class constructor of class
 * @param {string} prop proerty name to hold objects.
 * @param {string[]} methods array of names 
 */
yjd.createEachCallMethods = function(a_class, prop, methods) {
    for(var i in methods) {
        var method = methods[i];
        a_class.prototype[method] = function(idx) { // jshint ignore:line
			var the = arguments.callee;
            yjd.eachCall(the.properties, idx, the.methodName, null, arguments);
			if(the.after) the.after();
        };
		a_class.prototype[method].methodName = method;
		a_class.prototype[method].properties = a_class[prop];
    }
};

/**
 * virtual class
 * this has get and set interface.
 */
yjd.obj = function(){};

/**
 * get data by path.
 * @param {string} path data path separated by '/'.
 */
yjd.obj.prototype.get = function (path) {
    var ar_path = path.split('/');
    var obj = this;
    for(var prop in ar_path) {
        if(obj[prop]===undefined) break;
        obj = obj[prop];
    }
    return obj;
};

/**
 * set data by path.
 * @param {string} path data path separated by '/'.
 */
yjd.obj.prototype.set = function (path, value) {
    var ar_path = path.split('/');
    var obj = this;
    var prop;
    for(var i=0; i<ar_path.length-1; i++) {
        prop = ar_path[i];
        if(obj[prop]===null || (typeof obj[prop]!=='object' && typeof obj[prop]!=='function')) {
            obj[prop] = {};
        }
        obj = obj[prop];
    }
    prop = ar_path[i];
    obj[prop] = value;
};

/**
 * explicitly release properties
 */
yjd.obj.prototype.destroy = function() {
    for(var prop in this) {
		if(typeof this[prop]==='string' || typeof this[prop]==='number' ||
        	typeof this[prop]==='boolean' || this[prop].constructor===Object) {
            delete this[prop];
        }
    }
};
