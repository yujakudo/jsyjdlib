/**
 * @copyright  2018 yujakudo
 * @license    MIT License
 * @fileoverview ajax list widget
 * depend on yjd.wdg
 * @since  2018.02.01  initial coding.
 */

 /**
 * @typedef {Object} yjd.wdg.List.Structure
 * @desc Structute of list.
 * @property {string|string[]} [initialText] Text to show first.
 * @property {string|string[]} [noResultText] Text to show when there is no search result.
 * @property {string|string[]} [noResultForm] HTML to show when there is no search result.
 * @property {string} [name] Name of input tag for text.
 * @property {string} [class] Class of input tag for text.
 * @property {boolean} [required] Add an attribute required to input tag when true.
 */
/**
 * @typedef {Object} yjd.wdg.List.Protocol
 * @desc Protocol information in the options.
 * @property {Object} [template] Default keys(original) and values. request only.
 * @property {Object} prop Property key names. values are original keys.
 * @property {string} [prop.id] The key for query ID.
 * @property {string} [prop.data] The key for data.
 * @property {string} [prop.query] The key for queried text to search. Response only.
 * @property {string} [prop.value] The key in data for value to set text input. Response only.
 * @property {string} [prop.disp] The key in data for items name in the list.
 * 	If null, The key named in prop.value is used for items name. Response only.
 * @property {string} [prop.result] The key for boolean value representing wether the query is success or not. Response only.
 * @property {string} [prop.reason] The key for reason when the query has been failed. Response only.
 * @property {string} [func] Name of the function called then AJAX finished. Should not be over written.
 */
/**
 * @typedef {Object} yjd.wdg.List.Query
 * @desc AJAX query information in the options.
 * @property {boolean} [enable] Enable query if true.
 * @property {boolean} [initialQuery] Whether cast query or not when loaded.
 * @property {yjd.wdg.List.Protocol} [request] The query request protocol.
 * @property {yjd.wdg.List.Protocol} [response] The query response protocol.
 */
/**
 * constructor of list.
 * @param {yjd.wdg.List.Structure} structure structure of list.
 * @param {Object} [options] Options
 * @param {string} [options.default] Default value to set in text input.
 * @param {boolean} [options.combo] Make it combobox if true.
 * @param {function} [options.onEntered] Callback function when a value entered.
 * 	Arguments are the yjd.wdg.List object, queried text, and boolean value if the queried text in the list.
 * @param {function} [options.onBussy] Callback function when status of bussy chainges.
 * 	Arguments are boolean value whether be bussy, and the yjd.wdg.List object.
 * @param {Object} [options.this] Value of 'this' in callbacks.
 * @param {yjd.wdg.List.Query} [options.search] Search query information.
 * @param {yjd.ajax.Options} [options.ajax] AJAX options.
 * @param {yjd.Loading.Options} [options.loading] Loading options.
 */
yjd.wdg.List = function(structure, options) {
	this.events = {};
	this.structure = {};
	yjd.extend(this.structure, {
		initialText: '',
		noResultText: '',
		noResultForm: '',
		name: null,
		class: null,
		required: false,
	}, structure);
	if(structure.initialText instanceof Array) structure.initialText = structure.initialText.join(); 
	if(structure.noResultText instanceof Array) structure.noResultText = structure.noResultText.join(); 
	if(structure.noResultForm instanceof Array) structure.noResultForm = structure.noResultForm.join(); 
	yjd.wdg.List.parent.constructor.call(this, this.structure, options, {
		default: '',		//	default value
		combo: true,		//	combo box
		onEntered: null,	//	callback
		onBussy: null,
		this: null,
		search: {
			enable: true,
			initialQuery: false,
			request: {			//	request options
				template: {},			//	template
				prop: {
					id: 'qid',		//	query id
					data: 'data',	//	property to insert value of input
				},
			},
			response: {			//	response options
				prop: {
					id: 'qid',		//	query id
					query: 'query',	//	property name of queried data.
					data: 'data',	//	property name of data list.
					value: 'value',	//	property name of data item for input value.
					disp: null,	//	property name of data item for display string.
					result: 'result',	//	property name of result of registration. boolian.
					reason: 'reason',	//	property name of reason when fail.
				},
				func: yjd.wdg.List.prototype.onSearched,	//	Callback function.
			},
		},
		ajax: {				//	ajax options
			method: "PUT",
			url: "",
			timeout: 0,
			cache: false,
			contentType: 'application/json'
		},
		loading: {
			function:'after',
			visible:false,
			style: {
				opacity: '0.8',
				'margin-left': '-1.1rem'
			}
		},
	});
	this.id_count = 0;
	this.ajaxNum = 0;
	this.inputs = '';
	this.lastResultId = 0;
	this.cache = {};
	this.focus = false;
};

