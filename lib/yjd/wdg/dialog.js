/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview dialog widget
 * depend on yjd.wdg.Button
 * @since  2017.06.10  initial coding.
 */

/**
 * @typedef {Object} yjd.wdg.Dialog.structure
 * @desc Structute of dialog.
 * @property {string} [title] HTML of title.
 * @property {string} [body] HTML of body.
 * @property {boolean} [autoTabIndex]	Set tab index automaticaly.
 * @property {yjd.wdg.Button.structure[]|string[]} [buttons] Array of button data or just a label string.
 */
/**
 * constructor of dialog box.
 * @param {yjd.wdg.Dialog.structure} structure structure of dialog box.
 * @param {Object} [options] Options
 */
yjd.wdg.Dialog = function(structure, options) {
	this.events = {};
	yjd.wdg.Dialog.parent.constructor.call(this, structure, options, {
		modal:		true,	//  modal(true) or modeless(false).
		zIndex:		20000,	//	z-index
		draggable:	true,	//	draggable
		autoHide:  false,  //  hide when clicked or leaved
		autoDestroy:  false,  //  destroy when clicked or leaved
		callback:	null,	//	callback function. it used when button's callback is not.
		this:       null,   //  'This' value in the callback. default is menu instance
		args:  {},          //  arguments to overwrite
	});
};

yjd.extendClass(yjd.wdg.Dialog, yjd.wdg);

/**
 * bind
 */
yjd.wdg.Dialog.prototype.bind = function() {
	var drag = {};
//	onMouseUp.call(this);
	this.events.click = yjd.atm('.yjd-wdg-buttons', this.atm)
		.bind('click', this, onClick, true);
	this.events.mousedown = yjd.atm('.yjd-wdg-title', this.atm)
		.bind('mousedown', this, onMouseDown, true);
	this.events.dragstart = yjd.atm('.yjd-wdg-dialog', this.atm)
		.bind('dragstart', this, dragStart, true);
//	this.events.drag = yjd.atm('.yjd-wdg-dialog', this.atm)
//		.bind('drag', this, dragging, true);
	this.events.dragend = yjd.atm('.yjd-wdg-dialog', this.atm)
			.bind('dragend', this, dragEnd, true);
	//
	function onClick(event, atm) {
		if(event.target.tagName!=='BUTTON') return;
		var idx = yjd.atm(event.target).data('idx');
		var button = this.structure.buttons[idx];
		if(typeof button!=='object') button = {};
		var callback = button.callback || this.options.callback;
		var o_this = button.this || this.options.this;
		var args = button.args || [idx];
		yjd.extend(args, this.options.args);
		if(callback) callback.apply(o_this, args);
		if(this.options.autoHide) this.atm.hide();
		if(this.options.autoDestroy) this.destroy();
	}
	function onMouseDown(event, atm) {
		drag.onHandle = true;
	}
	function dragStart(event, atm) {
		if(!drag.onHandle) {
			event.preventDefault();
			return;
		}
		drag.x = event.clientX;
		drag.y = event.clientY;
		this.atm.child(0).addClass('yjd-wdg-dragging');
		event.dataTransfer.dropEffect = 'move';
	}
	function dragging(event, atm) {
		var x = parseFloat(this.atm.child(0).style('left'));
		var y = parseFloat(this.atm.child(0).style('top'));
		x += event.clientX - drag.x;
		y += event.clientY - drag.y;
		this.atm.child(0).style({left:x.toString()+'px', top:y.toString()+'px'});
		drag.x = event.clientX;
		drag.y = event.clientY;
	}
	function dragEnd(event, atm) {
		dragging.call(this, event, atm);
		drag.onHandle = false;
		this.atm.child(0).removeClass('yjd-wdg-dragging');
	}
};

/**
 * Set position.
 * @param {number} [x] X. If negative, it is taken as distance from screen right side.
 * 	If not number or omitted, the box is set at horizontal center.
 * @param {number} [y] Y. If negative, it is taken as distance from screen bottom.
 * 	If not number or omitted, the box is set at vertical center.
 */
