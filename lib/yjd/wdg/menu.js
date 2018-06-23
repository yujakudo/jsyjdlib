/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview menu widget
 * depend on wdg, sckey
 * @since  2017.05.03  initial coding.
 */

/**
 * @typedef yjd.menu.itemData	stored menu item data
 * @property {string} idx	Index
 * @property {yjd.atm} atm Element of the menu item that is LI tag.
 * @property {yjd.menu.itemData[]} children Children item's data.
 * @property {yjd.menu.itemData} parent Parent item's data.
 * @property {boolean} childOfBar Whether the item is child of bar menu or not.
 * @property {number} dir Direction of sub menu.
 * 	If bit of 2 is set, the vartical direction is up, otherwise down.
 * 	If bit of 1 is set, the horizontal direction is to left, otherwise to right.
 */
/**
 * @typedef yjd.wdg.Menu.structure.item
 * @desc Structute of each menu item.
 * @type {Object} [options] Options
 * @property {string} label label of menu item. if '-'(hyphen), it is considered as sepalator.
 * @property {boolean} [disable] Disable the item if true.
 * @property {string} [icon] HTML string of icon.
 * @property {yjd.key.code} [sckey] Code of short cut key.
 * @property {function} [callback] Callback function to be called when selected.
 * @property {*[]} [args] Arguments when call the callback. overwritten by options.args.
 * @property {yjd.wdg.Menu.structure.item[]} [submenu] Subnemu structure.
 */
/**
 * @typedef yjd.wdg.Menu.options
 * @desc Options of menu.
 * @type {Object} [options] Options
 * @property {string} [index] Index of root item.
 * @property {string} [type='popup'] Type of menu.
 *  It can takes 'popup' for popup menu, or 'bar' for bar tyoe menu.
 * @property {string} [class=null] Name of class to add the element of menu.
 * @property {boolean} [autoHide=false] Automaticaly hide menu when selected or leaved if true.
 * @property {boolean} [autoDestroy=false] Automaticaly destroy menu when selected or leaved if true.
 * @property {boolean} [rightToLeft=false] Display menu from right to left if true.
 * @property {boolean} [onlyIcon=false] HIde labels if true.
 * @property {*} [this] Object to be set 'this' in callback. if null or omitted, it becomes the menu instance.
 * @property {Object} [args] Arguments to overwrite arguments to call callbacks. use number typed index.
 * @property {yjd.Sckey} [Sckey] Instance of yjd.Sckey. to use short cut keys.
 * @property {yjd.Sckey.options} [sckeyOptions] Options when adding key defs to Sckey
 */
/**
 * constructor of menu.
 * @param {yjd.wdg.Menu.structure.item[]} structure structure of menu.
 * @param {yjd.wdg.Menu.options} [options] Options
 */
yjd.wdg.Menu = function(structure, options) {
	if(undefined===options.index) options.index = 'menu-' + yjd.getUniqueKey();
	this.data = {};
	this.sckey = {};
	this.mouseon = false;
	this.curItemData = null;
	this.root = { index: options.index, children: {}, parent: null	};
	this.data[options.index] = this.root;
	yjd.wdg.Menu.parent.constructor.call(this, structure, options, {
		type:       'popup',    //  type of menu, 'bar' or 'popup'
		class:      null,   //  class to be added tag
		autoHide:  false,  //  hide when clicked or leaved
		autoDestroy:  false,  //  destroy when clicked or leaved
		rightToLeft:false,  // show items right to left when bar-typed
		onlyIcon:   false,  //  hide label string of items at root of menu
		this:       null,   //  object set to be 'this' of callback. default is menu instance
		args:		{},		//  arguments to overwrite
		Sckey:		null,
		sckeyOptions:	null
	});
};

yjd.extendClass(yjd.wdg.Menu, yjd.wdg);


/**
 * explicitly release properties
 */
yjd.wdg.prototype.destroy = function() {
    if(this.options.Sckey) this.options.Sckey.remove(this.root.index);
    this.unbindAll();
	yjd.obj.prototype.destroy.call(this);
};


/**
 * sign for submenu.
 * @type {string}
 */
