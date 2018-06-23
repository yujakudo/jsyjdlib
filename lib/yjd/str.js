/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview extend string and functions for locale.
 * @since  2017.04.17  initial coding.
 */

/**
 * Fill wild cards.
 * If it takes one string argument, replaces '%%' or '%1' with argument.
 * If it takes multiple strings, replaces '%n'(n=1,2,...) with arguments.
 * If it takes object argument, replaces '%name%' with value of same named property in the object.
 * @param {Object|string} obj strings to replace, or an object containing those.
 * @return Filled string
 */
String.prototype.fill = function(obj) {
    var str = this.toString();
    if(typeof obj === 'string' || typeof obj === 'number' || obj instanceof Error) {
		if(obj instanceof Error) obj = obj.message;
        if(arguments.length==1) {
			if(str.match('%%')) str = str.replace('%%', obj);
			else str = str.replace('%1', obj);
        } else {
            for(var i=0; i<arguments.length; i++) {
				var arg = arguments[i];
				if(arg instanceof Error) arg = arg.message;
                str = str.replace('%'+(i+1), arg);
            }
        }
    } else {
        for(var prop in obj) {
            var rex =  new RegExp('%'+prop+'%', 'g');
            str = str.replace(rex, obj[prop]);
        }
    }
    return str;
};

String.prototype.hasPrefix = function(str) {
	return this.substr(0,str.length)===str;
}

String.prototype.isAscii = function() {
	var len = this.toString().length;
	for(var i=0; i<len; i++) {
		if(this.charCodeAt(i)>255) return false;
	}
	return true;
}

/**
 * @namespace yjd.str string library
 */
yjd.str = {};

/**
 * locale code
 * @type {string}
 */
yjd.str.locale = 'en';

/**
 * @typedef yjd.str.options.structure
 * @property {string[]} locales Locale codes available in the app.
 * @property {string} default default locale code.
 * @property {string} url URL for load locale data.
 */
/**
 * Options.
 * @type yjd.str.options.structure
 */
yjd.str.options = {};


/**
 * locales data.
 * Property name is a locale code, and its value is an object with ID:string pairs. 
 */
yjd.str.data = {};

/**
 * Get string.
 * @param {string} id ID of string.
 * @param {string} locale locale code.
 */
yjd.str.get = function(id, locale) {
	locale = locale || yjd.str.locale;
	var str = getstr(id, locale);
	if(str) return str;
	var i = locale.indexOf('_');
	if(i>0) {
		str = getstr(id, locale.substr(0, i));
		if(str) return str;
	}
	if(yjd.str.options.default) {
		str = getstr(id, yjd.str.options.default);
		if(str) return str;
	}
	return id;

	function getstr(id, locale) {
		if(yjd.str.data[locale] && yjd.str.data[locale][id]) {
			return yjd.str.data[locale][id];
		}
		return false;
	}
};

/** alias */
if(__===undefined) {
	/**
	 * synonym of yjd.str.get.
	 */
	var __ = yjd.str.get;
} else {
	console.log('"__" is already defined. It is not "yjd.str.get".');
}

/**
 * Set options.
 * @param {yjd.str.options.structure} options 
 */
yjd.str.setOption = function(options) {
	yjd.str.options.locales = options.locales;
	yjd.str.options.default = options.default || 'en';
	yjd.str.options.url = options.url;
};

/**
 * Set locale data.
 * it can also be called as yjd.str.setData({'en':{},...})
 * @param {string|null} [locale] locale code of dataset.
 * @param {Object} data Locale data with ID:string pairs.
 * 	If locale is null or omitted, data object must contains locale named properties
 * 	and those value is an object with ID:string pairs.
 */
yjd.str.setData  = function(locale, data) {
	if(data===undefined) {
		data = locale;
		locale = null;
	}
	if(!locale) {
		yjd.str.data = data;
	} else {
		yjd.str.data[locale] = data;
	}
};
/**
 * Set locale.
 * If locale is not specified, resolve from options and browser settins.
 * yjd.str.setOption should be called before this.
 * @param {string} locale locale code.
 */
yjd.str.setLocale = function(locale) {
	if(locale) {
		yjd.str.locale = locale;
	} else {
		yjd.str.locale = resolveLocale();
	}
	if(!yjd.str.data[yjd.str.locale] && yjd.str.loadData) {
		yjd.str.loadData(yjd.str.locale);
	}

	//
	function resolveLocale() {
		var user_locales = window.navigator.languages || [
			window.navigator.language ||
			window.navigator.userLanguage ||
			window.navigator.browserLanguage
		];
		if(!yjd.str.options.locales) return user_locales[0];
		for(var i in user_locales) {
			var locale = user_locales[i];
			if(yjd.str.options.locales.indexOf(locale)>=0) {
				return locale;
			}
			var bar = locale.indexOf('_');
			if(bar>0) {
				locale = locale.substr(0, bar);
				if(yjd.str.options.locales.indexOf(locale)>=0) {
					return locale;
				}
			}
		}
		if(yjd.str.options.default) return yjd.str.options.default;
		return 'en';
	}
};