yjd.extendClass(yjd.wdg.List, yjd.wdg);

/**
 * Set value.
 * @param {string} str string to set. 
 */
yjd.wdg.List.prototype.SetVal = function(str) {
	this.atms.in.val(str);
	this.onKey();
};

/**
 * Get Entered items data from AJAX.
 * This may be called when options.combo=true.
 * @return {null|Object} items data. Or null when not selected from list.
 */
yjd.wdg.List.prototype.getEnteredData = function() {
	if(this.entered_idx===null || this.listData.length==0) return null;
	return this.listData[this.entered_idx];
};

/**
 * Set new value to request template(request data).
 * All present queries are expired.
 * @public
 * @param {string} key Name of property.
 * @param {any} value Value to be set.
 * @param {string} [name='search'] Query name. May not use.
 */
yjd.wdg.List.prototype.setRequestTemplate = function(key, value, name) {
	if(name===undefined) name = 'search';
	this.options[name].request.template[key] = value;
	this.expireSearch();
	this.clear();
};

/**
 * Set new value to request template(request data).
 * All present queries are expired.
 * @public
 * @param {string} key Name of property.
 * @param {string} [name='search'] Query name. May not use.
 */
yjd.wdg.List.prototype.getRequestTemplate = function(key, name) {
	return this.options[name].request.template[key];
};

/**
 * Clear list parameter
 * @protected
 */
yjd.wdg.List.prototype.clear = function() {
	this.selected = null;
	this.selected_val = null;
	this.entered_val = null;
	this.entered_idx = null;
	this.resentNoWord = null;
	this.listNum = 0;
	this.listData = [];
	this.inputs = '';
	this.lastEntered = '';
	this.atms.box.html('<p>'+this.structure.initialText+'</p>');
	this.atms.in.val(this.options.default);
	if(this.options.search.enable && this.options.search.initialQuery) {
		this.searchQuery('');
	}
};

/**
 * Render
 * this called from yjd.wdg (constructor of parent class)
 * @protected
 * @param {yjd.wdg.List.Structure} structure Structure information.
 */
yjd.wdg.List.prototype.render = function(structure) {
	var s_name = (structure.name)? ' name="%1"'.fill(structure.name): '';
	var s_class = (structure.class)? ' class="%1"'.fill(structure.class): '';
	var s_required = (structure.required)? ' required': '';
	this.atm = yjd.atm([
		'<div class="yjd-wdg-list">',
			'<input type="text"'+s_name+s_class+s_required+' />',
			'<div>',
				'<div class="yjd-wdg-list-box"></div>',
			'</div>',
		'</div>'
	]);
	this.atms = {};
	this.atms.in = yjd.atm('input[type="text"]', this.atm);
	this.atms.box = yjd.atm('.yjd-wdg-list-box', this.atm);
	this.atms.noResult = null;
	if(this.structure.noResultForm) {
		this.atms.noResult = yjd.atm('<div class="yjd-wdg-list-noresult">'
							+this.structure.noResultForm+'</div>');
		this.atms.noResult.style('display','none');
		this.atms.box.after(this.atms.noResult);
	}
};

/**
 * Append to specified element, and bind.
 * @public
 * @param {yjd.atm|string|number|Element} atm Element or translatable value to yjd.atm.
 */
yjd.wdg.List.prototype.appendTo = function(atm) {
	atm = yjd.atm.check(atm);
	atm.append(this.atm);
	this.bind();
};

