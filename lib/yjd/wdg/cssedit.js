/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview dialog widget
 * depend on yjd.wdg
 * @since  2017.07.12  initial coding.
 */



/**
 * @typedef {Object} yjd.wdg.CssEdit.structure
 * @desc Structute of CssEdit.
 * @property {string} [style] selector for the tag style storing.
 * @property {string} [root] selector for root node containing followings
 * @property {string} [border] selector for border inputs
 * @property {string} [background] selector for background
 * @property {string} [outline] selector for outline
 * @property {string} [font] selector for font
 * @property {string} [text] selector for text
 * @property {string} [custom] selector for custom area
 * @property {string} [tools] selector for total custom area
 * @property {string} [total] selector for total area
 */
/**
 * constructor of cssedit.
 * @param {yjd.wdg.CssEdit.structure} structure structure of dialog box.
 * @param {Object} [options] Options
 */
yjd.wdg.CssEdit = function(structure, options) {
	this.events = [];
	this.structure = structure;	
	this.cssData = null;	//	The object holding all css. propaties are each selector string. 
	this.s_selector = '';
	this.editables_events = [];
	this.ColorNames = new yjd.wdg.ColorNames();
	this.b_onMethodSelect = false;
	this.b_enable = false;
	yjd.wdg.CssEdit.parent.constructor.call(this, structure, options, {
		displayMode: 'both',	//	how to show each item. css:css value, desc:description, both
		onchange: undefined,	//	callback called when css changed. params are CSS text and this instance.
		maxFileSizeKB: 200,		//	Maximum file size in KB to imply. 
		editable_shadow: '1px 1px 3px 2px rgba(0,0,0,0.18)',
		selected_shadow: '0 0 1px 2px rgba(255,255,0,0.8)',
		class_prefix: 'cl-',	//	Prefix to get class from node.
	});
	this.makeRuleInfo();
	this.makeHeaderCss();
};

yjd.extendClass(yjd.wdg.CssEdit, yjd.wdg);

yjd.wdg.CssEdit.prototype.makeHeaderCss = function() {
	this.headerCss =
	".yjd-editable-on .yjd-editable-object { box-shadow: %1; cursor: default; }\r\n"
	.fill( this.options.editable_shadow )
	+ ".yjd-editable-on .yjd-editable-selected { box-shadow: %1, %2; cursor: default; }\r\n"
	.fill(
		this.options.selected_shadow,
		this.options.editable_shadow
	);
};
	
/**
 * Make structure to get category and default value by rule name.
 */
yjd.wdg.CssEdit.prototype.makeRuleInfo = function() {
	this.ruleInfo = {};
	for(var cat in this.StructurePreset) {
		var cat_info = this.StructurePreset[cat];
		for(var i=0; i<cat_info.length; i++) {
			var rule_info = cat_info[i];
			this.ruleInfo[rule_info.name[0]] = {
				category: cat,
				def_value: rule_info.default,
				input: rule_info.input
			};
		}
	}
};

yjd.wdg.CssEdit.prototype.initCssData = function() {
	if(!this.structure.style) return;
	var text = yjd.atm(this.structure.style).text();
	this.cssData = this.parseCss(text);
	this.updateStyle();
	this.updateTools();
};

//
//	User API
//

yjd.wdg.CssEdit.prototype.attach = function() {
	for(var cat in this.atms) {
		if(this.structure[cat] && cat!=='style') {
			this.atm.findOne(this.structure[cat]).append(this.atms[cat]);
		}
	}
	this.atms.style = yjd.atm(this.structure.style);
	this.initCssData();
	this.bind();
};

yjd.wdg.CssEdit.prototype.getSelectors = function(s_part) {
	var selectors = { class:[], id:[], other:[] };
	for(var selector in this.cssData) {
		var c = selector.substr(0,1);
		if(c==='#') selectors.id.push(selector);
		else if(c==='.' && selector.indexOf(' ')<0) selectors.class.push(selector);
		else selectors.other.push(selector);
	}
	if(s_part in selectors) return selectors[s_part];
	return selectors;
};

/**
 * Set selector to update.
 */
yjd.wdg.CssEdit.prototype.select = function(selector) {
	if(typeof selector==='string') {
		this.s_selector = selector;
		yjd.atm('select', this.atms.tools).val(selector);
	} else {
		this.s_selector = yjd.wdg.getSelectorStr(selector, this.options.class_prefix);
		yjd.atm('select', this.atms.tools).val('');
	}
	if(this.s_selector) {
		this.applyDataToWidget(this.s_selector);
		this.updateCss();
	}
};

/**
 * Enable or disable whole widgets.
 * @param {boolean} onoff Enable when true.
 */
yjd.wdg.CssEdit.prototype.enable = function(onoff) {
	if(onoff===undefined) {
		onoff = this.b_enable || yjd.atm('select', this.atms.tools).val();
	} else {
		this.b_enable = onoff;
	}
	if(onoff) {
		for(var prop in this.atms) {
			if(prop==='tools') continue;
			this.atms[prop].removeClass('yjd-wdg-disabled');
			yjd.atms('input,select', this.atms[prop]).each(this,
				function(atm) {
					atm.removeAttr('disabled');
			});
		}
		yjd.atms('.yjd-cssed-item', this.atm).each(this,
			function(atm) {
				yjd.atm('input[name="fcss-enable"]', atm).removeAttr('disabled');
				this.changeAppearance(atm, 'enable');
		});
	} else {
		for(var prop in this.atms) {
			if(prop==='tools') continue;
			this.atms[prop].addClass('yjd-wdg-disabled');
			yjd.atms('input,select', this.atms[prop]).each(this,
				function(atm) {
					atm.attr('disabled', true);
			});
		}
	}
};

/**
 * Change appearance of item.
 */
yjd.wdg.CssEdit.prototype.changeAppearance = function(atm, s_cat) {
	var item = atm;
	if(!atm.hasClass('yjd-cssed-item')) {
		item = atm.parent('.yjd-cssed-item');
	}
	//	Enable checkbox
	if(!s_cat || s_cat==='enable') {
		var onoff = yjd.atm('input[name="fcss-enable"]', item).val();
		if(onoff) {
			item.removeClass('yjd-cssed-disabled');
			yjd.atms('input:not([name="fcss-enable"]),select', item).each(this,
				function(atm){
					atm.removeAttr('disabled');
			});
		} else {
			item.addClass('yjd-cssed-disabled');
			yjd.atms('input:not([name="fcss-enable"]),select', item).each(this,
				function(atm){
					atm.attr('disabled', true);
			});
		}
	}
	//	Customline
	if(!s_cat || s_cat==='custom') {
		var b_custom = yjd.atm('input[name="yjd-fcss-b-custom"]', item).val();
		var atmFields = item.findOne('.yjd-cssed-input-field');
		if(b_custom) {
			atmFields.child('.yjd-cssed-defined-field')
				.addClass('yjd-wdg-hidden');
			atmFields.child('input[name="yjd-fcss-full"]')
				.removeClass('yjd-wdg-hidden');
		} else {
			atmFields.child('.yjd-cssed-defined-field')
				.removeClass('yjd-wdg-hidden');
			atmFields.child('input[name="yjd-fcss-full"]')
				.addClass('yjd-wdg-hidden');
		}
	}
	// Combine select.
	if(!s_cat || s_cat==='combine') {
		yjd.atms('.yjd-fcss-combine', item).each(this,
			function(atm) {
				var method = atm.findOne('.yjd-fcss-method-select').val();
				atm.child('.yjd-cssed-selected')
					.removeClass('yjd-cssed-selected')
					.addClass('yjd-wdg-hidden');
				atm.child('[data-idx="%1"]'.fill(method))
					.addClass('yjd-cssed-selected')
					.removeClass('yjd-wdg-hidden');
			}
		);
	}
};

