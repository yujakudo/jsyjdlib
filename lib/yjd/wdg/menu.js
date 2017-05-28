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
 * bind
 * @param {object} options Altanative options of this.
 */
yjd.wdg.Menu.prototype.bind = function(options) {
    if(options===undefined) options = this.options;
    this.events.mouseenter = this.atm.bind('mouseenter', this, mouseenter);
    this.events.mouseleave = this.atm.bind('mouseleave', this, mouseleave);
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
    function onclick(event, atm) {
        var itemAtm  = yjd.atm(event.target);
//        while(itemAtm.tag()!=='li') itemAtm = itemAtm.parent();
        if(itemAtm.tag()!=='li') itemAtm = itemAtm.parent('li');
        var idx = itemAtm.data('idx');
        if(!idx || !this.isEnable(idx)) return;
        event.stopPropagation();
        var item_data = this.data[idx];
        if(!item_data || item_data.disable) return;
        var args = yjd.extend(item_data.args, options.args);
        var o_this = options.this || this;
        item_data.callback.apply(o_this, args);
        if(options.autoHide) this.hide();
        if(options.autoDestroy) this.destroy();
    }
};

/**
 * Check if menu item is enable.
 * @param {string} idx name of menu item
 */
yjd.wdg.Menu.prototype.isEnable = function(idx) {
    var item = this.ata[idx];
    if(!item) return false;
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
    this.appendItems(structure, this.atm);
    return;
};

/**
 * Add menu items
 * @protected
 * @param {yjd.wdg.Menu.structure.item[]} structure Structure data.
 * @param {yjd.atm} atmMenu yjd.atm object of menu or submenu to contain items.
 * @return {string[]} indexes to add 'this.data'.
 */
yjd.wdg.Menu.prototype.appendItems = function(structure, atmMenu) {
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
        newdata.call(this, index, data, item, key, pobj);
        idxList.push(index);
    }
    return idxList;
    //
    function newdata(index, structData, atm, key, pobj) {
        if(this.data[index]) throw new Error('index "'+index+'" for menu '+this.options.class+'\'s item is already exists.')
        var data = this.data[index] = {};
        for(var prop in structData) {
            if(prop==='index' || prop==='submenu') continue;
            data[prop] = structData[prop];
        }
        data.atm = atm;
        data.key = key;
        data.parent = pobj;
    }
};

/**
 * Add submenu
 * @param {yjd.wdg.Menu.structure.item[]} structure Structure of submenu.
 * @param {yjd.atm|string} container yjd.atm object to append submenu.
 *  String of item index is also avairable.
 * @return {string[]} indexes to add 'this.data'.
 */
yjd.wdg.Menu.prototype.addSubMenu = function(structure, container) {
    if(!(container instanceof yjd.atm)) container = this.data[container].atm;
    var submenu = container.child(1);
    if( !submenu.elm) submenu = yjd.atm('<ul class="yjd-wdg yjd-wdg-submenu yjd-wdg-hidden"></ul>');
    var idxList = this.appendItems(structure, submenu);
    container.append(submenu);
    container.child(0).child(2).text('▶');
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
    var key = '';
    var label = data.label.replace(/_([a-zA-Z])/, function(matced, p1){
        key = p1.toLowerCase();
        return '<span class="yjd-wdg-underline">'+p1+'</span>';
    });
    var title = data.label.replace(/_([a-zA-Z])/, '$1');
    var disp = item.child(0);
    if(data.icon) disp.child(0).html(data.icon).attr('title', title);
    disp.child(1).html(label);
    if(label.key) item.data('key', key);
    return key;
};
