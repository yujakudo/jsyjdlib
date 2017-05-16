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

//	inherit yjd.obj.prototype.destroy
yjd.useMethods(yjd.wdg, yjd.obj, ['destroy']);

/**
 * explicitly release properties
 */
yjd.wdg.prototype.destroy = function() {
    if(this.atm) this.atm.remove();
    this.unbindAll();
	yjd.wdg.parent.destroy.call(this);
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
 * constructor.
 * @param {object} info data of wedgets as constructor, structure and options.
 * {
 * 	<name_of_wedget> : {
 * 		class:	<constructor of weget>,
 * 		structure:	{<structure of weget>},
 * 		options:	{<options of weget>}
 * 	},
 * 	:
 * }
 * @param {string|string[]} margeDataNames names of wedgets property 
 * object to marge to this container's property. 
 * these property must be object to avoid value missmatch.
 * @param {object} options options.
 * @param {object} def_options default of options.
 */
yjd.wdg.container = function(info, margeDataNames, options, def_options) {
    this.options = yjd.extend({}, def_options, options);
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
		this.wdgs[name] = new a_info.class(a_info.structure, a_info.options);
		for(i in this.margeDataNames) {
			copyProp.call(this, this.margeDataNames[i], this.wdgs[name]);
		}
	}
	//
	function copyProp(prop, wdg) {
		if(wdg[prop]===undefined) return;
		for(var idx in wdg[prop]) {
			if(this[prop][idx]) throw new Error('Property "'+idx+'" is dupricated when marge to container.');
			this[prop][idx] = wdg[prop][idx];
		}
	}
};

//	inherit yjd.obj
yjd.extendClass(yjd.wdg.container, yjd.obj);

yjd.createEachCallMethods(yjd.wdg.container, 'wdgs', [
	'show', 'hide', 'bind', 'unbindAll'
]);

/**
 * explicitly release properties
 */
yjd.wdg.container.prototype.destroy = function() {
	for(var name in this.wdgs) this.wdgs[name].destroy();
	yjd.wdg.container.parent.destroy.call(this);
};