//
//	Event Handler
//

/**
 * bind
 */
yjd.wdg.CssEdit.prototype.bind = function() {
	this.enable(false);
	//	Change all input without file.
	this.events = [];
	var handler;
	yjd.atms(
		'.yjd-wdg-cssedit-base input:not([type="file"]),'
		+'.yjd-wdg-cssedit-base select', this.atm
	).each(this, function(atm){
			handler = atm.bind('change', this, changeValue, true);
			this.events.push(handler);
	});
	//	File select button
	yjd.atms('.yjd-fcss-click-to-file-select', this.atm).each(this,
		function(atm){
			handler = atm.bind('click', this, toFileSelect, true);
			this.events.push(handler);
	});
	//	Set a file on file input..
	yjd.atms('input[type="file"]', this.atm).each(this,
		function(atm){
			handler = atm.bind('change', this, changeFile, true);
			this.events.push(handler);
	});
	//	Change custom CSS textarea.
	handler = yjd.atm('textarea[name="yjd-cssed-custom"]', this.atm).bind('change', this, updateWholeCss, true);
	this.events.push(handler);
	//	tools
	handler = yjd.atm('select.yjd-cssed-selector', this.atms.tools).bind('change', this, changeSelector, true);
	this.events.push(handler);
	handler = yjd.atm('button', this.atms.tools).bind('click', this, addNewSelector, true);
	this.events.push(handler);
	handler = yjd.atm('select.yjd-cssed-selector-option', this.atms.tools).bind('change', this, selectorOption, true);
	handler = yjd.atm('select.yjd-cssed-selector-tags', this.atms.tools).bind('change', this, selectorOption, true);
	this.events.push(handler);
//	handler = yjd.atm('textarea', this.atms.tools).bind('change', this, updateWholeCss, true);
//	this.events.push(handler);
	//
	function changeValue(event, atm) {
		var name = atm.attr('name');
		if(name==='fcss-colorsort') {
			var atmSelect = atm.parent().child('select');
			this.ColorNames.sortSelect(atmSelect, atm.val());
			return;
		}
		if(name==='fcss-enable') {
			this.changeAppearance(atm, 'enable');
		}
		if(name==='yjd-fcss-b-custom') {
			this.changeAppearance(atm, 'custom');
		}
		if(atm.hasClass('yjd-fcss-method-select')) {
			this.changeAppearance(atm, 'combine');
			this.b_onMethodSelect = true;
		}
		if(atm.hasClass('yjd-colornames')) {
			atm.data('value', atm.val());
		}
		this.updateItemValue(atm);
		this.updateCss();
		this.b_onMethodSelect = false;
	}
	function changeCustomText(event, atm) {
		this.updateCss();
	}
	function toFileSelect(event, atm) {
		atm.parent().child('[type="file"]').click();
	}
	function changeFile(event, atm) {
		if(atm.elm.files.length) {
			var file = atm.elm.files[0];
			var ar_t = file.type.split('/');
			if(ar_t[0]!=='image') {
				alert("The file is not image.");
				atm.elm.value = false;
				return;
			}
			if(file.size>this.options.maxFileSizeKB*1024) {
				alert("Too large file size. Maximin is %1 KB.".fill(this.options.maxFileSizeKB));
				atm.elm.value = false;
				return;
			}
			var reader = new FileReader();
			reader.readAsDataURL(file);
			var o_this = this;
			reader.onload = function() {
				var atmVal = atm.parent().child('[type="text"]');
				atmVal.val(reader.result);
				changeValue.call(o_this, event, atm);
			}
		}
	}
	function updateWholeCss(event, atm) {
		this.updateCss();
	}
	function changeSelector(event, atm) {
		var val = atm.val();
		this.select(val);
		this.enable();
	}
	function addNewSelector(event, atm) {
		var selector = atm.parent().child('input[type="text"]').val();
		selector = selector.trim();
		if(!selector || (selector in this.cssData)) {
			return;
		}
		this.addSelector(selector);
		atm.parent().child('select').val(selector);
		this.select(selector);
		this.enable();
		atm.parent().child('input[type="text"]').val('');
	}
	function selectorOption(event, atm) {
		var opt = atm.val();
		var inp = atm.parent().child('input[type="text"]');
		var val = inp.val();
		var c = opt.substr(0,1);
		if(val && 'a'<=c && c<='z') opt = ' '+opt;
		inp.val(val+opt);
		atm.val('');
	}
};

yjd.wdg.CssEdit.prototype.updateItemValue = function(atmItem) {
	if(!atmItem.hasClass('yjd-cssed-item')) {
		atmItem = atmItem.parent('.yjd-cssed-item');	
	}
	var b_custom = yjd.atm('input[name="yjd-fcss-b-custom"]', atmItem).val();
	if(b_custom) return;
	var atmField = yjd.atm('.yjd-cssed-input-field', atmItem);
	yjd.atms('.yjd-fcss-combine', atmField).each(this, function(atm){
		this.resolveCombine(atm);
	});
	var idx = atmField.data('idx');
	var i=0;
	var value = '';
	while(1) {
		var pidx = idx + '-' + i++;
		var atm = atmField.findOne('[data-idx="'+pidx+'"]');
		if(!atm.elm) break;
		if(value) value += ' ';
		var a_val = atm.val()
		if(atm.attr('type')==='checkbox') {
			a_val = a_val? atm.attr('value'): '';
		}
		value += a_val;
	}
	yjd.atm('[name="yjd-fcss-full"]', atmItem).val(value);
	yjd.atms('.yjd-cssed-color_name', atmItem).each(this, function(atm){
		this.updateColorNames(atm);
	});
}

yjd.wdg.CssEdit.prototype.resolveCombine = function(atm) {
	var atmVal = atm.child('input[type="hidden"]', atm);
	var atmSelected = atm.child('.yjd-cssed-selected', atm);
	var idx = atmSelected.data('idx');
	var option = idx.substr(idx.lastIndexOf('-')+1);
	var value = undefined;
	if(atm.hasClass('yjd-fcss-combine-length')) {
		if(option==="calc") {
			value = "calc(%1)"
			.fill(atmSelected.child('[type="text"]').val());
		}
	} else if(atm.hasClass('yjd-fcss-combine-colordir')) {
		if(option==="color_val") {
			value = atmSelected.child('[type="color"]').val();
			var alpha = atmSelected.child('[type="range"]').val();
			if(alpha<1) {
				value = 'rgba(%1, %2, %3, %4)'.fill(
					Number('0x'+value.substr(1,2)),
					Number('0x'+value.substr(3,2)),
					Number('0x'+value.substr(5,2)),
					alpha
				);
			}
		}
	} else if(atm.hasClass('yjd-fcss-combine-image')) {
		if(option==="url") {
			value = atmSelected.child('[type="url"]').val();
			value = 'url("%1")'.fill(value);
		} else if(option==="file") {
			value = atmSelected.child('[type="text"]').val();
			value = 'url("%1")'.fill(value);
		}
	} 
	if(value===undefined) {
		var i=0;
		value = '';
		while(1) {
			var pidx = idx + '-' + i++;
			var atm = atmSelected.child('[data-idx="'+pidx+'"]');
			if(!atm.elm) break;
			if(atm.hasClass('ydj-fcss-avoid')) continue;
			value += atm.val();
		}
	}
	atmVal.val(value);
};

