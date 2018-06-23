/**
 * @copyright  2017 yujakudo
 * @license    MIT License
 * @fileoverview dialog widget
 * depend on yjd.wdg, yjd.mimetypes
 * @since  2018.04.11  initial coding.
 */

/**
 * @typedef {Object} yjd.wdg.File.structure
 * @desc Structute of dialog.
 * @property {string} [title] HTML of title.
 * @property {string} [body] HTML of body.
 * @property {boolean} [autoTabIndex]	Set tab index automaticaly.
 * @property {yjd.wdg.Button.structure[]|string[]} [buttons] Array of button data or just a label string.
 */
/**
 * constructor of dialog box.
 * @param {yjd.wdg.File.structure} structure structure of dialog box.
 * @param {Object} [options] Options
 * @param {function} [options.onBussy] Callback function when status of bussy chainges.
 * 	Arguments are boolean value whether be bussy, and the yjd.wdg.List object.
 * @param {Object} [options.this] Value of 'this' in callbacks.
 */
yjd.wdg.File = function(structure, options) {
	this.events = {};
	yjd.wdg.File.parent.constructor.call(this, structure, options, {
		autoHide: true,
		preview: true,
		containerType: 'block',	//	or 'inline'
		accept: null,
		fileNameName: 'f_file_name',
		fileDataName: 'f_file_data',
		maxSize: '5mb',
		onBussy: null,
		this: null,
	});
	this.present = this.newFileObject();
	this.set = this.newFileObject();
	this.bussyCount = 0;
};

yjd.extendClass(yjd.wdg.File, yjd.wdg);

/**
 * Is file type supported by HTML?
 * @param {string|object} type MIME type or Extracted object by @see yjd.typeInfo
 * @return boolean True if supported
 */
yjd.wdg.File.isSupportedType = function(type) {
	var acceptable = {
		'image': ['bmp', 'jpeg', 'png', 'gif', 'svg+xml', ],
		'video': ['webm', 'ogg', 'mp4',],
		'audio': [
			'webm', 'ogg', 'mp3', 'wave', 'wav', 'x-wav', 'x-pn-wav',
			'flac', 'x-flac', 
		],
		'text': null,
	};
	if(typeof type==='string') {
		type = yjd.typeInfo(type);
	}
	if(!acceptable.hasOwnProperty(type.top)) return false;
	var list = acceptable[type.top];
	if(list && list.indexOf(type.next)<0) return false;
	return true;
};

/**
 * Get size in byte.
 * @param {number|string} size
 */
yjd.wdg.File.getByte = function(size) {
	if(typeof size==='string') {
		if(size.match(/^\s*([\d\.]+)\s*([\w]*)/i)) {
			size = Number(RegExp.$1);
			switch(RegExp.$2.substr(0,1).toUpperCase()) {
				case 'G': size *= 1024;
				case 'M': size *= 1024;
				case 'K': size *= 1024;
				default:
			}
		} else {
			size = 0;
		}
	}
	return size;
};

/**
 * Get string for file size.
 * @param {number|string} size
 * @return {string}
 */
yjd.wdg.File.getSizeStr = function(size) {
	size = yjd.wdg.File.getByte(size);
	var units = ['B', 'KB', 'MB', 'GB'];
	size = Math.floor(size);
	for(var i=0; i<4; i++) {
		if(size<1024) break;
		size = Math.floor(size / 1024);
	}
	return ''+size+units[i];
};

/**
 * Test enter file object to input file element.
 */
yjd.wdg.File.prototype.testFile = function() {
	var s_type = 'application/json';
	var dt = new DataTransfer();
	dt.setData(s_type, '');
//	var test = new File([], 'test', {type: s_type});
	this.atms.file.files = dt.files;
	this.b_ableSet = false;
	if(this.atms.file.files[0].type===s_type) this.b_ableSet = true;
	this.atms.file.val('');
};

/**
 * Create new object.
 */
yjd.wdg.File.prototype.newFileObject = function(opt) {
	var obj = {name: null, url:null, type: null, size: null, status: null, file: null};
	yjd.extend(obj, opt);
	if(typeof obj.type==='string') obj.type = yjd.typeInfo(obj.type);
	return obj;
};

/**
 * Set present file URL.
 * @param {string} name File name.
 * @param {string} url URL.
 */
