/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview menu widget
 * @since  2017.05.03  initial coding.
 */

/**
 * constructor of menu.
 * @param {object} structure structure of menu.
 * {
 *  name: {         //  index of each menu item. it must be original in menu and each sub menu.
 *      icon: icon,         //  {string} optional. HTML string of icon.
 *      label: label,       //  {string} label string. '_' is recognized as short cut key.
 *      disable: disable,   //  {boolean} optional. set true when disable
 *      callback: callback, //  {function} faunction to be called when clicked.
 *      args: [arg1, ...],  //  {any[]} optional. arguments of callback
 *      submenu: {...},     //  {object} submenu object. its structure is same.
 *  },
 *  :
 * }
 * @param {object} options options.
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
 * @param {object} options altanative options of this.
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
        event.stopPropagation();
        if(event.target.tagName.toLowerCase()!=='li') return;
        var idx = yjd.atm(event.target).data('idx');
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
 * get or set disable of menu item
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
 * get or set arguments to each item
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
    appendItems.call(this, structure, this.atm);
    return;
    //
    function appendItems(structure, atmMenu) {
        for(var prop in structure) {
            var data = structure[prop];
            var item = yjd.atm('<li></li>');
            item.data('idx', prop);
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
            if(data.disable) item.addClass('yjd-wdg-disabled');
            if(data.submenu) {
                disp.child(2).text('▶');
                var atmSubmenu = yjd.atm('<ul class="yjd-wdg yjd-wdg-submenu yjd-wdg-hidden"></ul>');
                appendItems.call(this, data.submenu, atmSubmenu);
                item.append(atmSubmenu);
            }
            newdata.call(this, prop, data, item, key);
        }
    }
    function newdata(name, structData, atm, key) {
        var data = this.data[name] = {};
        for(var prop in structData) {
            if(prop==='submenu') continue;
            data[prop] = structData[prop];
        }
        data.atm = atm;
        data.key = key;
    }
};

/**
 * set icon and label
 * @param {object} data structure data of the item
 * @param {yjd.atm} item atm object of the item
 * @return {string} code of short cut key.
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
