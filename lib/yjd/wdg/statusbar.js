/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview class of status bar.
 * depend on yjd.wdg.menu
 * @since  2017.05.14  initial coding.
 */

/**
 * status bar
 * @param {object} info data of menus as constructor, structure and options.
 * {
 * 	<name_of_menu> : {
 * 		structure:	{<structure of weget>},
 * 		options:	{<options of weget>},
 *          place:      'left' or 'right', otherwise does not placed.
 * 	},
 * 	:
 * }
 * @param {object}  options options.
 */
yjd.wdg.Statusbar = function(info, options) {
    this.msgCount = 0;
    for(var i in info) {
        if(!info[i].class) info[i].class=yjd.wdg.Menu;
    }
    yjd.wdg.Statusbar.parent.constructor.call(this, info, 'data', options, {
        class:      null,   //  class to be added tag
        autoHide: { //  automaticaly erace message.
            enable: false,  //  set true to enable auto hide.
            delay:  30,     //  delay to erace massage in seconds.
            callback: null,  //  function to be calld when whenshowed or hided.
                            //  it is passed a boolean argument representing show(true) or hide(false).
        },
        this:       null,   //  value to pass as 'this' in callback. default is the instance.
        //  this value is applied for each menu when not specified.
    });
    for(i in this.wdgs) {
        if(!this.wdgs[i].options.this) this.wdgs[i].options.this = this.options.this;
    }
    if(typeof this.options.autoHideCallback==='string') {
        this.options.autoHideCallback = this.prototype[this.options.autoHideCallback];
    }
    this.render(info);
    this.b_show = false;
    this.show(true);
};

//	inherit yjd.wdg.container
yjd.extendClass(yjd.wdg.Statusbar, yjd.wdg.container);

/**
 * set show or hide and call callback
 * @param {boolean} value set show if true, or set hide.
 */
yjd.wdg.Statusbar.prototype.show = function(value) {
    if(this.b_show!=value && this.options.autoHide.enable && this.options.autoHide.callback) {
        var a_this = this.options.this || this;
        this.options.autoHide.callback.call(this, value);
    }
    this.b_show = value;
};

/**
 * set message
 * @param {string} str HTML of message
 */
yjd.wdg.Statusbar.prototype.msg = function(str) {
    this.msgAtm.html(str);
    this.show(true);
    if(this.options.autoHide){
        this.msgCount++;
        if(this.options.autoHide.enable) {
            yjd.timeout(this, autohide, this.autoHide.delay*1000);
        }
    }
    function autohide() {
        this.msgCount--;
        if(this.msgCount===0) this.msgAtm.html('');
        this.show(false);
    }
};

/**
 * render
 * this called from yjd.wdg (constructor of parent class)
 * @param {object} structure structure data
 */
yjd.wdg.Statusbar.prototype.render = function(structure) {
	this.atm = yjd.atm('<div class="yjd-wdg yjd-wdg-statusbar">'+
		'<div class="yjd-wdg-statusbar-left"></div>'+
		'<div class="yjd-wdg-statusbar-msg"><div></div></div>'+
		'<div class="yjd-wdg-statusbar-right"></div>'+
		'</div>');
    if(this.options.class) this.atm.addClass(this.options.class);
    this.msgAtm = yjd.atm('div.yjd-wdg-statusbar-msg>div', this.atm);
    var left = yjd.atm('div.yjd-wdg-statusbar-left', this.atm);
    var right = yjd.atm('div.yjd-wdg-statusbar-right', this.atm);
    for(var name in this.wdgs) {
        var place = this.wdgs[name].options.place;
        if(place==='left') {
            left.append(this.wdgs[name].atm);
            this.wdgs[name].atm.addClass('yjd-wdg-inpanel');
        } else if(place==='right') {
            right.append(this.wdgs[name].atm);
            this.wdgs[name].atm.addClass('yjd-wdg-inpanel');
        }
    }
};