yjd.wdg.Menu.submenuChar = '≫';

/**
 * bind
 * @param {yjd.wdg.Menu.options} options Altanative options of this.
 */
yjd.wdg.Menu.prototype.bind = function(options) {
	if(options===undefined) options = this.options;
	this.events.mouseenter = this.atm.bind('mouseenter', this, mouseenter);
	this.events.mouseleave = this.atm.bind('mouseleave', this, mouseleave);
	this.events.mouseover = this.atm.bind('mouseover', this, mouseover);
    this.events.mouseout = this.atm.bind('mouseout', this, mouseout);
	this.events.click = this.atm.bind('click', this, onclick, true);
	//  end
	function mouseenter(event, atm) {
		this.mouseon = true;
	}
	function mouseleave(event, atm) {
		this.mouseon = false;
		if(options.autoHide) this.hide();
		if(options.autoDestroy) this.destroy();
	}
	function mouseover(event, atm) {
		var data = getItemData.call(this,event);
		if(!data) return;
		this.openSubmenu(data);
		event.stopPropagation();
	}
	function mouseout(event, atm) {
		var data = getItemData.call(this, event);
		if(!data) return;
		var atmSub = data.atm.child('ul');
		if(!atmSub.elm || !atmSub.hasClass('yjd-wdg-show')) return;
		atmSub.removeClass('yjd-wdg-show');
	}
	function onclick(event, atm) {
		var data = getItemData.call(this, event);
		if( data && this.doCallback(data) ) event.stopPropagation();
	}
	function getItemData(event) {
		var atm  = yjd.atm(event.target.closest('li'));
		if(!atm.elm) return false;
		var idx = atm.data('idx');
		if(!this.isEnable(idx)) return false;
		return this.data[idx];
	}
};

yjd.wdg.Menu.prototype.bindSckey = function(options) {
	var options = yjd.extend({
		onFocus:	yjd.wdg.Menu.prototype.onFocus,
		enforce:	fals
	}, this.options.sckeyOptions);
	var defs = [];
	var item = this.root;
	this.addSckey(this.atm, );

	function searchSckey(defs, item) {
		this.addKeyDefs(defs, item);
		for( var subitem in item.children) {
			searchSckey(defs, subitem);
		}
	}	ここまで。childrenは全てのdataにいらないので、appendを治す。
	function addKeyDefs(defs, data) {
		if( typeof data==='string') data = this.data[data];
		for( var subitem in data.children) {
			if(!subitem.sckey) continue;
			defs.push({
				index:	subitem.index,
				code:	subitem.sckey,
				args:	[ subitem ]
			});
		}
	};
};

/**
 * Unbind all event listeners
 */
yjd.wdg.prototype.unbindAll = function() {
	this.parent.unbindAll.call(this);
	if(this.options.Sckey) {
		this.options.Sckey.remove(this.root.index);
	}
};

/**
 * Callback funcsion when get or lost key focus.
 * @param {boolean} focus Value of fous
 */
yjd.wdg.Menu.prototype.onFocus = function(focus) {
	if(!focus) {
		this.closeSubmenu();
		if(this.options.autoHide) this.hide();
		if(this.options.autoDestroy) this.destroy();
	}
};

/**
 * When key downed, do callback function or open submenu.
 * @param {yjd.wdg.Menu.structure.item} data Item data.
 */
yjd.wdg.Menu.prototype.onKeydown = function(data) {
	if(!this.isEnable(data)) return;
	if(this.doCallback(data)) return;
	this.openSubmenu(data);
};

/**
 * Close submenus.
 * @param {yjd.wdg.Menu.structure.item} [nextData] Item data which contain a submenu to open.
 */
yjd.wdg.Menu.prototype.closeSubmenu = function(nextData) {
	var nextTree = [];
	var data = nextData;
	while(data) {	//	make a list of ancestors of next item.
		nextTree.push(data.index);
		data = data.parent;
	}
	data = this.curSubmenu;
	//	hide untile item in the list of ancestors found
	while(data && nextTree.indexOf(data.index)<0) {
		var atmSub = data.atm.child('ul');
		atmSub.removeClass('yjd-wdg-show');
		data = data.parent;
	}
	//	remove short cut keys of children of the node thats keys are remained.
	if(this.options.Sckey && data) this.options.Sckey.removeChildren(data.index);
	this.curSubmenu = null;
};

