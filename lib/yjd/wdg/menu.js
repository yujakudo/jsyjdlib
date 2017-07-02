/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview menu widget
 * @since  2017.05.03  initial coding.
 */


/**
 * @typedef {Object} yjd.wdg.Menu.structure.item
 * @desc Structute of each menu item.
 * @property {string} label label of menu item. if '-'(hyphen), it is considered as sepalator.
 * @property {boolean} [disable] Disable the item if true.
 * @property {string} [icon] HTML string of icon.
 * @property {function} [callback] Callback function to be called when selected.
 * @property {*[]} [args] Arguments when call the callback. overwritten by options.args.
 * @property {yjd.wdg.Menu.structure.item[]} [submenu] Subnemu structure.
 */
/**
 * constructor of menu.
 * @param {yjd.wdg.Menu.structure.item[]} structure structure of menu.
 * @param {Object} [options] Options
 * @param {string} [options.type='popup'] Type of menu.
 *  It can takes 'popup' for popup menu, or 'bar' for bar tyoe menu.
 * @param {string} [options.class=null] Name of class to add the element of menu.
 * @param {boolean} [options.autoHide=false] Automaticaly hide menu when selected or leaved if true.
 * @param {boolean} [options.autoDestroy=false] Automaticaly destroy menu when selected or leaved if true.
 * @param {boolean} [options.rightToLeft=false] Display menu from right to left if true.
 * @param {boolean} [options.onlyIcon=false] HIde labels if true.
 * @param {*} [options.this] Object to be set 'this' in callback. if null or omitted, it becomes the menu instance.
 * @param {Object} [options.args] Arguments to overwrite arguments to call callbacks. use number typed index.
 */
yjd.wdg.Menu = function(structure, options) {
	this.data = {};
	this.onmouse = false;
	yjd.wdg.Menu.parent.constructor.call(this, structure, options, {
		type:       'popup',    //  type of menu, 'bar' or 'popup'
		class:      null,   //  class to be added tag
		autoHide:  false,  //  hide when clicked or leaved
		autoDestroy:  false,  //  destroy when clicked or leaved
		rightToLeft:false,  // show items right to left when bar-typed
		onlyIcon:   false,  //  hide label string of items at root of menu
		this:       null,   //  object set to be 'this' of callback. default is menu instance
		args:  {},          //  arguments to overwrite
	});
};

yjd.extendClass(yjd.wdg.Menu, yjd.wdg);

/**
 * sign for submenu.
 * @type {string}
 */
yjd.wdg.Menu.submenuChar = '≫';

/**
 * bind
 * @param {object} options Altanative options of this.
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
		event.stopPropagation();
		var atmSub = data.atm.child('ul');
		if(!atmSub.elm || atmSub.hasClass('yjd-wdg-show')) return;
		atmSub.addClass('yjd-wdg-show');
		var scrRect = yjd.atm.getScreenRect(this.atm.parent('body'));
		var itemRect = new yjd.atm.rect(data.atm);
		var subRect = atmSub.getRect(itemRect);
		var firstRect = new yjd.atm.rect(atmSub.child(0));
		var borderWidth = firstRect.y - subRect.y;
		var dir = (data.parent)? data.parent.dir || 0: 0;
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
	}
	function mouseout(event, atm) {
		var data = getItemData.call(this,event);
		if(!data) return;
		var atmSub = data.atm.child('ul');
		if(!atmSub.elm || !atmSub.hasClass('yjd-wdg-show')) return;
		atmSub.removeClass('yjd-wdg-show');
	}
	function onclick(event, atm) {
		var data = getItemData.call(this,event);
		if(!data) return;
		event.stopPropagation();

		if(!data.callback) return;
		var args = yjd.extend(data.args, options.args);
		var o_this = data.this || options.this || this;
		data.callback.apply(o_this, args);
		if(options.autoHide) this.hide();
		if(options.autoDestroy) this.destroy();
	}
	function getItemData(event) {
		var atm  = yjd.atm(event.target.closest('li'));
		if(!atm.elm) return false;
		var idx = atm.data('idx');
		if(!this.isEnable(idx)) return false;
		return this.data[idx];
	}
};

/**
 * Check if menu item is enable.
 * @param {string} idx name of menu item
 * @return {boolean} Returns true if enable, or false if the item or ancestor is disable.
 */
yjd.wdg.Menu.prototype.isEnable = function(idx) {
	var item = this.data[idx];
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
	var key = this.setIconAndLabel(this.data[idx], this.data[idx].atm);
	this.data[idx].key = key;
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
 * @param {object} structure structure data
 * @param {object} options altanative options of this.
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
 * @param {object} [options] altanative options of this.
 * @return {string[]} indexes to add 'this.data'.
 */
yjd.wdg.Menu.prototype.appendItems = function(structure, atmMenu, options) {
	var idxList = [];
	var autoIdx = 0;
	var parent = atmMenu.parent();
	var pindex = parent? parent.data('idx'): '';
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
			'<div class="yjd-wdg-menu-sub"></div></div>');
		item.append(disp);
		atmMenu.append(item);
		if(data.label==='-') {
			item.addClass('yjd-wdg-disabled');
			disp.child(1).html('<hr/>');
			continue;
		}
		var key = this.setIconAndLabel(data, item);
		if(!data.callback && !data.submenu) data.disable = true;
		if(data.disable) item.addClass('yjd-wdg-disabled');
		if(data.submenu) {
			idxList = idxList.concat( this.addSubMenu(data.submenu, item) );
		}
		newdata.call(this, index, data, item, key, pobj, options);
		idxList.push(index);
	}
	return idxList;
	//
	function newdata(index, structData, atm, key, pobj, options) {
		if(this.data[index]) {
			throw new Error('index "'+index+'" for menu '+this.options.class+'\'s item is already exists.');
		}
		var data = this.data[index] = {};
		for(var prop in structData) {
			if(prop==='index' || prop==='submenu') continue;
			data[prop] = structData[prop];
		}
		data.idx = index;
		data.atm = atm;
		data.key = key;
		data.parent = pobj;
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
 * Set icon and label
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
	if(label.key) item.data('key', label.key);
	return label.key;
};
