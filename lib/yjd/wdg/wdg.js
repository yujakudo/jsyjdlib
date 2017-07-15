/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview base class of widget
 * depend on yjd.atm
 * @since  2017.05.03  initial coding.
 */

/**
 * constructor.
 * @param {object} structure structure of widget.
 * @param {object} options options.
 * @param {object} def_options default of options.
 */
yjd.wdg = function(structure, options, def_options) {
    this.atm = null;
    this.events = {}; //    event handlers
    this.options = yjd.extend({}, def_options, options);
    this.render(structure);  //  set this.atm in this metod.
};

/**
 * explicitly release properties
 */
yjd.wdg.prototype.destroy = function() {
    if(this.atm) this.atm.remove();
    this.unbindAll();
	yjd.obj.prototype.destroy.call(this);
};

/**
 * bind event listeners
 * this should be overwritten.
 */
yjd.wdg.prototype.bind = function() {
};
/**
 * unbind all event listeners
 */
yjd.wdg.prototype.unbindAll = function() {
    for(var prop in this.events) {
        yjd.atm.unbind(this.events[prop]);
		delete this.events[prop];
    }
};

/**
 * show widget
 */
yjd.wdg.prototype.show = function() {
    this.atm.removeClass('yjd-wdg-hidden');
};

/**
 * hide widget
 */
yjd.wdg.prototype.hide = function() {
    this.atm.addClass('yjd-wdg-hidden');
};

/**
 * overwrite options
 * it can be called as wdg.setOptin({object}) or wdg.setOptin(key, val) 
 * @param {string|object} options object of options. or property name if value is set.
 * @param {any} value option value
 */
yjd.wdg.prototype.setOption = function(options, value) {
    if(value) {
        this.options[options] = value;
    } else {
        yjd.extend(this.options, options);
    }
};

/**
 * class of widgets container.
 */

/**
 * @typedef yjd.wdg.container.info.item
 * @desc Infomation of container.
 * @type {Object}
 * @property {function} constructor Constractor of item.
 * @property {Object} structure Structture of item.
 * @property {Object} options Options of item.
 */
/**
 * Constructor.
 * @param {yjd.wdg.container.info.item[]} info Data of each wedget, as constructor, structure and options.
 * @param {string|string[]} margeDataNames names of wedgets property 
 * object to marge to this container's property. 
 * these property must be object to avoid value missmatch.
 * @param {Object} options options.
 * @param {Object} def_options default of options.
 */
yjd.wdg.container = function(info, margeDataNames, options, def_options) {
    this.options = yjd.extend({}, def_options, options);	//	Options
	this.events = {};		//	Binded event handlers
	this.widgetName = {};	//	index to wedget name.
	//	prepare marged data.
	if(typeof margeDataNames==='string') margeDataNames = [margeDataNames];
	this.margeDataNames = margeDataNames || [];
	for(var i in this.margeDataNames) {
		this[this.margeDataNames[i]] = {};
	}
	//	new each wdg.
    this.wdgs = {};
	for(var name in info) {
		var a_info = info[name];
		this.wdgs[name] = new a_info.constructor(a_info.structure, a_info.options);
		for(i in this.margeDataNames) {
			this.margeData(this.margeDataNames[i], name);
		}
	}
};

//	inherit yjd.obj
yjd.extendClass(yjd.wdg.container, yjd.obj);

yjd.createEachCallMethods(yjd.wdg.container, 'wdgs', [
	'show', 'hide', 'bind'
]);

/**
 * Marge each widget data to the instances property.
 * Or, remove data.
 * @protected
 * @param {string} prop Name of proerty of the instance and widget
 * @param {string} wdgName Name of widget.
 * @param {string[]} [idxList] List of indexes of the property.
 * 	If omitted, copy all item in property of widget.
 * @param {boolean} [b_remove=false] If true, remove specified data in this and widget.
 */
yjd.wdg.container.prototype.margeData = function(prop, wdgName, idxList, b_remove) {
	if(b_remove===undefined) b_remove = false;
	var wdg = this.wdgs[wdgName];
	if(wdg[prop]===undefined) return;
	if(idxList) {
		for(var i in idxList) copyProp.call(this, prop, wdg, idxList[i]);
	} else {
		for(var idx in wdg[prop]) copyProp.call(this, prop, wdg, idx, b_remove);
	}
	//
	function copyProp(prop, wdg, idx, b_remove) {
		if(b_remove) {
			if(wdg[prop][idx]) delete wdg[prop][idx];
			if(this[prop][idx]) delete this[prop][idx];
			if(this.widgetName[idx]) delete this.widgetName[idx];
		} else {
			if(this[prop][idx]) throw new Error('Property "'+idx+'" is dupricated when marge to container.');
			this[prop][idx] = wdg[prop][idx];
			this.widgetName[idx] = wdgName;
		}
	}
};

/**
 * unbind all events
 */
yjd.wdg.container.prototype.unbindAll = function() {
	for(var name in this.wdgs) this.wdgs[name].unbindAll();
	yjd.wdg.prototype.unbindAll.call(this);
};

/**
 * explicitly release properties
 */
yjd.wdg.container.prototype.destroy = function() {
	for(var name in this.wdgs) this.wdgs[name].destroy();
	this.parent.destroy.call(this);
};

/**
 * Get label and key from underbared string of menus.
 * @param {string} str string.
 * @return {Object} Parameters.
 * @property {string} label HTML to be changed underbar charactor to the tag.
 * @property {string} key Charactor of underbared.
 * @property {string} title string to be removed underbar charactor.
 */
yjd.wdg.getLabelAndKey = function(str) {
	var rep = {};
	rep.label = str.replace(/_([a-zA-Z])/, function(matched, p1){
		rep.key = p1.toLowerCase();
		return '<span class="yjd-wdg-underline">'+p1+'</span>';
	});
	rep.title = str.replace(/_([a-zA-Z])/, '$1');
	return rep;
};