/**
 * Open a submenu
 * @param {yjd.wdg.Menu.structure.item} data Item data.
 * @return {boolean} Returns true if opened submenu. Otherwise fales.
 */
yjd.wdg.Menu.prototype.openSubmenu = function(data) {
	var atmSub = data.atm.child('ul');
	if(!atmSub.elm || atmSub.hasClass('yjd-wdg-show')) return false;
	if(this.curItemData) this.closeSubmenu(data);
	this.curItemData = data;
	atmSub.addClass('yjd-wdg-show');
	var scrRect = yjd.atm.getScreenRect(this.atm.parent('body'));
	var itemRect = new yjd.atm.rect(data.atm);
	var subRect = atmSub.getRect(itemRect);
	var firstRect = new yjd.atm.rect(atmSub.child(0));
	var borderWidth = firstRect.y - subRect.y;
	var dir = (data.parent)? (data.parent.dir) || 0: 0;
	var b_narrow = false;
	for(var i=0; i<2; i++) {
		if(dir & 0x01) {	//	from right to left
			if(data.childOfBar) subRect.right(0);
			else subRect.right(itemRect.w-borderWidth);
		} else {	//	from left to right
			if(data.childOfBar) subRect.left(0);
			else subRect.left(itemRect.w-borderWidth);
		}
		if(scrRect.x <= subRect.x && subRect.x+subRect.w <= scrRect.x+scrRect.w) break;
		dir ^= 0x01;	//	flip and retry
	}
	if(i===2) {
		b_narrow = true;
		if(dir & 0x01)	subRect.x = scrRect.x;
		else	subRect.x = scrRect.x + scrRect.w - subRect.w;
		dir ^= 0x01;
	}
	for(i=0; i<2; i++) {
		if(dir & 0x10) {	//	up
			if(data.childOfBar || b_narrow) subRect.bottom(itemRect.h);
			else subRect.bottom(-borderWidth);
		} else {	//	down
			if(data.childOfBar || b_narrow) subRect.top(itemRect.h);
			else subRect.top(-borderWidth);
		}
		if(scrRect.y <= subRect.y && subRect.y+subRect.w <= scrRect.y+scrRect.h) break;
		dir ^= 0x10;	//	flip and retry
	}
	if(i===2) {
		if(dir & 0x10) subRect.top(0);
		else subRect.bottom(0);
		dir ^= 0x10;
	}
	atmSub.style({top: subRect.top(), left: subRect.left()});
	data.dir = dir;
	this.addSckey(atmSub);
	return true;
};

/**
 * Do callback function on selected menu item.
 * @param {yjd.wdg.Menu.structure.item} data Item data.
 * @return {boolean} Returns true if execute callback. Otherwise fales.
 */
yjd.wdg.Menu.prototype.doCallback = function(data) {
	if(!data.callback) return false;
	var args = yjd.extend(data.args, options.args);
	var o_this = data.this || options.this || this;
	data.callback.apply(o_this, args);
	this.closeSubmenu();
	if(options.autoHide) this.hide();
	if(options.autoDestroy) this.destroy();
	return true;
};

/**
 * Check if menu item is enable.
 * @param {yjd.wdg.Menu.structure.item|string} item Item data, or string index of menu item
 * @return {boolean} Returns true if enable, or false if the item or ancestor is disable.
 */
yjd.wdg.Menu.prototype.isEnable = function(item) {
	if(typeof item==='string') item = this.data[item];
	if(!item || item.disable ) return false;
	while(item && !item.disable) item = item.parent;
	if(item) return false;
	return true;
};

/**
 * Get or set disable of menu item
 * @param {string} idx name of menu item
 * @param {boolean} b_disable disable if true.
 * @return {boolean|yjd.wdg.Menu} when b_disable is specified, set it and return this.
 * otherwise return boolean value as disabled or not.
 */