yjd.wdg.File.prototype.setPresentFile = function(name, url) {
	this.present = newFileObject({
		name: name, url: url, status: 'loading',
	});
	yjd.atm('a.yjd-wdg-file-download').attr('href', url).attr('download', name);
	yjd.atm('[name="download"]', this.atms.buttons).removeAttr('disabled');
	yjd.atm('[name="delete"]', this.atms.buttons).removeAttr('disabled');
	this.preview();
	this.checkBussy(true);
	yjd.ajax({
		url: url,
		headers: {
			'Range': 'bytes=0-0'
		}
	},this)
	.done(function(data, status, xhr) {
		var s_type = xhr.getResponseHeader("Content-Type");
		this.present.type = yjd.typeInfo(s_type);
		var s_range = xhr.getResponseHeader("Content-Range");
		if(s_range.match(/bytes ([\d]+)\-([\d]+)\/([\d]+)/)) {
			this.present.size = yjd.wdg.File.getByte(RegExp.$3);
		}
		var s_desc = xhr.getResponseHeader("Content-Disposition");
		if(s_range.match(/filename="([^\"]+)"/)) {
			this.present.name = RegExp.$1;
		}
		this.present.status = null;
		if(!this.set.size) this.preview();
	}).fail(function(xhr, status, arg) {
		if(400<=status && status<500) {
			yjd.atm('button[name="download"]', this.atm).attr('disabled','disabled');
		}
		this.present.status = 'fail';
		if(!this.set.size) this.preview();
	}).always(function(){
		this.checkBussy(false);
	});
};

/**
 * bind
 */
yjd.wdg.File.prototype.bind = function() {
	this.events.keydownName = this.atms.name.bind('keydown', this, onKeyDown, true);
	this.events.focusName = this.atms.name.bind('focus', this, onFocus, true);
	this.events.blurName = this.atms.name.bind('blur', this, onBlur, true);

	var atmBtn = yjd.atm('[name="download"]', this.atms.buttons);
	this.events.download = atmBtn.bind('click', this, onBtnDownload, true);
	this.events.focusDownload = atmBtn.bind('focus', this, onFocus, true);
	this.events.blurDownload = atmBtn.bind('blur', this, onBlur, true);

	var atmBtn = yjd.atm('[name="upload"]', this.atms.buttons);
	this.events.upload = atmBtn.bind('click', this, onBtnUpload, true);
	this.events.focusUpload = atmBtn.bind('focus', this, onFocus, true);
	this.events.blurUpload = atmBtn.bind('blur', this, onBlur, true);

	var atmBtn = yjd.atm('[name="delete"]', this.atms.buttons);
	this.events.delete = atmBtn.bind('click', this, onBtnDelete, true);
	this.events.focusDelete = atmBtn.bind('focus', this, onFocus, true);
	this.events.blurDelete = atmBtn.bind('blur', this, onBlur, true);

	var atmBtn = yjd.atm('[name="reset"]', this.atms.buttons);
	this.events.reset = atmBtn.bind('click', this, onBtnReset, true);
	this.events.focusReset = atmBtn.bind('focus', this, onFocus, true);
	this.events.blurReset = atmBtn.bind('blur', this, onBlur, true);

	this.events.fileChange = yjd.atm('input[type="file"]', this.atm)
		.bind('change', this, onFileChange, true);

	this.events.overName = this.atms.name.bind('dragover', this, onDragOver, true);
	this.events.leaveName = this.atms.name.bind('dragleave', this, onDragLeave, true);
	this.events.dropName = this.atms.name.bind('drop', this, onDrop, true);
	this.events.overPreview = this.atms.previewCont.bind('dragover', this, onDragOver, true);
	this.events.leavePreview = this.atms.previewCont.bind('dragleave', this, onDragLeave, true);
	this.events.dropPreview = this.atms.previewCont.bind('drop', this, onDrop, true);

	if(this.options.autoHide) {
		var height = this.atm.height(1);
		this.atms.previewCont.style('top', ''+height+'px');
	}

	this.preview();
	onBlur.call(this);
	//
	function onKeyDown(event, atm) {
		var code = yjd.key.getCode(event);
		if(code==yjd.key.codes.TAB || code==(yjd.key.codes.TAB | yjd.key.codes.SHIFT) ) {
			return;
		}
		event.preventDefault();
	}
	function hasFocus() {
		return this.atms.name.hasFocus()
			|| yjd.atm('[name="upload"]', this.atms.buttons).hasFocus()
			|| yjd.atm('[name="download"]', this.atms.buttons).hasFocus()
			|| yjd.atm('[name="delete"]', this.atms.buttons).hasFocus()
			|| yjd.atm('[name="reset"]', this.atms.buttons).hasFocus();
	}
	function onFocus(event, atm) {
		if(!this.options.autoHide && this.focused) return;
		this.focused = true;
//		this.atms.buttons.style('display', this.s_div_type);
		if(this.options.preview) {
			this.atms.previewCont.style('display', this.s_div_type);
		}
	}
	function onBlur(event, atm) {
		if(!this.options.autoHide || hasFocus.call(this)) return;
		this.focused = false;
//		this.atms.buttons.style('display', 'none');
		if(this.options.preview) {
			this.atms.previewCont.style('display', 'none');
		}
	}
	function onBtnDownload(event, atm) {
		yjd.atm('a.yjd-wdg-file-download', this.atm).click();
	}
	function onBtnUpload(event, atm) {
		this.atms.file.click();
	}
	function setNullFile(b_delete) {
		var s_name = b_delete? '(delete)': '';
		this.atms.newName.val(s_name);
		this.atms.newData.val('');
		this.set = this.newFileObject();
		this.preview();
	}
	function onBtnDelete(event, atm) {
		setNullFile.call(this, true);
		yjd.atm('[name="reset"]', this.atms.buttons).attr('disabled');
		yjd.atm('[name="download"]', this.atms.buttons).attr('disabled');
	}
	function onBtnReset(event, atm) {
		setNullFile.call(this, false);
		yjd.atm('[name="reset"]', this.atms.buttons).attr('disabled');
		if(this.present.url) {
			yjd.atm('[name="download"]', this.atms.buttons).removeAttr('disabled');
		}
	}
	function onFileChange(event, atm) {
		this.setFile(this.atms.file.elm.files, true);
		this.atms.file.val('');
	}
	function onDragOver(event, atm) {
		if(event.dataTransfer.types[0]==='Files') {
			atm.addClass('yjd-wdg-file-dragover');
		}
	}
	function onDragLeave(event, atm) {
		atm.removeClass('yjd-wdg-file-dragover');
	}
	function onDrop(event, atm) {
		event.stopPropagation();
		event.preventDefault();
		atm.removeClass('yjd-wdg-file-dragover');
		if(event.dataTransfer.files.length) {
			this.setFile(event.dataTransfer.files);
			this.atms.file.val('');
		}
	}
};
/**
 * Set file.
 * @param {File|Files}
 * @return {boolean} True if success.
 */