yjd.wdg.CssEdit.prototype.updateColorNames = function(atm) {
	if(!atm.hasClass('yjd-cssed-color_name')) {
		atm = yjd.atm('.yjd-cssed-color_name', atm);
		if(!atm.elm) return;
	}
	if(!this.b_onMethodSelect) {
		var value = atm.parent().child('input[type="hidden"]').val();
		if(value) {
			var atmSelect = atm.child('select');
			this.ColorNames.sortSelect(atmSelect, value);
			var stra = this.ColorNames.getColAlph(value);
			atm.child('input[type="color"]').val(stra[0]);
		}
	}
};

yjd.wdg.CssEdit.prototype.updateCss = function() {
	var dataObj = {};
	if(this.s_selector) {
		this.cssData[this.s_selector] = dataObj;
	}
	var css = '';
	for(var prop in this.StructurePreset) {
		this.atms[prop].find('.yjd-cssed-item').each(this,
			function(atm) {
				var name = atm.data('name');
				var val = yjd.atm('input[name="yjd-fcss-full"]', atm).val();
				var checked = yjd.atm('input[name="fcss-enable"]', atm).val();
				dataObj[name] = [val, checked];
			}
		);
	}
	custom_css = this.atms.custom.val();
	custom_css = this.parseInnerCss(custom_css, dataObj);
	this.atms.custom.removeClass('.yjd-cssed-error');
	if(custom_css.trim()!=='') {
		this.atms.custom.addClass('.yjd-cssed-error');
	}
	this.updateStyle();
	var css = '';
	for(var prop in dataObj) {
		if(dataObj[prop][1]) css += "%1: %2;\r\n".fill(prop, dataObj[prop][0]);
	}
	this.atms.total_view.val(css);
	if(this.options.onchange) this.options.onchange(this);	
};

yjd.wdg.CssEdit.prototype.getCss = function() {
	return this.atms.total_view.val();
};

yjd.wdg.CssEdit.prototype.updateStyle = function() {
	if(!this.atms.style ) return;
	var selectors = this.getSelectors();
	var text = this.headerCss;
	text += put_css.call(this, selectors.other);
	text += put_css.call(this, selectors.class);
	text += put_css.call(this, selectors.id);
	this.atms.style.text(text);
	//
	function put_css(selectors) {
		var text = '';
		for(var i=0; i<selectors.length; i++) {
			var dataSet = this.cssData[selectors[i]];
			var inner = '';
			for(var key in dataSet) {
				if(dataSet[key][1]) {
					inner += "\t%1: %2;\r\n".fill(key, dataSet[key][0]);
				}
			}
			if(inner) text += "%1 {\r\n%2}\r\n".fill(selectors[i], inner);
			if(('box-shadow' in dataSet) && dataSet['box-shadow'][1]) {
				text += "%1.yjd-editable-selected {\r\n\tbox-shadow: %2, %3}\r\n"
				.fill( selectors[i], this.options.selected_shadow, dataSet['box-shadow'][0]);
			}
		}
		return text;
	}
};
	

//
//	Rendering
//

/**
 * render
 * this called from yjd.wdg (constructor of parent class)
 */
yjd.wdg.CssEdit.prototype.render = function(structure) {
	this.atm = yjd.atm(structure.root);
	this.atms = {};
	for(var prop in this.StructurePreset) {
		var html = '<div class="yjd-wdg yjd-wdg-cssedit-base">'
			+ '<table class="yjd-wdg-cssedit-table">'
			+ this.makeInnerHtml(this.StructurePreset[prop])
			+ '</table></div>';
		this.atms[prop] = yjd.atm(html);
	}
	this.atms.custom = yjd.atm([
		'<textarea name="yjd-cssed-custom" wrap="off"></textarea>',
	]);
	this.atms.tools = yjd.atm([
		'<div class="yjd-wdg-cssedit-tools">',
		'<select class="yjd-cssed-selector"></select>',
		'<input class="yjd-cssed-new-selector" type="text" />',
		'<button class="yjd-cssed-add-selector">Add</button>',
		'<select class="yjd-cssed-selector-tags"><option></option></select>',
		'<select class="yjd-cssed-selector-option"><option></option></select>',
		//		'<textarea class="yjd-cssed-additional" wrap="off"></textarea>',
		'</div>'
	]);
	var select = this.atms.tools.child('select.yjd-cssed-selector-option');
	for(var i=0; i<this.SelectorOptions.length; i++) {
		var words = this.getValueShowWord(this.SelectorOptions[i]);
		var html = '<option value="%value%" title="%alt%">%show%</option>'.fill(words);
		select.append(html);
	}
	select = this.atms.tools.child('select.yjd-cssed-selector-tags');
	for(var i=0; i<this.Tags.length; i++) {
		var html = '<option>%1</option>'.fill(this.Tags[i]);
		select.append(html);
	}
	this.atms.total_view = yjd.atm([
		'<textarea name="yjd-cssed-total_view" wrap="off" readonly></textarea>'
	]);
	return;
};

yjd.wdg.CssEdit.prototype.makeInnerHtml = function(table_info) {
	var s_html = '';
	for( var prop in table_info) {
		var item_info = table_info[prop];
		var s_name = item_info.name[0];
		var id = s_name
		s_html += '<tr class="yjd-cssed-item yjd-cssed-disabled" data-idx="%1" data-name="%2">'.fill(id, s_name)
			+'<th><input name="fcss-enable" type="checkbox" /></th>'
			+'<td>%1<br/>%2</td>'.fill(s_name, item_info.name[1])
			+'<td><div class="yjd-cssed-input-field" data-idx="%1">'.fill(id)
			+'<span class="yjd-cssed-defined-field">';
		for(var i=0; i<item_info.input.length; i++) {
			var idx = id + '-' + i;
			var s_input = this.getInput(item_info.input[i], idx);
			s_html += ((i>0)? ' ': '')
			 + '<span class="yjd-cssed-field">%1</span>'.fill(s_input);
		}
		s_html += '</span>'
			+'<input class="yjd-wdg-hidden" name="yjd-fcss-full" type="text"/>'
			+'</div></td><td>'
			+'<label><input name="yjd-fcss-b-custom" type="checkbox" />&#x1F58A;</label>'
			+'</td></tr>';
		}
	return s_html;
};