/**
 * bind
 * @public
 */
yjd.wdg.List.prototype.bind = function() {
	this.loading = yjd.Loading(this.atms.in, this.options.loading);
	this.clear();
	this.events.forcus = this.atms.in.bind('focus', this, onFocus, true);
	this.events.blur = this.atms.in.bind('blur', this, onBlur, true);
	this.events.keydown = this.atms.in.bind('keydown', this, onKeyDown, true);
	this.events.keyup = this.atms.in.bind('keyup', this, onKeyUp, true);
	//
	function onFocus(event, atm) {
		this.atm.addClass('yjd-wdg-focused');
		this.atms.in.val(this.inputs);
		this.focus = true;
		if(this.inputs.length || this.options.search.initialQuery) this.searchQuery(this.inputs);
	};
	function onBlur(event, atm) {
		this.atm.removeClass('yjd-wdg-focused');
		this.focus = false;
		var value = this.atms.in.val();
		if(this.entered_val!==null) {
			value = this.entered_val;
		} else if(!this.options.combo) {
			this.inputs = this.atms.in.val();
			value = (this.selected_val===null)? '': this.selected_val;
		}
		this.atms.in.val(value);
		this.expireSearch();
		if(value.length) {
			this.searchQuery(value);	//	To call onEntered callback.
		}
	};
	function onKeyDown(event, atm) {
		this.downKey = yjd.key.getCode(event);
		if(yjd.key.is(this.downKey, ['RETURN', 'ENTER','UP', 'DOWN'])) event.preventDefault();
	};
	function onKeyUp(event, atm) {
		var code = yjd.key.getCode(event);
		if(this.downKey==yjd.key.codes.IME_PRESS && code==yjd.key.codes.SPACE) {
			this.onKey(code);
		} else if(code==yjd.key.codes.RETURN && this.selected===null) {
			this.onKey(code);
		} else if(code===this.downKey && code!==yjd.key.codes.IME_PRESS) {
			if(yjd.key.is(code, ['UP', 'DOWN'])) {
				this.onCursor(code);
				event.preventDefault();
			} else if(yjd.key.is(code, ['SPACE', 'RETURN', 'ENTER'])) {
				this.onEnter(code);
				event.preventDefault();
			} else if(yjd.key.is(code, 'ESCAPE')) this.onCancel(code);
			else this.onKey(code);
		}
		this.pressedKey = null;
	};
};

/**
 * Handler of general key input.
 * This called when enter key downed if IME used.
 * @param {number} code Key code in yjd.key.codes.
 * @protected
 */
yjd.wdg.List.prototype.onKey = function(code) {
	this.select(null);
	this.enter(null);
	var str = this.atms.in.val();
	if(this.inputs===str) return;
	this.inputs = str;
	if(!this.options.search.initialQuery && str==='') {
		this.atms.box.html('');
		this.expireSearch();
		if(this.atms.noResult) this.atms.noResult.style('display','none');
		return;
	}
	this.searchQuery(str);
};

/**
 * Search query procedure.
 * If word is in the cache, use stored result.
 * Otherwise use AJAX.
 * @protected
 */
yjd.wdg.List.prototype.searchQuery = function(str) {
	for(var i=0; i<str.length; i++) {
		var sub = str.substr(0,i+1);
		if(this.cache.hasOwnProperty(sub)) {
			var list = this.cache[sub];
			if(list.length==0 || sub===str) {
				this.expireSearch();
				this.updateBox(str, list, this.options.search.response);
				return;
			}
		}
	}
	this.query(this.options.search, str);
};

/**
 * Procedure aftre AJAX search query.
 * This method is called from @see yjd.wdg.List.prototype.query .
 * @protected
 * @param {number} qid query ID.
 * @param {boolean} result Success or fail.
 * @param {Object} data Data in response.
 * @param {yjd.wdg.List.Protocol} responseOpt Information for response.
 */
yjd.wdg.List.prototype.onSearched = function(qid, result, data, responseOpt) {
	if(!result) return;
	var query = data[responseOpt.prop.query]; 
	var list = data[responseOpt.prop.data];
	if(!this.cache.hasOwnProperty(query)) this.cache[query] = list;
	if(qid<this.lastResultId) return;
	this.lastResultId = qid;
	this.updateBox(query, list, responseOpt);
};