yjd.wdg.File.prototype.setFile = function(file) {
	if(!(file instanceof File)) {
		if(file.length<0) return false;
		file = file[0];
	}
	var s_type = this.checkFile(file);
	if(false===s_type) return false;
	this.set = this.newFileObject({
		name: file.name,
		size: file.size,
		type: s_type,
		file: file,
	});
	this.atms.name.val('(loading...)');
	this.atms.newName.val('');
	this.atms.newData.val('');

	var reader = new FileReader();
	var _this = this;
	reader.onload = function() {
		onLoad.call(_this);
	};
	this.checkBussy(true);
	reader.readAsDataURL(file);

	return true;
	//
	function onLoad() {
		this.atms.newName.val(file.name);
		var data = reader.result;
		if(data.substr(5,1)===';') {
			data = 'data:'
					+yjd.getTypeStr(this.set.type)
					+data.substr(5);
		}
		this.atms.newData.val(data);
		if(yjd.wdg.File.isSupportedType(this.set.type)) {
			this.set.url = data;
		}
		this.preview();
		yjd.atm('[name="reset"]', this.atms.buttons).removeAttr('disabled');
		yjd.atm('[name="download"]', this.atms.buttons).attr('disabled', 'disabled');
		this.checkBussy(false);
	}
};

/**
 * Check a file.
 * @param {File} file file
 * @return {boolean} True if okey.
 */