yjd.wdg.CssEdit.prototype.getInput = function(input_info, idx) {
	s_input = '%1'.fill(input_info.type[1]);
	var s_attrs = '';
	var s_type = input_info.type[0];
	var i;
	var prop
	if(this.types.original.indexOf(s_type)>=0) {
		//	Original input type
		if(idx) {
			s_attrs += ' data-idx="%1"'.fill(idx);
		}
		if('attrs' in input_info) {
			for(prop in  input_info.attrs) {
				s_attrs += ' %1="%2"'.fill(prop, input_info.attrs[prop]);
			}
		}
		if(s_type==='checkbox') {
			var words = this.getValueShowWord(input_info.value);
			words.attrs = s_attrs;
			s_input = '<label title="%alt%"><input type="checkbox" value="%value%"%attrs%/>%show%</label>'.fill(words);
		} else if(s_type==='select') {
			s_input += '<select%1/>'.fill(s_attrs);
			if('value' in input_info && input_info.value[0]==='variables') {
				s_input += this.getVariableOptions(input_info.value);
			} else {
				s_input += this.getOptions(input_info.values);
			}
			s_input += '</select>';
		} else {
			s_input += '<input type="%1"%2/>'.fill(s_type, s_attrs);
		}
	} else if(this.types.combine.indexOf(s_type)>=0) {
		//	Conbined type
		var options_info = this.combineInfo[s_type];
		var options = [];
		for(i=0; i<options_info.length; i++) {
			options.push([
				idx + '-' + options_info[i].option[0], 
				options_info[i].option[1],
				options_info[i].option[0]
			]);
		}
		s_input += '<span class="yjd-fcss-combine yjd-fcss-combine-%1">'.fill(s_type)
			+'<input type="hidden" data-idx="%1"/>'.fill(idx)
			+'<select class="yjd-fcss-method-select">'
			+ this.getOptions(options, true) + '</select>';
		for(i=0; i<options_info.length; i++) {
			var pidx = options[i][0];
			var s_class = ((i==0)? 'yjd-cssed-selected': 'yjd-wdg-hidden');
			s_input += '<span class="%1 yjd-cssed-%2" data-idx="%3">'
				.fill(s_class, options[i][2], pidx);
			for(var j=0; j<options_info[i].input.length; j++) {
				s_input += this.getInput(options_info[i].input[j], pidx+'-'+j);
			}
			s_input += '</span>';
		}
		s_input += '</span>';
	} else {
		throw "Unknown type in CssEdit."+s_type;
	}
	return s_input;
};

yjd.wdg.CssEdit.prototype.getOptions = function(ar_values, b_mult) {
	var html = '';
	for(var i=0; i<ar_values.length; i++) {
		var words = this.getValueShowWord(ar_values[i]);
		if(b_mult) {
			words.show = ar_values[i][1];
			words.alt = '';
			words.selected = (i==0)? ' selected': '';
		}
		html += '<option value="%value%" title="%alt%"%selected%>%show%</option>'.fill(words);
	}
	return html;
};

yjd.wdg.CssEdit.prototype.getVariableOptions = function(ar_value) {
	var type = ar_value[1];
};

yjd.wdg.CssEdit.prototype.getValueShowWord = function(ar_value) {
	var obj = {};
	obj.value = yjd.htmlEscape(ar_value[0]);
	obj.show = ar_value[0];
	obj.alt = ar_value[1];
	if(this.options.displayMode==='desc') {
		obj.show = ar_value[1];
		obj.alt = ar_value[0];
	} else if(this.options.displayMode==='both') {
		var desc = ar_value[1];
		if(desc.hasPrefix(obj.value)) {
			desc = desc.substr(obj.value.length);
		}
		obj.show = obj.value;
		if(desc.length) {
			obj.show = "%1: %2".fill(obj.value, desc);
		}
	}
	return obj;
};


//
//	Read CSS Text Data
//

yjd.wdg.CssEdit.prototype.applyDataToWidget = function(selector) {
	if(!(selector in this.cssData)) this.cssData[selector] = {};
	var dataSet = this.cssData[selector];
	var rule;
	for(rule in this.ruleInfo) {
		var atmRoot = this.atms[this.ruleInfo[rule].category];
		var value = this.ruleInfo[rule].def_value;
		var atmItem = atmRoot.findOne('[data-name="%1"]'.fill(rule));
		var atmEnable = atmItem.findOne('[name="fcss-enable"]');
		atmEnable.val(false);
		if(rule in dataSet) {
			value = dataSet[rule][0];
			if(dataSet[rule][1]) atmEnable.val(true);
		}
		this.fillFields(atmItem, value);
		this.changeAppearance(atmItem);
		this.updateItemValue(atmItem);
	}
	var s_custom = '';
	for(rule in dataSet) {
		if(rule in this.ruleInfo) continue;
		s_custom += "%1: %2;\r\n".fill(rule, dataSet[rule][0]);
	}
	this.atms.custom.val(s_custom);
};

yjd.wdg.CssEdit.prototype.fillFields = function(atmItem, value) {
	var idx = atmItem.data('idx');
	var rule = atmItem.data('name');
	var cat = this.ruleInfo[rule].category;
	var inputInfo = this.ruleInfo[rule].input;
	var values = this.extractValue(value, inputInfo);
	if(!values) {
		yjd.atm('input[name="yjd-fcss-full"]', atmItem).val(value);
		yjd.atm('input[name="yjd-fcss-b-custom"]', atmItem).val(true);
		return;
	}
	var atmField = yjd.atm('.yjd-cssed-input-field', atmItem);
	var i=0;
	while(1) {
		var pidx = idx+'-' + i;
		var atmCell = yjd.atm('[data-idx="%1"]'.fill(pidx), atmField);
		if(!atmCell.elm) break;
		if(i < values.length) {
			fillafield(values[i], atmCell, pidx);
		} else {
			var empty_val = {
				type: inputInfo[i].type[0],
				values: ['', '', '', '', '']
			}
			fillafield(empty_val, atmCell, pidx);
		}
		i++;
	}
	//
	function fillafield(vls, atmCell, pidx) {
		if('subtype' in vls) {
			var parent = atmCell.parent('.yjd-fcss-combine');
			var atmMethodSelect = parent.findOne('.yjd-fcss-method-select');
			var selected = pidx+'-'+vls.subtype;
			atmMethodSelect.val(selected);
			var atmSelected = parent.findOne('[data-idx="%1"]'.fill(selected));
			for(var i=0 ; i<vls.values.length; i++) {
				var ppid = selected + '-' + i;
				var atmSub = atmSelected.findOne('[data-idx="%1"]'.fill(ppid));
				atmSub.val(vls.values[i]);
			}

		} else if(vls.type==='checkbox') {
			var set_val = (vls.values[0])? true: false;
			atmCell.val(set_val);
		} else {
			atmCell.val(vls.values[0]);
		}
	}
}

/**
 * Extract value string to object array.
 * an element has propaties as type as type name,
 * subtype for combined type, and values for an array of values.
 */
yjd.wdg.CssEdit.prototype.extractValue = function(value, inputInfo) {
	var arr = [];
	var i=0;
	var param = {valstr: value};
	while(param.valstr) {
		param.info = inputInfo[i];
		param.resolved = {};
		param.s_type = param.info.type[0];
		if(!this.resolveCombinedValue(param)) {
			if(!this.resolveSelectValue(param)) {
				return false;
			}
		}
		arr.push(param.resolved);
		param.valstr = param.valstr.trim();
		i++;
	}
	return arr;
};

