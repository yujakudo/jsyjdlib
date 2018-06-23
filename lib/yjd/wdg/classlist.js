/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview ClassList widget
 * depend on yjd.atm, yjd.str
 * @since  2017.12.10  initial coding.
 */

/**
 * constructor of ClassList box.
 * @param {yjd.wdg.ClassList.structure} structure structure of ClassList box.
 * @param {Object} [options] Options
 */
yjd.wdg.ClassList = function(structure, options) {
	this.events = {};
	this.select_events = {};
	this.structure = structure;
	this.classes = [];
	this.selectedAtm = null;
	this.b_enable = false;
	this.b_select_enable = false;
	this.options = yjd.extend({
		reserved:	[],		//	Reserved class names
		class_prefix: 'cl-',	//	Prefix of name of new class
		class_of_list: '',	//	Extra class of list items.
		callback:	null,	//	callback function. params are str method and name
	}, options);
	this.render(this.structure);
};

yjd.wdg.ClassList.prototype.attach = function() {
	for(var cat in this.atms) {
		if(this.structure[cat]) {
			yjd.atm(this.structure[cat]).append(this.atms[cat]);
		}
	}
	this.atms.root = yjd.atm(this.options.editable_root);
	this.bind();
};

yjd.wdg.ClassList.prototype.select = function(selector) {
	this.selectedAtm = yjd.atm(selector);
	if(!this.selectedAtm.elm) this.selectedAtm = null;
	this.enable(undefined);
	if(this.selectedAtm) {
		var rel_classes = this.selectedAtm.class().split(' ');
		var classes = [];
		for(var i=0; i<rel_classes.length; i++) {
			if(this.classes.indexOf(rel_classes[i])>=0
				&& this.options.reserved.indexOf(rel_classes[i])<0) {
				classes.push(rel_classes[i]);
			}
		}
		yjd.atm('select', this.atms.select).val(classes);
	}
};

yjd.wdg.ClassList.prototype.enable = function(onoff) {
	if(onoff!==undefined) this.b_enable = onoff;
	var selectable = this.b_enable && this.selectedAtm && this.selectedAtm.elm.id;
	if(this.b_select_enable == selectable) return;
	this.b_select_enable = selectable;
	if(selectable) {
		yjd.atm('select', this.atms.select).removeAttr('disabled');
		this.atms.select.removeClass('yjd-wdg-disabled');
	} else {
		yjd.atm('select', this.atms.select).attr('disabled', 'true');
		this.atms.select.addClass('yjd-wdg-disabled');
	}
};

/**
 * bind
 */
yjd.wdg.ClassList.prototype.bind = function() {
	this.addClass(this.options.reserved);
	if(this.options.editable_node) {
		yjd.atms(this.options.editable_node, this.atms.root).each(this, function(atm) {
			var classes = atm.class().split(' ');
			for(var i=0; i<this.classes.length; i++) {
				var name = this.classes[i];
				if(name.substr(0,this.options.class_prefix.length)!==this.options.class_prefix) continue;
				this.addClass(name);
			}
		});
	}
	this.events.new_click = yjd.atm('.yjd-cltools-new button', this.atms.tools)
		.bind('click', this, onNewClick, true);
	this.events.remove_click = yjd.atm('.yjd-cltools-remove button', this.atms.tools)
		.bind('click', this, onRemoveClick, true);
	this.events.remove_click = yjd.atm('select', this.atms.select)
		.bind('change', this, onChange, true);
	//
	function onNewClick(event, atm) {
		var nameAtm = atm.parent().child('input[type="text"]');
		var name = this.options.class_prefix + nameAtm.val();
		if(this.classes.indexOf(name)>=0) return;	
		this.addClass(name);
		nameAtm.val('');
	}
	function onRemoveClick(event, atm) {
		var name = atm.parent().child('select').val();
		this.removeClass(name);
	}
	function onChange(event, atm) {
		if(!this.selectedAtm) return;
		var classes = this.selectedAtm.class().split(' ');
		var name, i;
		for(i=0; i<this.classes.length; i++) {
			name = this.classes[i];
			if(name.substr(0,this.options.class_prefix.length)!==this.options.class_prefix) continue;
			if(classes.indexOf(name)<0) continue;
			this.selectedAtm.removeClass(name);
		}
		var values = atm.val();
		if(values) {
			for(i=0; i<values.length; i++) {
				this.selectedAtm.addClass(values[i]);
			}
		}
	}
};

yjd.wdg.ClassList.prototype.addClass = function(name) {
	if(name instanceof Array) {
		for(var i=0; i<name.length; i++) this.addClass(name[i]);
		return;
	}
	if(name.substr(0,1)==='.') name = name.substr(1);
	if(this.classes.indexOf(name)>=0) return;

	this.classes.push(name);
	var a_class = name + ((this.options.class_of_list)? ' '+this.options.class_of_list: '');
	this.atms.list.append('<div class="%1">%2</div>'.fill(a_class, name));
	var opt = '<option value="%1">%2</option>'.fill(name, name);
	if(this.options.reserved.indexOf(name)<0) {
		//	if not reserved, add to select
		yjd.atm('select', this.atms.select).append(opt);
		yjd.atm('.yjd-cltools-remove select', this.atms.tools).append(opt);
	}
	this.select_events[name] = yjd.atm('.'+name, this.atms.list).bind('click', this, onClickClass, true);
	this.callback('added', name);
	//
	function onClickClass(event, atm) {
		this.callback('selected', atm.class());
	}
};

yjd.wdg.ClassList.prototype.removeClass = function(name) {
	var idx = this.classes.indexOf(name);
	if(idx<0 || this.options.reserved.indexOf(name)>=0) return;
	yjd.atm.unbind(this.select_events[name]);
	delete this.select_events[name];
	this.atms.list.child('.'+name).remove();
	var opt = 'option[value="%1"]'.fill(name);
	yjd.atm('select', this.atms.select).findOne(opt).remove();
	yjd.atm('select', this.atms.tools).findOne(opt).remove();
	yjd.atms('.'+name, this.atms.root).each(function(atm) {
		atm.removeClass(name);
	});
	delete this.classes[idx];
	this.callback('removed', name, this);
};

yjd.wdg.ClassList.prototype.callback = function(method, name) {
	if(!this.options.callback) return undefined;
	var o_this = this.options.callback.this || this;
	var args = [method, name, this];
	args = args.concat(this.options.callback.args);
	return this.options.callback.func.apply(o_this, args);
};

/**
 * render
 * this called from yjd.wdg (constructor of parent class)
 */
yjd.wdg.ClassList.prototype.render = function(structure) {
	this.atms = {};
	for(var prop in this.Template) {
		var html = this.Template[prop].join('');
		html = html.fill(this.options.class_prefix);
		this.atms[prop] = yjd.atm(html);
	}
	return;
};

yjd.wdg.ClassList.prototype.Template = {
	list: [
		'<div class="yjd-wdg-classlist"></div>',
	],
	select: [
		'<div class="yjd-wdg-classlist-select yjd-wdg-disabled">',
		'<select multiple disabled></select>',
		'</div>',
	],
	tools: [
		'<div class="yjd-wdg-classlist-tools">',
		'<div class="yjd-cltools-new">',
		'%1<input type="text"><button>Add</button>',
		'</div>',
		'<div class="yjd-cltools-remove">',
		'<select></select><button>Remove</button>',
		'</div>',
		'</div>',
	],
};

yjd.wdg.ClassList.prototype.structureTemplate = {
	editable_root: 'selector for root node containing followings',
	list: 'selector for border inputs',
	select: 'selector for select classes',
	tools: 'selector for tools',
};