yjd.wdg.File.prototype.checkFile = function(file) {
	if(file.size>=yjd.wdg.File.getByte(this.options.maxSize)) {
		alert('Too large file size');
		return false;
	}
	var s_type = file.type;
	if(s_type==='') {
		s_type = yjd.mimeTypes.getFromExt(file.name);
	}
	var type = yjd.typeInfo(s_type);
	if(this.options.accept) {
		var i;
		for(i=0; i<this.options.accept.length; i++) {
			var ref = yjd.typeInfo(this.options.accept[i]);
			if(ref.top===type.top) {
				if(!ref.next || ref.next==='*' || ref.next===type.next) {
					break;
				}
			}
		}
		if(i==this.options.accept.length) {
			alert('Unacceptable file type');
			return false;
		}
	}
	return s_type;
};

/**
 * Append to specified element, and bind.
 * @param {yjd.atm} atm Element,
 */
yjd.wdg.File.prototype.appendTo = function(atm) {
	if(typeof atm==='string') atm = yjd.atm(atm);
	atm.append(this.atm);
	this.bind();
};

/**
 * render
 * this called from yjd.wdg (constructor of parent class)
 */
yjd.wdg.File.prototype.render = function(structure) {
	yjd.extend(structure, {
		buttons: {
			download: {
				enalbe: 'true',
				caption: '&DownArrowBar;Down',
				title: 'Download',
			},
			upload: {
				enalbe: 'true',
				caption: '&UpArrowBar;Up',
				title: 'Upload',
			},
			delete: {
				enalbe: 'true',
				caption: '&cross;Del',
				title: 'Delete',
			},
			reset: {
				enalbe: 'true',
				caption: '-Reset',
				title: 'Reset',
			},
		}
	});
	var s_accept = this.acceptStr();
	this.atm = yjd.atm([
		'<div class="yjd-wdg-file">',
			'<div class="yjd-wdg-file-name">',
				'<input class="yjd-wdg-file-name" type="text" />',
				'<input type="file"'+s_accept+'/>',
				'<input class="yjd-wdg-file-newname" type="hidden" />',
				'<input class="yjd-wdg-file-newdata" type="hidden" />',
//				'<input type="hidden" name="file_command" value="keep"/>',
				'<a class="yjd-wdg-file-download"></a>',
				'<div class="yjd-wdg-file-buttons">',
					'<button type="button" name="download" title="'
						+structure.buttons.download.title+'">'
						+structure.buttons.download.caption+'</button>',
					'<button type="button" name="upload" title="'
						+structure.buttons.upload.title+'">'
						+structure.buttons.upload.caption+'</button>',
					'<button type="button" name="delete" title="'
						+structure.buttons.delete.title+'">'
						+structure.buttons.delete.caption+'</button>',
					'<button type="button" name="reset" title="'
						+structure.buttons.reset.title+'">'
						+structure.buttons.reset.caption+'</button>',
				'</div>',
			'</div>',
			'<div class="yjd-wdg-file-preview-container">',
				'<div class="yjd-wdg-file-preview"></div>',
				'<div class="yjd-wdg-file-caption"></div>',
			'</div>',
		'</div>'
	]);
	this.atms={};
	this.atms.name = yjd.atm('input.yjd-wdg-file-name', this.atm);
	this.atms.file = yjd.atm('input[type="file"]', this.atm);
	this.atms.newName = yjd.atm('input.yjd-wdg-file-newname', this.atm);
	this.atms.newData = yjd.atm('input.yjd-wdg-file-newdata', this.atm);
	this.atms.buttons = yjd.atm('.yjd-wdg-file-buttons', this.atm);
	this.atms.previewCont = yjd.atm('.yjd-wdg-file-preview-container', this.atm);
	this.atms.preview = yjd.atm('.yjd-wdg-file-preview', this.atm);
	this.atms.caption = yjd.atm('.yjd-wdg-file-caption', this.atm);
	this.atms.newName.attr('name', this.options.fileNameName);
	this.atms.newData.attr('name', this.options.fileDataName);
	for(var prop in structure.buttons) {
		if(structure.buttons[prop].enable===false) {
			yjd.atm('[name="'+prop+'"]', this.atms.buttons).style('display', 'none');
		}
	}
	this.atms.file.style('display','none');
	yjd.atm('[name="download"]', this.atms.buttons).attr('disabled', 'disabled');
	yjd.atm('[name="delete"]', this.atms.buttons).attr('disabled', 'disabled');
	yjd.atm('[name="reset"]', this.atms.buttons).attr('disabled', 'disabled');
	this.s_div_type = (this.options.containerType!=='block')? 'inline-block': 'block';
	if(this.options.autoHide) {
		this.atm.style('position', 'relative');
		this.atms.previewCont.style('position', 'absolute');
	}
	return;
};