/**
 * Update box html.
 * Make list or show messages.
 * @protected
 * @param {string} query Word searched.
 * @param {Object[]} list An array of items to show in the list.
 * @param {yjd.wdg.List.Protocol} responseOpt Information for response.
 */
yjd.wdg.List.prototype.updateBox = function(query, list, responseOpt) {
	var b_specified = this.makeList(list, responseOpt, query);
	this.listData = list;
	if(list.length) {
		if(this.atms.noResult) this.atms.noResult.style('display','none');
	} else {
		if(this.structure.noResultText) {
			this.atms.box.html('<p>'+this.structure.noResultText+'</p>');
		}
		if(this.atms.noResult) this.atms.noResult.style('display','block');
	}
	this.select();
	this.enter();
	if(this.atms.in.val()===query && query!=='' && !this.focus) {
		if(!this.options.combo) {
			var value = list[0][responseOpt.prop.value];			
			this.enter(value, 0);
		}
		this.callback(this.options.onEntered, [this, query, b_specified]);
	}
};

/**
 * Force to expire all enquiring query.
 * @protected
 */
yjd.wdg.List.prototype.expireSearch = function() {
	this.lastResultId = ++this.id_count;
};

/**
 * Procedure when cursor keys are downed.
 * Move cursor in the list.
 * @protected
 */
yjd.wdg.List.prototype.onCursor = function(code) {
	if(this.listNum==0) return;
	var nsel = Number(this.selected);
	if(nsel==null) {
		nsel = 0;
	} else if(code==yjd.key.codes.UP) {
		nsel = (nsel==0)? this.listNum-1: nsel-1;
	} else if(code==yjd.key.codes.DOWN) {
		nsel = (nsel==this.listNum-1)? 0: nsel+1;
	};
	if(nsel===this.selected) return;
	this.select(nsel);
};

/**
 * Procedure when enter key is downed.
 * The value on cursor makes be entered.
 * @protected
 */
yjd.wdg.List.prototype.onEnter = function(code) {
	if(typeof this.selected==='number') {
		this.select();
		this.enter(this.selected_val, this.selected);
		this.atms.in.blur();
	}
};

/**
 * Procedure when escape key is downed.
 * To clear.
 * @protected
 */
yjd.wdg.List.prototype.onCancel = function(code) {
	this.clear();
};

/**
 * Select an item in the list.
 * @param {number|yjd.atm} [nsel] Item to select.
 * 	if omitted (or undefined or null), use previous selected value.
 */
yjd.wdg.List.prototype.select = function(nsel) {
	if(!this.listNum) {
		this.selected = null;
		this.selected_val = null;
		return;
	}
	var atm = null;
	if(nsel instanceof yjd.atm) {
		atm = nsel;
		nsel = atm.data('idx');
	} else if(typeof nsel==='string' ) {
		atm = yjd.atm('.yjd-wdg-list-item[data-value="'+nsel+'"]', this.atms.box);
		if(atm.elm) nsel = atm.data('idx');
		else nsel = null;
	} else {
		if(nsel===undefined) nsel = (this.selected!==null)? this.selected: 0;
		if(nsel!==null) atm = yjd.atm('.yjd-wdg-list-item:nth-child(%1)'.fill(nsel+1), this.atms.box);
	}
	this.selected = nsel;
	var atmSel = yjd.atm('.yjd-wdg-list-item.yjd-wdg-list-selected', this.atms.box);
	if(atmSel.elm) atmSel.removeClass('yjd-wdg-list-selected');
	if(atm && atm.elm) {
		this.selected_val = atm.data('value');
		atm.addClass('yjd-wdg-list-selected');
	}
};

/**
 * Makes the item entered.
 * @protected
 * @param {string} value The value to be entered.
 * @param {number} [idx] Index of selected item.
 */
