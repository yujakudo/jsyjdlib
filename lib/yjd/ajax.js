/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview Ajax.
 * depend on yjd.base
 * @since  2017.05.06  initial coding.
 */

/**
 * Ajax
 * @param {object|string}　options options or URL string.
 * @param {object} o_this object to set 'this' of callbacks. default is options.
 */
yjd.ajax = function(options, o_this) {
    if(typeof options==='string') options = { url: options };
    options = yjd.extend({}, yjd.ajax.default, options);
    if(!o_this) o_this=options;

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
                reject(new Error("Stoped by beforeSend"));
            }
        }
        var rep = xhr.send(options.data);
    }

    var result = {
        result:     null,
        done:   [], fail:   [], always: []  //  functions
    };
    if(options.success) result.done.push(options.success);
    if(options.error) result.fail.push(options.error);
    if(options.complete) result.always.push(options.complete);

    promise.then( promise_then, promise_error);
    function promise_then(){
        if(window.location.protocol==='file:' && xhr.responseText.length===0) {
            promise_error(new Error('Local file length is zero. Or it could not be read.'));
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
 * encode object to string of form
 * @param {object} obj
 * @return {string}
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

//  default option values of ajax
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
 * overwrite default options for ajax.
 * @param {object|string} options options. if string assumed key, value.
 * @param {*} value value if options is string.
 */
yjd.ajax.setDefault = function(options, value) {
    if(typeof options==='string') {
        var key = options;
        options = {};
        options[key] = value;
    }
    yjd.extend(yjd.ajax.default, options);
};
