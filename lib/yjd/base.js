/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview fundamental of yjd lib.
 * @since  2017.05.06  initial coding.
 */

/**
 * @namespace yjd
 */
var yjd = {};

/**
 * Copy properties from objects to subject.
 * Objects created by {} are deeply cloned. but other instances are copied.
 * @param {Object} subject Object to be overwritten and rturnd.
 * @param {...Object} obj Object in that prperties are cloned or copied.
 * @return {Object} subject.
 */
yjd.extend = function(subject, obj) {
    for(var i=1; i<arguments.length; i++) {
        obj = arguments[i];
        if(typeof obj !=='object') continue;
        for( var prop in obj) {
            if(!obj.hasOwnProperty(prop)) continue;
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
 * HTML escape.
 * @param {str} string string to escape.
 * @return Escaped string.
 */
yjd.htmlEscape = function(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/`/g, '&#x60;');
};

/**
 * HTML unescape.
 * @param {str} string string to unescape.
 * @return Unescaped string.
 * @todo digit or hex
 */
yjd.htmlUnescape = function(str) {
    return str.replace(/\&amp;/g, '&').replace(/\&lt;/g, '<').replace(/\&gt;/g, '>')
            .replace(/\&quot;/g, '"').replace(/\&#x27;/g, "'").replace(/&#x60;/g, '`');
};

/**
 * Create element from string.
 * @param {string|string[]} str HTML string
 * @param {element}
 */
yjd.createElementFromStr = function(str) {
    if(str instanceof Array) str = str.join();
//    var node = document.createDocumentFragment();
   var node = document.createElement('div');
    node.innerHTML = str;
    return node.children[0];
};

/**
 * Get absolute URL
 * If baseurl is not specified, document URL is refered.
 * @param {string} url relative or absolute URL.
 * @param {string} [baseurl] base URL.
 * @return {string} absolute URL.
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
 * @typedef yjd.urlInfo.return
 * @example Following URL is extranted to each part.
 * 'http://user:pass@www.example.com:8000/path/to/index.html?param=value#place'
 * @type {Object}
 * @property {string} scheme Scheme part before ':', like 'http'.
 * @property {string} authority Authority part after '//', like 'user:pass@www.example.com:8000'.
 * @property {string} path URL path, like '/path/to/index.html',
 * @property {string} query Query part after '?', like 'param=value',
 * @property {string} fragment Fragment part after '#', like 'place',
 * @property {string} [user] Username if authority contains, like 'user',
 * @property {string} [password] Password if authority contains, like 'pass',
 * @property {string} [host] Host and domain if authority contains, like 'www.example.com',
 * @property {string} [port] Port if authority contains, like '8000',
 * @property {string} [dir] Path to directory if path contains, like '/path/to',
 * @property {string} [filename] Last part of path if path contains, like 'index.html',
 * @property {string} [filebody] Body of filename if filename is, like 'index',
 * @property {string} [ext] Extension of filename if filename contains, like 'html'
 */
/**
 * Extract URL and get those.
 * @param {string} url URL.
 * @return {yjd.urlInfo.return|false} extracted object. or false when fail.
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
 * Extract MIME type.
 * @param {string} type MYME type
 * @return {Object} information.
 * @property {string} top Top level type.
 * @property {string} [next] Second level type if the type has.
 * @property {string} synonym Short part to represent type.
 *  Almost second level type removed prefix 'x-'. Or, top level if it is not sepalated by '/'.
 */
yjd.typeInfo = function(type) {
    var rep  = { top: type, synonym: type };
    var pos = type.indexOf('/');
    if(pos>=0) {
        rep.top = type.substr(0,pos);
        rep.next = type.substr(pos+1);
        rep.synonym = rep.next;
    }
    if(rep.synonym.substr(0,2)==='x-') rep.synonym = rep.synonym.substr(2);
    rep.synonym = rep.synonym.toLowerCase();
    return rep;
}

/**
 * Wrapper of setTimeout to pass 'this' value.
 * @param {*} o_this value of 'this' in callback.
 * @param {function} callback callback function
 * @param {number} delay delay time in millisecond
 * @param {...*} arguments to be passed to callback
 */
yjd.timeout = function(o_this, callback, delay) {
    var args = Array.prototype.splice.call(arguments, 3);
    setTimeout(timeout, delay);
    function timeout() {
        callback.apply(o_this, args);
    }
};

/**
 * Extend from parent class.
 * This function add two properies.
 * o_this.prototype.parentClass keeps parent class
 * o_this.parent is protype of parent class to call parent method.
 * @param {function} child Constructor of class to inherit
 * @param {function} parent Constructor of parent to be extended
 */
yjd.extendClass = function(child, parent) {
    yjd.extend(child.prototype, parent.prototype);
    child.prototype.parentClass = parent;
    child.parent = parent.prototype;
};

/**
 * Inherit some mthods.
 * @param {function} child Constructor of class to inherit
 * @param {function} parent Constructor of parent to be extended
 * @param {string|string[]} methods Name of method to be inherited or array of these.
 */
yjd.useMethod = function(child, parent, methods) {
    if(typeof methods==='string') methods = [ methods ];
    for(var i in methods) {
        var func = methods[i];
        child.prototype[func] = parent.prototype[func];
        yjd.extend(child.prototype[func], parent.prototype[func]);
    }
};

/**
 * Call same named method in each instances.
 * @param {string[]} objs Array of instances.
 * @param {string|string[]|number|number[]|null} idxes 
 *  Index of objs of that method is called. Or, array of those.
 *  If null, all object's methods are called.
 * @param {string} method Name of method
 * @param {object} o_this Object to be set as 'this' in methods. 
 *  if null, each object(objs[idx]) is set.
 * @param {*[]} args arguments of method
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
 * Create methods to call same named methods of each instance in the property.
 * @param {function} a_class Constructor of class
 * @param {string} prop Proerty name to hold instances.
 * @param {string[]} methods Array of method names.
 */
yjd.createEachCallMethods = function(a_class, prop, methods) {
    for(var i in methods) {
        var method = function() { // jshint ignore:line
			var the = arguments.callee.yjdCallee;
            var data = this[the.prop];
            yjd.eachCall(data, null, the.name, null, arguments);
			if(the.after) the.after();
        };
        method.yjdCallee = {};
		method.yjdCallee.class = a_class;
		method.yjdCallee.name = methods[i];
		method.yjdCallee.prop = prop;
        a_class.prototype[methods[i]] = method;
    }
};

/**
 * Virtual class contains some methods to be inherited.
 * @virtual
 * @constructor
 */
yjd.obj = function(){};

/**
 * Get data by path.
 * @param {string} path Data path separated by '/'.
 * @return {?|undefined} Value
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
 * Set data by path.
 * @param {string} path Data path separated by '/'.
 */
yjd.obj.prototype.set = function (path, value) {
    var ar_path = path.split('/');
    var obj = this;
    var prop;
    for(var i=0; i<ar_path.length-1; i++) {
        prop = ar_path[i];
        if(typeof obj[prop]==='object' && obj[prop]!==null && obj[prop].constructor!==Object) {
            return false;
        }
        if(obj[prop]===null || typeof obj[prop]!=='object') {
            obj[prop] = {};
        }
        obj = obj[prop];
    }
    prop = ar_path[i];
    obj[prop] = value;
};

/**
 * Explicitly release properties to be not able to use.
 * It is good way to 'delete obj;' insted of 'obj.destroy();'
 */
yjd.obj.prototype.destroy = function() {
    for(var prop in this) {
        if(this.hasOwnProperty(prop)) delete this[prop];
    }
};