yjd.wdg.CssEdit.prototype.resolveSelectValue = function(param){
	param.valstr = param.valstr.trim();
	var pos = param.valstr.indexOf(' ');
	var a_value = param.valstr;
	if(pos>=0) {
		a_value = param.valstr.substr(0, pos);
		param.valstr = param.valstr.substr(pos);
	} else {
		param.valstr = '';
	}
	if(!(param.s_type in this.combineInfo)) {
		return getValue(param, a_value, param.info);
	}
	var info = this.combineInfo[param.s_type];
	for(var i=0; i<info.length; i++) {
		var subtype = info[i].option[0];
		var subinfo = info[i].input[0];
		if(subinfo.type[0]==='select' || 
			(subinfo.type[0]==='checkbox' && subinfo.value[0]===a_value)) {

			if(getValue(param, a_value, subinfo, subtype)) {
				return true;
			}
		}
	}
	return false;

	//
	function getValue(param, a_value, info, subtype) {
		if('value' in info) {
			if(a_value!==info.value[0]) {
				if(param.s_type!=='checkbox') return false;
				param.valstr = a_value + ' ' + param.valstr;
				param.valstr.trim();
				a_value = null;
			}
		} else if('values' in info) {
			for(var j=0; j<info.values.length; j++) {
				if(info.values[j][0]===a_value) break;
			}
			if(j==info.values.length) return false;
		}
		param.resolved.type = param.s_type;
		param.resolved.values = [ a_value ];
		if(subtype) param.resolved.subtype = subtype;
		return true;
	}
};

yjd.wdg.CssEdit.prototype.resolveCombinedValue = function(param) {
	for(var prop in this.resolveCombinedValue.valRegx) {
		var test = this.resolveCombinedValue.valRegx[prop];
		var matched = test.regx.exec(param.valstr);
		if( matched && test.types.indexOf(param.s_type)>=0) {
			param.valstr = param.valstr.substr(matched[0].length);
			param.resolved.type = param.s_type;
			if(test.func) {
				param.resolved.values = test.func.call(this, matched);
				param.resolved.subtype = param.resolved.values.shift();
			} else {
				matched.shift();
				param.resolved.values = matched;
				param.resolved.subtype = prop;
			}
			return true;
		}
	}
	return false
}
	
