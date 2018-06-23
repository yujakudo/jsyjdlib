/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview Selector of screen item by clicking
 * depend on yjd.atm
 * @since  2017.12.10  initial coding.
 */

/**
 * constructor of editables.
 * @param {Object} [options] Options
 */
yjd.wdg.Editables = function(structure, options) {
	this.structure = structure;
	this.events = [];
	this.modeOnOff = false;
	this.selectedAtm = null;
	this.s_selector = '';
	this.bindings = {};
	this.b_enable = false;
	this.options = yjd.extend({
		class_prefix: 'cl-',	//	Prefix to get class from node.
		callback:	null,	//	callback function. params are str method and name
		this:       null,   //  'This' value in the callback. default is this instance
		args:  [],          //  additional arguments for callback
	}, options);
};

/**
 * bind object
 * obj.enable(onoff)
 * obj.select(s_selector)
 */
yjd.wdg.Editables.prototype.bindObject = function(name, obj) {
	this.bindings[name] = obj;
	if(obj instanceof yjd.wdg.ClassList) {
		obj.options.callback = {
			func: callbackClassList,
			this: this,
			args: []
		};
	}
	//
	function callbackClassList(method, class_name, obj) {
		if(!this.modeOnOff) return;
		if(method==='added') {
			var cell = yjd.atm('.'+class_name, obj.atms.list);
			cell.addClass('yjd-editable-object');
			this.events.push(
				cell.bind('click', this, this.editableClick, false)
			);
		} else if(method==='removed') {
		}
	}
};

/**
 * Switch edit mode 
 */
yjd.wdg.Editables.prototype.editMode = function(onoff) {
	if(this.modeOnOff==onoff) return;
	if(onoff) {
		for(var i=0; i<this.structure.length; i++) {
			var root = yjd.atm(this.structure[i].root);
			root.addClass('yjd-editable-on');
			yjd.atms(this.structure[i].node, root).each(this, function(atm){
				atm.addClass('yjd-editable-object');
				this.events.push(
					atm.bind('click', this, this.editableClick, false)
				);
			});
		}
		this.select(this.s_selector);
		this.modeOnOff = true;
	} else {
		while(this.events.length) {
			yjd.atm.unbind(this.events.pop());
		}
		var classes = ['yjd-editable-on', 'yjd-editable-object', 'yjd-editable-selected'];
		for(var i=0; i<classes.length; i++) {
			yjd.atms('.'+classes[i]).each(function(atm){
				atm.removeClass(classes[i]);
			})
		}
		this.enable(false);
		this.modeOnOff = false;
	}
	//
};
yjd.wdg.Editables.prototype.editableClick = function(event, atm) {
	this.select(atm);
	event.stopPropagation();
};

/**
 * Set selector to update.
 */
yjd.wdg.Editables.prototype.select = function(selector) {
	this.selectionCursor(false);
	this.selectedAtm = null;
	this.s_selector = '';
	if(selector) {
		this.selectedAtm = yjd.atm(selector);
		if(!this.selectedAtm.elm) this.selectedAtm = null;
	}
	if(this.selectedAtm) {
		this.s_selector = yjd.wdg.getSelectorStr(selector, this.options.class_prefix);
		this.selectionCursor(true);
		this.enable(true);
	} else {
		this.enable(false);
	}
	this.callback('select', this.selectedAtm);
};

yjd.wdg.Editables.prototype.enable = function(onoff) {
	if(this.b_enable==onoff) return;
	this.b_enable = onoff;
	this.callback('enable', onoff);
};

yjd.wdg.Editables.prototype.selectionCursor = function(onoff) {
	if(onoff) {
		this.selectedAtm.addClass('yjd-editable-selected');
	} else if(this.selectedAtm) {
		this.selectedAtm.removeClass('yjd-editable-selected');
	}
};

yjd.wdg.Editables.prototype.callback = function(method, arg) {
	for(var prop in this.bindings) {
		this.bindings[prop][method](arg);
	}
	if(!this.options.callback) return undefined;
	var o_this = this.options.this || this;
	var args = [method, arg];
	args = args.concat(this.options.args);
	return this.options.callback.apply(o_this, args);
};

yjd.wdg.Editables.prototype.structureTemplate = [
	{ root: 'selector of root', node: 'selector of edtable node' },
	{ root: 'selector of root', node: 'selector of edtable node' },	
];