/**
 * Make string for accept attr.
 */
yjd.wdg.File.prototype.acceptStr = function() {
	if(!this.options.accept) return '';
	var str = '';
	for(i=0; i<this.options.accept.length; i++) {
		var s_type = this.options.accept[i];
		var ref = yjd.typeInfo(s_type);
		if(ref.next===null || ref.next==='') {
			s_type = type.top+'/*';
		}
		if(str!=='') str += ',';
		str += s_type;
	}
	return ' accept="'+str+'"';
};

/**
 * Preview
 */
yjd.wdg.File.prototype.preview = function() {
	var s_name = this.atms.newName.val();
	var info = (this.set.size)? this.set
			: (this.present.name)? this.present: this.newFileObject();
	
	this.atms.name.val(s_name);
	if(!this.options.preview) return;
	var s_text = '';
	switch(info.status) {
		case 'loading':	s_text = 'Detecting...'; break;
		case 'fail':	s_text = 'Fail to detect.'; break;
		default:
		if(info.type) {
			s_text = info.type.synonym.toUpperCase();
			if(info.size) s_text += ' : '+yjd.wdg.File.getSizeStr(info.size);
		}
		break;
	}
	this.atms.caption.text(s_text);
	var html = '';
	if(info.type && yjd.wdg.File.isSupportedType(info.type)
		&& (info.url || info.file) ) {
		var src = (info.url)? ' src="'+info.url+'"': '';
		switch(info.type.top) {
			case 'video':
				html = '<video'+src+' controls/>';
				break;
			case 'audio':
				html = '<audio'+src+' controls/>';
				break;
			case 'image':
				html = '<img'+src+' />';
				break;
			case 'text':
//				html = '<iframe'+src+' />';
				var otext = this.decodeText(info.url, true);
				html = '<pre>'+otext.text+'</pre>';
				break;
		}
	} else {
		var str = '';
		if(info.type) {
			str = info.type.top;
		} else {
			str = (this.atms.newName==='(delete)')?
			'(To delete)': '(No files)';
		}
		if(str) html = '<div class="yjd-wdg-file-previewtext">'
			+str.substring(0, 1).toUpperCase()
			+str.substring(1)+'</div>';
	}
	this.atms.preview.html(html);
	var iframe = yjd.atm('iframe', this.atms.preview).elm;
	if(iframe) {
		var elm = iframe.contentDocument.body;
		elm.addEventListener('dragover', eventDisable, true);
		elm.addEventListener('drop', eventDisable, true);
	}
	//
	function eventDisable(event){
		event.preventDefault();
	}
};

yjd.wdg.File.prototype.decodeText = function(text, b_base64) {
	var obj = {text: '(Non UTF-8 text)', charset: null};
	if(b_base64) {
		var pos = text.indexOf(',');
		if(pos<0) return false;
		var text = text.substr(pos+1);
		try {
			obj.text = decodeURIComponent(atob(text).split('').map(function(c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			}).join(''));
			obj.charset = 'UTF-8';
			return obj;
		} catch(e) {
			text = atob(text);
		}
	}
	if('Encoding' in window) {
		obj.charset = Encoding.detect(text);
		switch(obj.charset) {
			case 'BINARY':
				obj.charset = null;
				break;
			case 'ASCII':	//	must not enter
				obj.text = text;
				break;
			case 'UTF32':
				obj.text = '(Undecodable encoding)';
				break;
			default:
				obj.text = Encoding.convert(text, 'UTF8', obj.charset);
		}
	}
	return obj;
};

/**
 * Check and update bussy status.
 * Call callback function when the status changes.
 * @param {boolean} b_newTask If true, incremant task counter, otherwise decrement.
 */
yjd.wdg.File.prototype.checkBussy = function(b_newTask) {
	var prev = this.bussyCount;
	if(b_newTask) this.bussyCount++;
	else this.bussyCount--;
	if((prev && !this.bussyCount) || (!prev && this.bussyCount)) {
		this.callback(this.options.onBussy, [this.bussyCount>0, this]);
	}
};