yjd.wdg.Menu.prototype.disable = function(idx, b_disable) {
	if(b_disable===undefined) return this.data[idx].disable;
	this.data[idx].disable = b_disable;
	var item = this.data[idx].atm;
	if(b_disable) {
		item.addClass('yjd-wdg-disabled');
	} else {
		item.removeClass('yjd-wdg-disabled');
	}
	return this;
};

/**
 * Get or set arguments to each item
 * @param {string} idx name of menu item
 * @param {any[]} args array of arguments.
 * @return {any[]|yjd.wdg.Menu} when args is specified, set it and return this.
 * otherwise return args of the item.
 */
yjd.wdg.Menu.prototype.args = function(idx, args) {
	if(args===undefined) return this.data[idx].args;
	this.data[idx].args = args;
	return this;
};

/**
 * get or set new label to each item
 * @param {string} idx name of menu item
 * @param {string} label HTML of label.
 * @return {string|yjd.wdg.Menu} when args is specified, set it and return this.
 * otherwise return label string of the item.
 */
yjd.wdg.Menu.prototype.label = function(idx, label) {
	if(label===undefined) return this.data[idx].label;
	this.data[idx].label = label;
	this.setIconAndLabel(this.data[idx], this.data[idx].atm);
	return this;
};

/**
 * get or set new icon to each item
 * @param {string} idx name of menu item
 * @param {string} icon html of icon.
 * @return {any[]|yjd.wdg.Menu} when args is specified, set it and return this.
 * otherwise return icon string of the item.
 */
yjd.wdg.Menu.prototype.icon = function(idx, icon) {
	if(icon===undefined) return this.data[idx].icon;
	this.data[idx].icon = icon;
	this.data[idx].atm.child(0).child(0).html(icon);
	return this;
};

/**
 * switch icon
 * @param {string} idx name of menu item
 * @param {boolean} value value shows on or off. toggled when not be set.
 * @return {boolean} new value
 */
yjd.wdg.Menu.prototype.switch = function(idx, value) {
	if(value===undefined) {
		value = !(this.data[idx].value);
	}
	this.data[idx].value = value;
	var icon = this.data[idx].atm.child(0).child(0);
	if(value) {
		icon.addClass('yjd-wdg-toggle-on');
		icon.removeClass('yjd-wdg-toggle-off');
	} else {
		icon.addClass('yjd-wdg-toggle-off');
		icon.removeClass('yjd-wdg-toggle-on');
	}
	return value;
};

/**
 * render
 * this called from yjd.wdg (constructor of parent class)
 * @param {yjd.wdg.Menu.structure.item[]} structure structure data
 * @param {yjd.wdg.Menu.options} options altanative options of this.
 */
yjd.wdg.Menu.prototype.render = function(structure, options) {
	if(options===undefined) options = this.options;
	this.atm = yjd.atm('<ul class="yjd-wdg"></ul>');
	//  classes
	this.atm.addClass('yjd-wdg-menu-'+options.type);
	if(options.class) this.atm.addClass(options.class);
	if(options.rightToLeft) {
		this.atm.addClass('yjd-wdg-menu-right-to-left');
	}
	if(options.onlyIcon) {
		this.atm.addClass('yjd-wdg-menu-onlyicon');
	}
	//  add items and submenu
	this.appendItems(structure, this.atm, options);
	return;
};

/**
 * Add menu items
 * @protected
 * @param {yjd.wdg.Menu.structure.item[]} structure Structure data.
 * @param {yjd.atm} atmMenu yjd.atm object of menu or submenu to contain items.
 * @param {yjd.wdg.Menu.options} [options] altanative options of this.
 * @return {string[]} indexes to add 'this.data'.
 */