yjd.wdg.List.prototype.enter = function(value, idx) {
	if(value!==undefined) {
		this.entered_val = value;
		this.entered_idx = (idx===undefined)? null: idx;
	}
	var atmPrev = yjd.atm('.yjd-wdg-list-item.yjd-wdg-list-entered', this.atms.box);
	if(atmPrev.elm) atmPrev.removeClass('yjd-wdg-list-entered');
	if(this.entered_val!==null) {
		atmEntered = yjd.atm('.yjd-wdg-list-item[data-value="'+this.entered_val+'"]', this.atms.box);
		if(atmEntered && atmEntered.elm) {
			atmEntered.addClass('yjd-wdg-list-entered');
		}
	}
};

/**
 * Enquire via AJAX.
 * @param {yjd.wdg.List.Query} queryOpt Options for query.
 * @param {Object} data Data to be set in data property of request.
 */
yjd.wdg.List.prototype.query = function(queryOpt, data) {
	if(!queryOpt.enable) return;
	var options = {};
	yjd.extend(options, this.options.ajax);
	options.data = {};
	this.id_count++;
	var reqopt = queryOpt.request;
	yjd.extend(options.data, reqopt.template);
	if(reqopt.prop.hasOwnProperty('id')) {
		options.data[reqopt.prop.id] = this.id_count;
	}
	if(reqopt.prop.hasOwnProperty('data')) {
		options.data[reqopt.prop.data] = data;
	}
	this.updateLoading(true);
	yjd.ajax(options, this)
	.done(function(response, status, xhr){
		var resopt = queryOpt.response;
		var data = false;
		var result = false;
		var qid = null;
		try {
			data = JSON.parse(response);
			if(resopt.prop.hasOwnProperty('id')) {
				qid = data[resopt.prop.id];
			}
			if(resopt.prop.hasOwnProperty('result')) {
				result = data[resopt.prop.result];
			} else {
				result = true;
			}
		} catch(e) {
		}
		this.updateLoading(false, data && result);
		if(resopt.hasOwnProperty('func')) {
			resopt.func.call(this, qid, result, data, resopt);
		}
	})
	.fail(function(xhr, status, err) {
		var resopt = queryOpt.response;
		this.updateLoading(false, false);
		if(resopt.hasOwnProperty('func')) {
			resopt.func.call(this, false, false, false, resopt);
		}
	})
};

/**
 * Update loading mark.
 * @param {boolean} b_bussy Increase or decrease.
 * @param {boolean} result Success or not. 
 */
yjd.wdg.List.prototype.updateLoading = function(b_bussy, result) {
	var s_show = false;
	var prev = this.ajaxNum;
	if(b_bussy) this.ajaxNum++;
	else this.ajaxNum--;

	if(!this.ajaxNum) {
		if(result===false) s_show = 'ng';
	} else {
		s_show = 'loading';
	}
	this.loading.show(s_show);
	if((prev && !this.ajaxNum) || (!prev && this.ajaxNum)) {
		this.callback(this.options.onBussy, [this.ajaxNum>0, this]);
	}
};


/**
 * Make list.
 * @param {Object[]} list An array of items data.
 * @param {yjd.wdg.List.Protocol} opts Response options
 * @param {string} spec_word The word to be checked whether be in the list.
 * @return {boolean} True if spec_word in the list.
 */
yjd.wdg.List.prototype.makeList = function(list, opts, spec_word) {
	var b_specify = false;
	var s_value = opts.prop.value;
	var s_disp = opts.prop.disp;
	if(s_disp===null || s_disp===undefined) s_disp = s_value;
	this.atms.box.html('');
	this.listNum = list.length;
	for(var i=0; i<list.length; i++) {
		var atmItem = yjd.atm('<div class="yjd-wdg-list-item"></div>');
		this.atms.box.append(atmItem);
		atmItem.data('idx',i)
			.data('value',list[i][s_value])
			.text(list[i][s_disp])
			.bind('mousedown', this, onClick, true);
		if(spec_word===list[i][s_value]) b_specify = true;
	}
	return b_specify;
	//
	function onClick(event, atm) {
		var idx = atm.data(idx);
		this.select(atm);
		this.enter(this.selected_val, idx);
	};
};