yjd.wdg.Dialog.prototype.setPos = function(x, y) {
	var scrRect = yjd.atm.getScreenRect();
	this.atm.style({
		width: scrRect.w.toString()+'px', height: scrRect.h.toString()+'px'
	});
	var base = 0;
	if(typeof x!=='number') x = null;
	else if(x<0) {
		x = -x;	base |= 1;
	}
	if(typeof x!=='number') y = null;
	else if(y<0) {
		y = -y;	base |= 2;
	}
	this.atm.child(0).setPos(x, y, this.atm, base);
};

/**
 * Append to specified element, bind, and set position.
 * @param {yjd.atm} atm Element,
 * @param {number} [x] X. If negative, it is taken as distance from screen right side.
 * 	If not number or omitted, the box is set at horizontal center.
 * @param {number} [y] Y. If negative, it is taken as distance from screen bottom.
 * 	If not number or omitted, the box is set at vertical center.
 */
yjd.wdg.Dialog.prototype.appendTo = function(atm, x, y) {
	atm.append(this.atm);
	this.bind();
	this.setPos(x,y);
};

/**
 * render
 * this called from yjd.wdg (constructor of parent class)
 */
yjd.wdg.Dialog.prototype.render = function(structure) {
	this.atm = yjd.atm([
		'<div class="yjd-wdg-dialog-base"><div class="yjd-wdg yjd-wdg-dialog">',
		'<div class="yjd-wdg-title"></div><hr/>',
		'<div class="yjd-wdg-body"></div><hr/>',
		'<div class="yjd-wdg-buttons"></div>',
		'</div></div>']);
	if(!this.options.modal) this.atm.addClass('yjd-wdg-dialog-modeless');
	if(this.options.draggable) {
		this.atm.child(0).attr('draggable', 'true');
	}
	this.setStructure(structure);
	return;
};

/**
 * Set new structure
 * @param {object} [structure] structure data
 */
yjd.wdg.Dialog.prototype.setStructure = function(structure) {
	this.structure = structure;
	var bShow = {};

	bShow.title = setHtml.call(this, '.yjd-wdg-title', structure.title);
	bShow.body = setHtml.call(this, '.yjd-wdg-body', structure.body);
	var tabIdx = 0;
	if(this.options.autoTabIndex || structure.buttons) {
		var input = yjd.atm('.yjd-wdg-body', this.atm).find('input,select,textarea,button');
		if(this.options.autoTabIndex) {
			input.each(this, function(atm){
				atm.attr('tabindex', ++tabIdx);
			});
		} else {
			tabIdx = input.elms.length;
		}
	}
	var btnContainer = yjd.atm('.yjd-wdg-buttons', this.atm);
	btnContainer.html('');
	bShow.buttons = false;
	if(structure.buttons) {
		for(var idx in structure.buttons) {
			var data = structure.buttons[idx];
			var label = (typeof data==='string')? data: data.label;
			var button = new yjd.wdg.Button(label);	//	rendering only
			button.setTabIndex(++tabIdx);
			button.atm.data('idx', idx);
			btnContainer.append(button.atm);
		}
		bShow.buttons = true;
	} else {
		setHtml.call(this, '.yjd-wdg-buttons', null);
	}
	var hrs = this.atm.find('hr');
	if(bShow.title && bShow.body) {
		hrs.item(0).removeClass('yjd-wdg-hidden');
	} else {
		hrs.item(0).addClass('yjd-wdg-hidden');
	}
	if(bShow.body && bShow.buttons) {
		hrs.item(1).removeClass('yjd-wdg-hidden');
	} else {
		hrs.item(1).addClass('yjd-wdg-hidden');
	}
	//
	function setHtml(selector, str) {
		var b_show = false;
		if(typeof str==='string') {
			yjd.atm(selector, this.atm)
				.html(str).removeClass('yjd-wdg-hidden');
			b_show = true;
		} else {
			yjd.atm(selector, this.atm).addClass('yjd-wdg-hidden');
		}
		return b_show;
	}
};