yjd.wdg.Menu.prototype.appendItems = function(structure, atmMenu, options) {
	var idxList = [];
	var autoIdx = 0;
	var parent = atmMenu.parent();
	var pindex = parent? parent.data('idx'): this.root.index;
	var pobj = this.data[pindex];
	if(pindex) pindex += '-';
	for(var i in structure) {
		var data = structure[i];
		var index = data.index;
		if(!index) {
			index = pindex + autoIdx++;
		}
		var item = yjd.atm('<li></li>');
		item.data('idx', index);
		var disp = yjd.atm('<div class="yjd-wdg-menu-label">' +
			'<div class="yjd-wdg-menu-icon"></div>'+
			'<div class="yjd-wdg-menu-str"></div>'+
			'<div class="yjd-wdg-menu-key"></div>'+
			'<div class="yjd-wdg-menu-sub"></div></div>');
		item.append(disp);
		atmMenu.append(item);
		if(data.label==='-') {
			item.addClass('yjd-wdg-disabled');
			disp.child(1).html('<hr/>');
			continue;
		}
		if(!data.callback && !data.submenu) data.disable = true;
		if(data.disable) item.addClass('yjd-wdg-disabled');
		if(data.submenu) {
			idxList = idxList.concat( this.addSubMenu(data.submenu, item) );
		}
		newdata.call(this, index, data, item, pobj, options);
		idxList.push(index);
	}
	return idxList;
	//
	function newdata(index, structData, atm, pobj, options) {
		if(this.data[index]) {
			throw new Error('index "'+index+'" for menu '+this.options.class+'\'s item is already exists.');
		}
		var data = this.data[index] = {};
		for(var prop in structData) {
			if(prop==='index' || prop==='submenu' || !data.hasOwnProperty(prop)) continue;
			data[prop] = structData[prop];
		}
		data.idx = index;
		data.atm = atm;
		data.children = {};
		this.setIconAndLabel(data, item);
		data.parent = pobj;
		pobj.children['index'] = data;
		if(options) {
			data.childOfBar = options.type==='bar';
			data.dir = options.rightToLeft? 0x01: 0;
		}
	}
};

/**
 * Add submenu
 * @param {yjd.wdg.Menu.structure.item[]} structure Structure of submenu.
 * @param {yjd.atm|string} container yjd.atm object to append submenu.
 *  Or, string of item index is also avairable.
 * @return {string[]} indexes to add 'this.data'.
 */
yjd.wdg.Menu.prototype.addSubMenu = function(structure, container) {
	if(!(container instanceof yjd.atm)) container = this.data[container].atm;
	var submenu = container.child(1);
	if( !submenu.elm) submenu = yjd.atm('<ul class="yjd-wdg yjd-wdg-submenu yjd-wdg-hidden"></ul>');
	var idxList = this.appendItems(structure, submenu);
	container.append(submenu);
	container.child(0).child(-1).text(yjd.wdg.Menu.submenuChar);
	return idxList;
};

/**
 * Set icon, label, and short cut key.
 * @protected
 * @param {yjd.wdg.Menu.structure.item} data Data of menu  item.
 * @param {yjd.atm} item Atm object of the item
 * @return {string} Code of short cut key.
 */
yjd.wdg.Menu.prototype.setIconAndLabel = function(data, item) {
	var label = yjd.wdg.getLabelAndKey(data.label);
	var disp = item.child(0);
	if(data.icon) disp.child(0).html(data.icon).attr('title', label.title);
	disp.child(1).html(label.label);
	disp.child(2).html( yjd.Sckey.getKeyName(data.code) );
	if(label.key) item.data('key', label.key);
	data.key = label.key;
};

/**
 * Add short cut key set to Sckey.
 * @param {yjd.atm} menuAtm UL element of submenu.
 * @param {} options Options to add to default.
 */
yjd.wdg.Menu.prototype.addSckey = function(menuAtm, options) {
	if(!this.options.Sckey) return;
	var defs = [];
	menuAtm.children().each(this, function(item) {
		var keydef = {};
		var idx = item.data('idx');
		var data = this.data[idx];
		if(this.isEnable(data)) {
			keydef.index = data.index;
			keydef.code = data.sckey;
			keydef.args = [ data ];
			defs.push(keydef);
		}
	});
	options = yjd.extend({
		callback:	yjd.wdg.Menu.prototype.onKeydown,
		this:		this,
	}, options);
	this.options.Sckey.add(this.root.index, keydefs, options);
};