yjd.wdg.CssEdit.prototype.resolveCombinedValue.valRegx = {
	var: {
		regx: /^\s*var\s*\([^\)]\)/,
		types: ['colordir', 'length', 'image'],
	},
	color24: {
		regx: /^\s*(#[\da-fA-F]{6})/,
		types: ['colordir'],
		func: function(matched) {
			return ['color_val', matched[1], 1];
		}
	},
	color12: {
		regx: /^\s*(#[\da-fA-F]{3})/,
		types: ['colordir'],
		func: function(matched) {
			var rgba = [];
			rgba[0] = Number('0x'+matched[1].substr(1,1)) * 255 / 15;
			rgba[1] = Number('0x'+matched[1].substr(1,2)) * 255 / 15;
			rgba[2] = Number('0x'+matched[1].substr(1,3)) * 255 / 15;
			rgba[3] = 1;
			vals = this.ColorNames.getColAlph(rgba);
			vals.unshift('color_val');
			return vals;
		}
	},
	color_rgb: {
		regx: /^\s*rgb\s*\(([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/,
		types: ['colordir'],
		func: function(matched) {
			var rgba = [];
			rgba[0] = Number(matched[1]);
			rgba[1] = Number(matched[2]);
			rgba[2] = Number(matched[3]);
			rgba[3] = 1;
			vals = this.ColorNames.getColAlph(rgba);
			vals.unshift('color_val');
			return vals;
		}
	},
	color_rgba: {
		regx: /^\s*rgba\s*\(([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/,
		types: ['colordir'],
		func: function(matched) {
			var rgba = [];
			rgba[0] = Number(matched[1]);
			rgba[1] = Number(matched[2]);
			rgba[2] = Number(matched[3]);
			rgba[3] = Number(matched[4]);
			vals = this.ColorNames.getColAlph(rgba);
			vals.unshift('color_val');
			return vals;
		}
	},
	length_val: {
		regx: /^\s*([+,-]?[\d\.]+)(px|%|em|rem|pt|mm|q|vw|vh|vmin|vmax|ex|ch|cm|in|pc)/,
		types: ['length'],
	},
	calc: {
		regx: /^\s*calc\s*\(([^\)]+)\)/,
		types: ['length'],
	},
	image: {
		regx: /^\s*url\s*\(\s*\"([^\"]+)\"\s*\)/,
		types: ['image'],
		func: function(matched) {
			var sub_type = (matched[1].substr(0,5)==='data:')? 'file': 'url';
			matched[0] = sub_type;
			return matched;
		}
	},
};
	
yjd.wdg.CssEdit.prototype.parseCss = function(text) {
	var obj = {};
	//	Remove comment.
	text = text.replace(/\/\*(\*[^\/]|[^\*])*\*\//g, '');	// @todo Test
	text = text.trim();
	while(text) {
		var matched = this.parseCss.rgxStart.exec(text);
		if(!matched) throw "CSS Parse error at: "+text;
		text = text.substr(matched[0].length);
		if(matched[1].indexOf('.yjd-')>=0) {
			var pos = text.indexOf('}');
			text = text.substr(pos+1).trim();
			continue;
		}
		var selectors = matched[1].split(',').map(function(str){
			return str.trim();
		});
		var objs = [];
		for(var i=0; i<selectors.length; i++) {
			if(!(selectors[i] in obj)) obj[selectors[i]] = {};
			objs.push(obj[selectors[i]]);
		}
		text = this.parseInnerCss(text, objs);
		matched = this.parseCss.rgxEnd.exec(text);
		if(!matched) throw "CSS Parse error at: "+text;
		text = text.substr(matched[0].length).trim();
	}
	return obj;
};

yjd.wdg.CssEdit.prototype.parseInnerCss = function(text, objs) {
	if(!(objs instanceof Array)) {
		objs = [objs];
	}
	while(1) {
		var matched = this.parseCss.rgxRule.exec(text);
		if(!matched) break;
		text = text.substr(matched[0].length);
		for(var i=0; i<objs.length; i++) {
			var key = matched[1].trim();
			var val = matched[2].trim();
			objs[i][key] = [val, true];
		}
	}
	return text;
};

//	Match for start of rule set 
yjd.wdg.CssEdit.prototype.parseCss.rgxStart = /^\s*([^\{]+)\{/;
//	Match for end of rule set or a rule.
yjd.wdg.CssEdit.prototype.parseCss.rgxEnd = /^\s*\}/;
//	Match for a rule.
yjd.wdg.CssEdit.prototype.parseCss.rgxRule = /^\s*([\w,-]+)\s*:\s*((url\(\"[^\"]*\"\))|((?!url\()[^;]+));/;

yjd.wdg.CssEdit.prototype.updateTools = function(text, objs) {
	yjd.atm('select.yjd-cssed-selector', this.atms.tools).html('');
	var arr = [''];
	for(var prop in this.cssData) {
		arr.push(prop);
	}
	this.addSelector(arr);
};

yjd.wdg.CssEdit.prototype.addSelector = function(selector) {
	if(!(selector instanceof Array)) selector = [selector];
	var select = yjd.atm('select.yjd-cssed-selector', this.atms.tools);
	for(var i=0; i<selector.length; i++) {
		select.append(
			'<option value="%1">%2</option>'.fill(selector[i], selector[i])
		);
	}
};

yjd.wdg.CssEdit.prototype.types = {
	'original': [
		'text', 'number', 'url', 'file',
		'range', 'hidden', 'checkbox', 'select', 'color', 'button'
	],
	'combine': ['length', 'colordir', 'image'],
};

yjd.wdg.CssEdit.prototype.StructurePreset = {
	border: [
		{
			name: ['border-style', '線種'],
			default: 'solid',
			input: [
				{
					type: ['select', '線種'],
					values: [
						['solid',	'実線'],
						['none',	'非表示・劣後'],
						['hidden',	'非表示・優先'],
						['dotted',	'点線'],
						['dashed',	'破線'],
						['double',	'二重線'],
						['ridge',	'凸線'],
						['groove',	'凹線'],
						['outset',	'凸領域'],
						['inset',	'凹領域']
					]
				}
			]
		},
		{
			name: ['border-color', '線色'],
			default: '#808080',
			input: [
				{ type: ['colordir', '色'] },
			]
		},
		{
			name: ['border-width', '線幅'],
			default: '1px',
			input: [
				{ type: ['length', '幅'] },
			]
		},
		{
			name: ['border-radius', '角丸'],
			default: '1em',
			input: [
				{ type: ['length', '半径'] },
			]
		},
		{
			name: ['box-shadow', '影'],
			default: '2px 2px 2px 3px rgba(0,0,0,0.5)',
			input: [
				{ type: ['length', '横ずれ'] },
				{ type: ['length', '縦ずれ'] },
				{ type: ['length', 'ぼかし'] },
				{ type: ['length', '拡がり'] },
				{ type: ['colordir', '影の色'] },
				{
					type: ['checkbox', '内側か'],
					value: ['inset', '内側'],
				},
			]
		}
	],
	background: [
		{
			name: ['background-color', '背景色'],
			default: 'transparent',
			input: [
				{ type: ['colordir', '色'] },
			]
		},
		{
			name: ['background-image', '背景画像'],
			default: 'url("/none.png")',
			input: [
				{ type: ['image', '画像'] },
			]
		},
		{
			name: ['background-size', '画像サイズ'],
			default: 'contain',
			input: [
				{
					type: ['select', ''],
					values: [
						['cover',	'余白なく拡大'],
						['auto',	'自動'],
						['contain',	'余白あり画像最大'],
						['[length]',	'サイズ指定'],
					]
				},
			]
		},
		{
			name: ['background-repeat', '画像の繰り返し'],
			default: 'no-repeat',
			input: [
				{
					type: ['select', ''],
					values: [
						['repeat',	'繰り返し'],
						['no-repeat',	'繰り返さない'],
						['round',	'繰り返し・拡大縮小で調整'],
						['space',	'繰り返し・スペースで調整'],
						['repeat-x', '横方向のみ繰り返し'],
						['repeat-y', '縦方向のみ繰り返し']
					]
				},
			]
		},
		{
			name: ['background-attachment', '背景のスクロール'],
			default: 'scroll',
			input: [
				{
					type: ['select', ''],
					values: [
						['local',	'コンテンツに同期'],
						['scroll',	'要素に固定'],
						['fixed',	'ビューに固定・透過的'],
					]
				},
			]
		},
		{
			name: ['background-position', '画像の合わせ位置'],
			default: 'center center',
			input: [
				{
					type: ['select', '横方向'],
					values: [
						['left', '左合わせ'],
						['center', '中央合わせ'],
						['right', '右合わせ'],
						['[length]', '位置指定']
					]
				},
				{
					type: ['select', '縦方向'],
					values: [
						['top', '上合わせ'],
						['center', '中央合わせ'],
						['bottom', '下合わせ'],
						['[length]', '位置指定']
					]
				},
			]
		},
		{
			name: ['background-clip', '表示する範囲'],
			default: 'padding-box',
			input: [
				{
					type: ['select', '範囲'],
					values: [
						['padding-box',	'境界上'],
						['border-box',	'マージンまで'],
						['content-box',	'パディングの内側だけ'],
					]
				},
			]
		},
		{
			name: ['background-origin', '位置合わせに使う範囲'],
			default: 'padding-box',
			input: [
				{
					type: ['select', '範囲'],
					values: [
						['padding-box',	'境界上'],
						['border-box',	'マージンの外'],
						['content-box',	'パディングの内側'],
					]
				},
			]
		},
	],
	outline: [
		{
			name: ['margin', 'マージン'],
			default: '0px 0px 0px 0px',
			input: [
				{ type: ['length', '上'] },
				{ type: ['length', '右'] },
				{ type: ['length', '下'] },
				{ type: ['length', '左'] },
			]
		},
		{
			name: ['padding', '余白'],
			default: '0px 0px 0px 0px',
			input: [
				{ type: ['length', '上'] },
				{ type: ['length', '右'] },
				{ type: ['length', '下'] },
				{ type: ['length', '左'] },
			]
		},
		{
			name: ['overflow', 'はみ出し処理'],
			default: 'auto',
			input: [
				{
					type: ['select', ''],
					values: [
						['auto',	'自動でスクロール表示'],
						['hidden',	'表示しない'],
						['visible',	'表示する'],
						['scroll',	'スクロール表示'],
					]
				},
			]
		},
		{
			name: ['overflow-x', '横はみ出し処理'],
			default: 'auto',
			input: [
				{
					type: ['select', ''],
					values: [
						['auto',	'自動でスクロール表示'],
						['hidden',	'表示しない'],
						['visible',	'表示する'],
						['scroll',	'スクロール表示'],
					]
				},
			]
		},
		{
			name: ['overflow-y', '縦はみ出し処理'],
			default: 'auto',
			input: [
				{
					type: ['select', ''],
					values: [
						['auto',	'自動でスクロール表示'],
						['hidden',	'表示しない'],
						['visible',	'表示する'],
						['scroll',	'スクロール表示'],
					]
				},
			]
		},
		{
			name: ['writing-mode', '縦書き'],
			default: 'vertical-rl',
			input: [
				{
					type: ['select', ''],
					values: [
						['vertical-rl',	'縦書き・右から左'],
						['horizontal-tb',	'横書き'],
						['vertical-lr',	'縦書き・左から右'],
					]
				},
			]
		},
		{
			name: ['width', '幅'],
			default: '100px',
			input: [
				{ type: ['length', '長さ'] }
			]
		},
		{
			name: ['max-width', '最大の幅'],
			default: '100px',
			input: [
				{ type: ['length', '長さ'] }
			]
		},
		{
			name: ['min-width', '最小の幅'],
			default: '100px',
			input: [
				{ type: ['length', '長さ'] }
			]
		},
		{
			name: ['height', '高さ'],
			default: '100px',
			input: [
				{ type: ['length', '長さ'] }
			]
		},
		{
			name: ['max-height', '最大の高さ'],
			default: '100px',
			input: [
				{ type: ['length', '長さ'] }
			]
		},
		{
			name: ['min-height', '最小の高さ'],
			default: '100px',
			input: [
				{ type: ['length', '長さ'] }
			]
		},
		{
			name: ['display', '表示形式'],
			default: 'block',
			input: [
				{
					type: ['select', ''],
					values: [
						['none', '非表示'],
						['inline', 'インライン要素'],
						['block', 'ブロック要素'],
						['list-item', 'リスト項目'],
						['inline-block', 'インラインのブロック'],
						['flex', 'フレックスコンテナ'],
						['inline-flex', 'インラインのフレックスコンテナ'],
						['table', '表要素'],
						['inline-table', 'インラインのテーブル'],
						['table-cell', '表のセル'],
						['table-row', '表の行'],
						['table-column', '表の列'],
						['table-caption', '表のキャプション'],
						['table-row-group', '表の行グループ'],
						['table-header-group', '表のヘッダグループ'],
						['table-footer-group', '表のフッタグループ'],
						['table-column-group', '表の列グループ'],
						['compact', '後続の左マージンに表示'],
						['run-in', '後続の先頭にインライン表示'],
						['ruby', 'ルビ'],
						['ruby-base', 'ルビのベース'],
						['ruby-text', 'ルビのテキスト'],
					]
				},
			]
		},
		{
			name: ['border-collapse', '枠線を重ねるか'],
			default: 'collapse',
			input: [
				{
					type: ['select', ''],
					values: [
						['collapse',	'重ねる'],
						['separate',	'分ける'],
					]
				},
			]
		},
		{
			name: ['border-spacing', '枠線の距離'],
			default: '4px 4px',
			input: [
				{ type: ['length', '左右'] },
				{ type: ['length', '上下'] },
			]
		},
		{
			name: ['position', '配置'],
			default: 'static',
			input: [
				{
					type: ['select', ''],
					values: [
						['static', '標準'],
						['relative', '相対移動'],
						['absolute', 'static以外の親を基準に独立'],
						['fixed', '固定'],
					]
				},
			]
		},
		{
			name: ['top', '上辺へのオフセット'],
			default: '0px',
			input: [
				{ type: ['length', ''] },
			]
		},
		{
			name: ['bottom', '下辺へのオフセット'],
			default: '0px',
			input: [
				{ type: ['length', ''] },
			]
		},
		{
			name: ['left', '左辺へのオフセット'],
			default: '0px',
			input: [
				{ type: ['length', ''] },
			]
		},
		{
			name: ['right', '右辺へのオフセット'],
			default: '0px',
			input: [
				{ type: ['length', ''] },
			]
		},
	],
	text: [
		{
			name: ['line-height', '行の高さ'],
			default: '1.4em',
			input: [
				{ type: ['length', ''] },
			]
		},
		{
			name: ['text-align', 'テキストの寄せ'],
			default: 'center',
			input: [
				{
					type: ['select', ''],
					values: [
						['left', '左寄せ'],
						['center', '中央寄せ'],
						['right', '右寄せ'],
						['start', '頭寄せ'],
						['end', '尻寄せ'],
						['justify', '均等割り'],
					]
				},
			]
		},
		{
			name: ['vertical-align', 'セルの縦揃え'],
			default: 'middle',
			input: [
				{
					type: ['select', ''],
					values: [
						['top', '左寄せ'],
						['middle', '中央寄せ'],
						['bottom', '右寄せ'],
						['baseline', '頭寄せ'],
					]
				},
			]
		},
		{
			name: ['white-space', '自動改行と空白の短縮'],
			default: 'nowrap',
			input: [
				{
					type: ['select', ''],
					values: [
						['normal', '改行・短縮'],
						['pre', '非改行・非短縮'],
						['nowrap', '非改行・短縮'],
						['pre-wrap', '改行・非短縮'],
						['pre-line', '改行・短縮（改行は保存）'],
					]
				},
			]
		},
		{
			name: ['word-break', '単語中の改行'],
			default: 'break-all',
			input: [
				{
					type: ['select', ''],
					values: [
						['normal', '英単語中非改行'],
						['break-all', 'どこでも改行'],
						['keep-all', '空白のみ改行'],
					]
				},
			]
		},
		{
			name: ['text-indent', '段落の最初の字下げ'],
			default: '0em',
			input: [
				{ type: ['length', '長さ'] },
			]
		},
		{
			name: ['word-spacing', '英単語間スペース'],
			default: '0.2em',
			input: [
				{ type: ['length', '長さ'] },
			]
		},
		{
			name: ['letter-spacing', '文字間スペース'],
			default: '0.1em',
			input: [
				{ type: ['length', '長さ'] },
			]
		},
		{
			name: ['text-justify', '均等割り'],
			default: 'newspaper',
			input: [
				{
					type: ['select', ''],
					values: [
						['auto', '自動'],
						['inter-ideograph', '漢字に適'],
						['newspaper', '単語間・文字間調整（英文に適）'],
						['inter-cluster', 'アジアの言語に適'],
						['kashida', 'アラビア語に適'],
						['inter-word', '単語間調整'],
						['distribute', '単語間・文字間調整'],
						['distribute-all-lines', '単語間・文字間調整（段落の最後も）'],
					]
				},
			]
		},
	],
	font: [
		{
			name: ['color', '文字色'],
			default: '#202020',
			input: [
				{ type: ['colordir', '色'] },
			]
		},
		{
			name: ['font-size', 'フォントの大きさ'],
			default: '1rem',
			input: [
				{ type: ['length', 'サイズ'] },
			]
		},
		{
			name: ['font-weight', 'フォントの太さ'],
			default: '500',
			input: [
				{
					type: ['select', ''],
					values: [
						['normal', '標準'],
						['bold', '太字'],
						['bolder', 'さらに太字'],
						['lighter', '細字'],
						['100', '100'],
						['200', '200'],
						['300', '300'],
						['400', '400（標準）'],
						['500', '500'],
						['600', '600'],
						['700', '700（太字）'],
						['800', '800'],
						['900', '900'],
					]
				},
			]
		},
		{
			name: ['font-style', 'フォントスタイル'],
			default: 'italic',
			input: [
				{
					type: ['select', ''],
					values: [
						['normal', '通常'],
						['italic', 'イタリック'],
						['oblique', '斜体'],
					]
				},
			]
		},
		{
			name: ['font-family', 'フォントの種類'],
			default: 'sans-serif',
			input: [
				{
					type: ['select', ''],
					values: [
						['"游ゴシック", YuGothic, "Yu Gothic", "HGPゴシックM", "ＭＳ Ｐゴシック", "MS PGothic", "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", Osaka, sans-serif', '游ゴシック基準'],
						['"メイリオ", Meiryo, "HGPゴシックM", "ＭＳ Ｐゴシック", "MS PGothic", "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", Osaka, sans-serif', 'メイリオ基準'],
						['"HGPゴシックM", "ＭＳ Ｐゴシック", "MS PGothic", "ヒラギノ角ゴ ProN W3", "Hiragino Kaku Gothic ProN", Osaka, sans-serif', 'ゴシック基準'],
						['"游明朝", YuMincho, "Yu Mincho", "ヒラギノ明朝 ProN W3", "Hiragino Mincho ProN", "HGP明朝B", "ＭＳ Ｐ明朝", "ＭＳ 明朝", serif', '游明朝基準'],
						['"ヒラギノ明朝 ProN W3", "Hiragino Mincho ProN", "HGP明朝B", "ＭＳ Ｐ明朝", "ＭＳ 明朝", serif', '明朝基準'],
						['serif', 'セリフ有り'],
						['sans-serif', 'セリフ無し'],
						['cursive', '筆記体'],
						['fantasy', '装飾'],
						['monospace', '等幅'],
					]
				},
			]
		},
		{
			name: ['font-feature-settings', 'OpenTypeの設定'],
			default: '"pwid"',
			input: [
				{
					type: ['text', ''],
				},
			]
		},
		{
			name: ['font-synthesis', 'フォントの自動生成'],
			default: 'weight style',
			input: [
				{
					type: ['checkbox', ''],
					value: ['weight', '太字の生成'],
				},
				{
					type: ['checkbox', ''],
					value: ['style', '指定スタイルの生成'],
				},
			]
		},
		{
			name: ['	font-stretch', 'フォントの幅選択'],
			default: 'normal',
			input: [
				{
					type: ['select', ''],
					values: [
						['ultra-condensed', '極幅狭'],
						['extra-condensed', 'さらに幅狭'],
						['condensed', '幅狭'],
						['semi-condensed', 'やや幅狭'],
						['normal', '標準'],
						['semi-expanded', 'やや幅広'],
						['expanded', '幅広'],
						['extra-expanded', 'さらに幅広'],
						['ultra-expanded', '極幅広'],
					]
				},
			]
		},
	]
};

yjd.wdg.CssEdit.prototype.infoCategory = [
	['background', '背景'],
	['border', '境界線'],
	['outline', 'アウトライン'],
];

yjd.wdg.CssEdit.prototype.combineInfo = {
	length: [
		{
			option: ['length_val', '数値で指定'],
			input: [
				{ type: ['number', '']},
				{
					type: ['select', ''],
					values: [
						['px',	'ピクセル(1/96in)'],
						['%',	'パーセント(一部無効)'],
						['em',	'要素のフォントサイズ基準'],
						['rem',	'ルートのフォントサイズ基準'],
						['pt',	'ポイント(1/72in)'],
						['mm',	'ミリメートル'],
						['q',	'Q値(1/4mm)'],
						['vw',	'ビューの幅基準(%)'],
						['vh',	'ビューの高さ基準(%)'],
						['vmin',	'ビューの小さい辺基準(%)'],
						['vmax',	'ビューの大きい辺基準(%)'],
						['ex',	'xの高さ基準'],
						['ch',	'0の幅基準'],
						['cm',	'センチメートル'],
						['in',	'インチ(25.4mm)'],
						['pc',	'パイカ(12pt)'],
					]
				},
			]
		},
		{
			option: ['calc', '計算式で指定'],
			input: [
				{ type: ['text', '']},
			]
		},
		{
			option: ['var', '変数で指定'],
			input: [
				{
					type: ['select', ''],
					value: ['variables', 'length']
				},
			]
		},
	],
	colordir: [
		{
			option: ['color_val', '色で指定'],
			input: [
				{
					type: ['color', ''],
				},
				{
					type: ['range', ''],
					attrs: {
						max: '1',
						min: '0',
						step: '0.025',
						title: '透明度'
					}
				},
			]
		},
		{
			option: ['color_name', '名前で指定'],
			input: [
				{
					type: ['select', ''],
					attrs: { class: 'yjd-colornames'},
					values: [
						['transparent', '透過'],
						/* colorname, desc*/
					]
				},
				{
					type: ['color', '並べ替え'],
					attrs: { class: 'ydj-fcss-avoid', name: 'fcss-colorsort'},
				},
			]
		},
		{
			option: ['var', '変数で指定'],
			input: [
				{
					type: ['select', ''],
					value: ['variables', 'color']
				},
			]
		},
	],
	image: [
		{
			option: ['file', 'ファイルで指定'],
			input: [
				{
					type: ['text', ''],
					attrs: {
						class: 'yjd-fcss-file-data',
						readonly: 'true'
					}
				},
				{
					type: ['file', ''],
					attrs: {class: 'yjd-wdg-hidden'}
				},
				{
					type: ['button', ''],
					attrs: {
						class: 'yjd-fcss-click-to-file-select',
						value: 'ファイル選択'
					}
				},
			]
		},
		{
			option: ['url', 'URLで指定'],
			input: [
				{ type: ['url', '']},
			]
		},
		{
			option: ['var', '変数で指定'],
			input: [
				{
					type: ['select', ''],
					value: ['variables', 'url']
				},
			]
		},
	]
};

(function(arr){
	var colorInfo = yjd.wdg.ColorNames.prototype.ColorInfo;
	for(var prop in colorInfo) {
		arr.push([prop, colorInfo[prop].name[1]]);
	}
}(yjd.wdg.CssEdit.prototype.combineInfo['colordir'][1].input[0].values));

yjd.wdg.CssEdit.prototype.SelectorOptions = [
	['>', '子要素'],
	['+', '続く要素'],
	['~', '後ろの要素'],
	['[=""]', '属性セレクタ'],
	[':hover', 'ポイント中'],
	[':active',  'クリック中'],
	[':forcus', 'フォーカス中'],
	[':before', '要素の前'],
	[':after', '要素の後'],
	[':first-child', '最初の要素'],
	[':last-child', '最後の要素'],
	[':nth-child()', '()番目の要素'],
	[':nth-last-child()', '後ろから()番目の要素'],
	[':not()', '()でない'],
	[':first-line', '最初の行'],
	[':first-letter', '最初の文字'],
];
yjd.wdg.CssEdit.prototype.Tags = [
	'a', 'abbr', 'address', 'area', 'article',
	'aside', 'audio', 'b', 'base', 'bdi',
	'bdo', 'blockquote', 'br', 'button', 'canvas',
	'caption', 'cite', 'code', 'col', 'colgroup',
	'command', 'data', 'datalist', 'dd', 'del',
	'dfn', 'div', 'dl', 'dt', 'em',
	'embed', 'fieldset', 'figcaption', 'figure', 'footer',
	'h1', 'h2', 'h3', 'h4', 'h5', 
	'head', 'header', 'hgroup', 'hr',
	'html', 'i', 'iframe', 'img', 'input',
	'kbd', 'keygen', 'label', 'legend', 'li',
	'link', 'main', 'map', 'mark', 'menu',
	'menuitem', 'meta', 'meter', 'nav', 'noscript',
	'object', 'ol', 'optgroup', 'option', 'output',
	'p', 'param', 'picture', 'pre', 'progress',
	'q', 'rb', 'rp', 'rt', 'rtc',
	'ruby', 's', 'samp', 'section', 'select',
	'small', 'source', 'span', 'strong', 'style',
	'sub', 'summary', 'sup', 'tbody', 'td',
	'template', 'textarea', 'tfoot', 'th', 'thead',
	'time', 'title', 'tr', 'track', 'u',
	'ul', 'var', 'video', 'wbr',
];


yjd.wdg.CssEdit.prototype.structureTemplate = {
	style: 'selector for the tag style storing.',
	root: 'selector for root node containing followings',
	border: 'selector for border inputs',
	background: 'selector for background',
	outline: 'selector for outline',
	font: 'selector for font',
	text: 'selector for text',
	custom: 'selector for custom area',
	tools: 'selector for total custom area',
	total: 'selector for total area',
};
