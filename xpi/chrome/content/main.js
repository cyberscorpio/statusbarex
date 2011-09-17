
(function() {
	const Cc = Components.classes;
	const Ci = Components.interfaces;

	////////////////////////////////////////////////////////////////////////////////////////////////
	// saved var
	var logger = Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService);
	var strings = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService).createBundle("chrome://statusbarex/locale/main.properties");
	var sbprefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
	var tm = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
	var sm = Cc["@enjoyfreeware.org/statusbarex;1"].createInstance(Ci.IStatusbarExCore);

	var config = {
		memory: true,
		cpuSys: true,
		cpuFx: true,
		network: true,
		netIndex: 0,

		detailsOpen: false,

		textonly: false
	};

	////////////////////////////////////////////////////////////////////////////////////////////////
	// save the elements for memory display
	var memElems = {};
	var cpuElems = {};
	var netElems = {};
	var histories = {
		networkIn: new FixedQueue(60),
		networkOut: new FixedQueue(60)
	}

	window.addEventListener('load', init, false);
	function init() {
		window.removeEventListener('load', arguments.callee, false);

		document.getElementById('sbex').setAttribute('tooltiptext', getString('sbexTooltip'));

		// save mem elements
		var map = {
			'container' : 'sbex-memory',
			'all' : 'sbex-memory-all',
			'used' : 'sbex-memory-used',
			'value' : 'sbex-memory-value'
		};
		for (var k in map) {
			memElems[k] = document.getElementById(map[k]);
		}

		// save cpu elements
		map = {
			'container' : 'sbex-cpu',

			'sys' : 'sbex-cpu-sys',
			'sysImage' : 'sbex-cpu-sys-image',
			'sysUsed' : 'sbex-cpu-sys-used',
			'sysValue' : 'sbex-cpu-sys-value',

			'fx' : 'sbex-cpu-fx',
			'fxImage' : 'sbex-cpu-fx-image',
			'fxUsed' : 'sbex-cpu-fx-used',
			'fxValue' : 'sbex-cpu-fx-value'
		};
		for (var k in map) {
			cpuElems[k] = document.getElementById(map[k]);
		}

		// save network elements
		map = {
			'detailName' : 'sbex-detail-network-name',
			'container' : 'sbex-network',
			'value' : 'sbex-network-value'
		};
		for (var k in map) {
			netElems[k] = document.getElementById(map[k]);
		}

		// load config
		try {
			sbPrefObserver.register();
		} catch (e) {
			alert(e);
		}

		// install the event handlers
		document.getElementById('sbex-network-selector').onclick = showNetworkMenu;
		var ids = ['sbex-logo', 'sbex-memory', 'sbex-cpu'];//, 'sbex-network-value'];
		for (var i = 0, l = ids.length; i < l; ++ i) {
			var elem = document.getElementById(ids[i]);
			elem.onclick = showSbexMenu;
		}

		// details panel
		initDetailsPanel();

		update();
		tm.initWithCallback({'notify' : update}, 1000, Ci.nsITimer.TYPE_REPEATING_SLACK);

		checkFirstRun();
	}

	var updateExceptionLogged = false;
	function update() {
		try {
			updateMemory();
			updateCpu();
			updateNetwork();

			updateDetails();

		} catch (e) {
			if (!updateExceptionLogged) { // log only once
				logger.logStringMessage('statusbarex exception: ' + e);
				updateExceptionLogged = true;
			}
			return;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////////////////
	/* memory */
	var memCache = {free: -1, fx: -1, ratio: -1};
	function updateMemory() {
		if (!config.memory) {
			return;
		}

		var freeMemory = {value: 0}, totalMemory = {value: 0};
		var fxMemory = {value: 0}, fxVm = {value: 0};
		sm.GetMemoryStatus(totalMemory, freeMemory);
		sm.GetFxMemory(fxMemory, fxVm);
		if (freeMemory.value == memCache.free && fxMemory.value == memCache.fx) {
			return;
		}
		memCache.free = freeMemory.value;
		memCache.fx = fxMemory.value;

		var ratio = 1 - freeMemory.value / totalMemory.value;
		ratio = Math.floor(ratio * 100 + 0.5);

		var tooltip = getString('sbexMemoryTooltipTemplate');
		tooltip = tooltip.replace(/%fm%/, freeMemory.value).replace(/%fx%/, fxMemory.value).replace(/%ratio%/, ratio);
		memElems.container.setAttribute('tooltiptext', tooltip);

		var value = getString('sbexMemoryTemplate');
		value = value.replace(/%fm%/, freeMemory.value).replace(/%fx%/, fxMemory.value);
		memElems.value.setAttribute('value', value);

		if (ratio != memCache.ratio) {
			w = memElems.all.clientWidth;
			memElems.used.style.width = ratio * w / 100 + 'px';
			memCache.ratio = ratio;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////////////////
	/* cpu */
	var cpuCache = {sys: -1, fx: -1};
	function updateCpu() {
		var cpu = {value: 0};

		// sys
		if (config.cpuSys) {
			sm.GetSysCpuUsage(cpu);
			if (cpu.value != cpuCache.sys) {
				cpuCache.sys = cpu.value;
				var h = cpuElems.sysImage.clientHeight;
				cpuElems.sysUsed.style.height = cpu.value * h / 100 + 'px';
				cpuElems.sysValue.setAttribute('value', cpu.value + '%');

				var tooltip = getString('sbexCpuTooltipSys');
				tooltip = tooltip.replace(/%value%/, cpu.value);
				cpuElems.sys.setAttribute('tooltiptext', tooltip);
			}
		}

		// fx
		if (config.cpuFx) {
			sm.GetFxCpuUsage(cpu);
			if (cpu.value != cpuCache.fx) {
				cpuCache.fx = cpu.value;
				var h = cpuElems.fxImage.clientHeight;
				cpuElems.fxUsed.style.height = cpu.value * h / 100 + 'px';
				cpuElems.fxValue.setAttribute('value', cpu.value + '%');
	
				var tooltip = getString('sbexCpuTooltipFx');
				tooltip = tooltip.replace(/%value%/, cpu.value);
				cpuElems.fx.setAttribute('tooltiptext', tooltip);
			}
		}
	}


	////////////////////////////////////////////////////////////////////////////////////////////////
	/* network */
	var netCache = {index: -1, inMax: -1, outMax: -1};
	function updateNetwork() {
		if (!config.network && !config.detailsOpen) {
			return;
		}

		var netIndex = config.netIndex;
		if (netIndex != netCache.index) {
			var count = sm.GetEthernetCount();
			if (netIndex >= count) {
				netIndex = 0;
				sbprefs.setIntPref('extensions.sbex.networkIndex', netIndex);
			}

			if (count > 0) { // when get 0, the DLL is not ready

				histories.networkIn.clear();
				histories.networkOut.clear();

				netCache.index = netIndex;
				var name = {value: ''};
				sm.GetEthernetName(netIndex, name);
				netElems.container.setAttribute('tooltiptext', name.value);
				netElems.detailName.setAttribute('value', name.value);
				netElems.detailName.setAttribute('tooltiptext', name.value);
			} else {
				return;
			}
		}

		var inSpeed = {value: 0}, outSpeed = {value: 0};
		sm.GetEthernetSpeed(netIndex, inSpeed, outSpeed);

		if (config.network) {
			var value = getString('sbexNetworkTemplate');
			value = value.replace(/%down%/, formatSpeed(inSpeed.value)).replace(/%up%/, formatSpeed(outSpeed.value));
			netElems.value.setAttribute('value', value);
		}

		histories.networkIn.push(inSpeed.value);
		histories.networkOut.push(outSpeed.value);
	}

	////////////////////////////////////////////////////////////////////////////////////////////////
	/** update the details panel **/
	function initDetailsPanel() {
		var ids = ['sbex-network-value'];
		for (var i = 0, l = ids.length; i < l; ++ i) {
			var elem = document.getElementById(ids[i]);
			elem.onclick = showDetails;
		}
		window.addEventListener('popuphidden', onHidden, false);

		// pin
		var pin = document.getElementById('sbex-details-pin');
		pin.onclick = function() {
			var panel = document.getElementById('sbex-details');
			var noautohide = (panel.getAttribute('noautohide') != 'true');
			panel.setAttribute('noautohide', noautohide);
			if (noautohide) {
				addClass(this, 'sbex-details-pinned');
			} else {
				removeClass(this, 'sbex-details-pinned');
			}
			reopenPanel(panel);
		}

		// close
		document.getElementById('sbex-details-close').onclick = function() {
			var panel = document.getElementById('sbex-details');
			panel.hidePopup();
		}

		// canvas config
		ids = ['sbex-detail-network-in', 'sbex-detail-network-out'];
		for (var i = 0, l = ids.length; i < l; ++ i) {
			var elem = document.getElementById(ids[i]);
			elem.width = 120;
			elem.height = 50;
		}

		var x = undefined, y = undefined;
		function onHidden(evt) {
			if (evt.target.id == 'sbex-details') {
				var box = evt.target.boxObject;
				x = box.screenX;
				y = box.screenY;

				config.detailsOpen = false;
			}
		}

		function reopenPanel(panel) {
			panel.hidePopup();
			panel.openPopupAtScreen(x, y, false);
			config.detailsOpen = true;
		}

		function showDetails(evt) {
			if (evt.button != 0) {
				return;
			}
			var panel = document.getElementById('sbex-details');
			if (panel.state == 'closed') {
				if (x === undefined || y === undefined) {
					panel.openPopup(netElems.container, 'before_end', 0, 0, false);
				} else {
					panel.openPopupAtScreen(x, y, false);
				}
				config.detailsOpen = true;
			} else {
				panel.hidePopup();
			}
		}
	}

	function updateDetails() {
		var details = document.getElementById('sbex-details');
		if (details.state != 'open') {
			return;
		}

		updateSpeedCanvas(histories.networkIn, 'in');
		updateSpeedCanvas(histories.networkOut, 'out');
	}

	function updateSpeedCanvas(data, inout) {
		var x, y;
		var max = -1;
		for (var i = 0, l = data.size(); i < l; ++ i) {
			var t = data.get(i);
			if (t > max) {
				max = t;
			}
		}
		max = getBoundaryValue(max);
		if (max != netCache[inout + 'Max']) {
			netCache[inout + 'Max'];
			document.getElementById('sbex-detail-network-speed-' + inout)
				.setAttribute('value', formatSpeed(max) + '/s');
		}

		// draw the canvas
		var canvas = document.getElementById('sbex-detail-network-' + inout);
		var ctx = canvas.getContext('2d');
		ctx.save();

		var width = canvas.width;
		var height = canvas.height;

		ctx.clearRect(0, 0, width, height);

		// grid
		ctx.beginPath();

		ctx.lineWidth = 1;
		ctx.strokeStyle = '#303030';

		y = height % 2 == 0 ? (height / 2 + 0.5) : (height / 2);
		ctx.moveTo(0.5, y);
		ctx.lineTo(width - 0.5, y);

		for (var i = 1; i < 6; ++ i) {
			x = width * i;
			x = x % 6 == 0 ? (x / 6 + 0.5) : Math.floor(x / 6 + 0.5) - 0.5;
			ctx.moveTo(x, 0.5);
			ctx.lineTo(x, height - 0.5);
		}
		ctx.stroke();

		// speed
		ctx.beginPath();

		ctx.lineWidth = 1;
		ctx.strokeStyle = 'green';

		ctx.moveTo(0, height - 1);
		for (var i = 0, l = data.size(); i < l; ++ i) {
			y = data.get(i);
			y = max == 0 ? height : Math.floor((max - y) * height / max + 0.5);
			if (y == height) {
				-- y;
			}
			y -= 0.5;
			ctx.lineTo(i * 2 + 0.5, y);
		}
		ctx.stroke();

		ctx.restore();
	}


	////////////////////////////////////////////////////////////////////////////////////////////////
	/** utilities **/
	function getString(name) {
		try {
			var str = strings.GetStringFromName(name);
		} catch (e) {
			str = name;
			var txt = e.message + " (" + name + " is missing)";
			// alert(txt);
			logger.logStringMessage(txt);
		}
		return str;
	}

	function formatSpeed(v) {
		if (v == 0) {
			return '0.00K';
		} else if (v < 15) {
			return '0.01K';
		} else if (v < 1024 * 10) {
			return (v / 1024).toFixed(2) + 'K';
		} else if (v < 1024 * 1000) {
			return (v / 1024).toFixed() + 'K';
		} else {
			return (v / (1024 * 1024)).toFixed(2) + 'M';
		}
	}

	/**
	 * for the speed, return a proper boundary value, for example:
	 * if the max speed is 15K, then the boundary value is 20K.
	 */
	function getBoundaryValue(value) {
		if (value < 1024 * 100) {
			return Math.floor((value + 1024 * 10 - 1) / (1024 * 10)) * 1024 * 10;
		} else if (value < 1024 * 1000) {
			return Math.floor((value + 1024 * 100 - 1) / (1024 * 100)) * 1024 * 100;
		} else {
			return Math.floor((value + 1024 * 1024 - 1) / (1024 * 1024)) * 1024 * 1024;
		}
	}


	////////////////////////////////////////////////////////////////////////////////////////////////
	/** popup related **/
	function showSbexMenu(evt) {
		if (evt.button != 0) {
			return;
		}
		var menu = document.getElementById('sbex-list');
		var items = menu.getElementsByTagName('menuitem');
		while (items.length) {
			menu.removeChild(items[0]);
		}
		items = menu.getElementsByTagName('menuseparator');
		while (items.length) {
			menu.removeChild(items[0]);
		}

		var options = [ // config-key, string-key
			[ 'memory', 'sbexMemory' ],
			[ 'separator' ],
			[ 'cpuSys', 'sbexCpuSys' ],
			[ 'cpuFx', 'sbexCpuFx' ],
			[ 'separator' ],
			[ 'network', 'sbexNetwork' ],
			[ 'separator' ],
			[ 'textonly', 'sbexTextOnly' ]
		];

		for (var i = 0, l = options.length; i < l; ++ i) {
			var opt = options[i];
			if (opt[0] == 'separator') {
				var item = document.createElement('menuseparator');
				menu.appendChild(item);
				continue;
			}

			var item = document.createElement('menuitem');
			menu.appendChild(item);

			item.setAttribute('label', getString(opt[1]));
			item.setAttribute('type', 'checkbox');
			item.name = opt[0];
			item.onclick = onSbexMenuSelected;
			if (config[opt[0]]) {
				item.setAttribute('checked', true);
			}
		}

		menu.openPopup(this, 'before_start', 0, 0, false);
	}

	function onSbexMenuSelected() {
		var name = this.name;
		if (config[name] != undefined) {
			var value = config[name];
			value = value ? false : true;
			key = 'extensions.sbex.' + name;
			sbprefs.setBoolPref(key, value);
		}
	}

	function showNetworkMenu(evt) {
		if (evt.button != 0) {
			return;
		}
		var menu = document.getElementById('sbex-network-list');
		var items = menu.getElementsByTagName('menuitem');
		while (items.length) {
			menu.removeChild(items[0]);
		}

		var count = sm.GetEthernetCount();
		if (count == 0) {
			return; // DLL is not ready
		}

		for (var i = 0; i < count; ++ i) {
			var name = {value : ''};
			sm.GetEthernetName(i, name);
			var item = document.createElement('menuitem');
			menu.appendChild(item);

			item.setAttribute('label', name.value);
			item.setAttribute('id', 'sbex-network-adapter-' + i);
			item.setAttribute('type', 'radio');
			item.adapter = i;
			item.onclick = onNetworkListSelected;
			if (i == config.netIndex) {
				item.setAttribute('checked', true);
			}
		}

		menu.openPopup(netElems.container, 'before_end', 0, 0, false);
	}

	function onNetworkListSelected() {
		if (config.netIndex != this.adapter) {
			sbprefs.setIntPref('extensions.sbex.networkIndex', this.adapter);
		}
	}


	////////////////////////////////////////////////////////////////////////////////////////////////
	// pref relative
	function removeClass(e, cls) {
		var className = e.className;
		var classes = className.split(' ');
		className = '';
		for (var i = 0, l = classes.length; i < l; ++ i) {
			if (classes[i] != cls) {
				if (className.length > 0) {
					className += ' ';
				}
				className += classes[i];
			}
		}
		e.className = className;
	}

	function addClass(e, cls) {
		var className = e.className;
		var classes = className.split(' ');
		for (var i = 0, l = classes.length; i < l; ++ i) {
			if (classes[i] == cls) {
				return; // already has
			}
		}
		className += ' ' + cls;
		e.className = className;
	}

	function onPrefChanged() {
		var hidden = 'sbex-hidden';
		if (config.memory) {
			removeClass(memElems.container, hidden);
		} else {
			addClass(memElems.container, hidden);
		}

		if (config.cpuSys) {
			removeClass(cpuElems.container, hidden);
			removeClass(cpuElems.sys, hidden);
		} else {
			addClass(cpuElems.sys, hidden);
		}
		if (config.cpuFx) {
			removeClass(cpuElems.container, hidden);
			removeClass(cpuElems.fx, hidden);
		} else {
			addClass(cpuElems.fx, hidden);
		}
		if (!config.cpuSys && !config.cpuFx) {
			addClass(cpuElems.container, hidden);
		}

		if (config.network) {
			removeClass(netElems.container, hidden);
		} else {
			addClass(netElems.container, hidden);
		}

		memCache.ratio = memCache.fx = memCache.free = -1;
		var imgIds = ['sbex-memory-all', 'sbex-cpu-sys-image', 'sbex-cpu-fx-image'];
		var elem = null;
		if (config.textonly) {
			for (var i = 0, l = imgIds.length; i < l; ++ i) {
				var elem = document.getElementById(imgIds[i]);
				addClass(elem, hidden);
			}
			removeClass(memElems.value, 'sbex-onimage');
		} else {
			for (var i = 0, l = imgIds.length; i < l; ++ i) {
				var elem = document.getElementById(imgIds[i]);
				removeClass(elem, hidden);
			}
			addClass(memElems.value, 'sbex-onimage');
		}
	}


	var sbPrefObserver = {
		register: function() {
			var prefService = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);
			this._branch = prefService.getBranch("extensions.sbex.");
			this._branch.QueryInterface(Ci.nsIPrefBranch2);
			this._branch.addObserver("", this, false);

			// load prefs
			var map = { // pref key : config key
				'extensions.sbex.memory' : 'memory',
				'extensions.sbex.cpuSys' : 'cpuSys',
				'extensions.sbex.cpuFx' : 'cpuFx',
				'extensions.sbex.network' : 'network',
				'extensions.sbex.textonly' : 'textonly',
			};
			for (var k in map) {
				config[map[k]] = sbprefs.getBoolPref(k);
			}
			map = {
				'extensions.sbex.networkIndex' : 'netIndex'
			}
			for (var k in map) {
				config[map[k]] = sbprefs.getIntPref(k);
			}
			onPrefChanged();

		},

		unregister: function() {
			if(!this._branch) {
				return;
			}
			this._branch.removeObserver("", this);
		},

		observe: function(aSubject, aTopic, aData) {
			if(aTopic != "nsPref:changed") {
				return;
			}
	
			if (aData == 'memory') {
				config.memory = sbprefs.getBoolPref('extensions.sbex.memory');
			} else if (aData == 'cpuSys') {
				config.cpuSys = sbprefs.getBoolPref('extensions.sbex.cpuSys');
			} else if (aData == 'cpuFx') {
				config.cpuFx = sbprefs.getBoolPref('extensions.sbex.cpuFx');
			} else if (aData == 'network') {
				config.network = sbprefs.getBoolPref('extensions.sbex.network');
			} else if (aData == 'networkIndex') {
				config.netIndex = sbprefs.getIntPref('extensions.sbex.networkIndex');
			} else if (aData == 'textonly') {
				config.textonly = sbprefs.getBoolPref('extensions.sbex.textonly');
			} else if (aData == 'firstrun') {
				// nothing to do:)
			}

			onPrefChanged();
		}
	}

	function checkFirstRun() {
		var vk = 'extensions.sbex.firstrun';
		var ver = sbprefs.getCharPref(vk);
		Components.utils.import("resource://gre/modules/AddonManager.jsm");
		AddonManager.getAddonByID('doudehou@gmail.com', function(addon) {
			if (addon.name == "StatusbarEx") {
				if(ver != addon.version) {
					if(window.navigator.onLine) {
						sbprefs.setCharPref(vk, addon.version);
						/**
						 * please notes that the 'true', is because the 'event.bubbles' is false
						 * so the event won't be bubbled to the browser
						 */
						getBrowser().addEventListener('load', showHomepage, true);
					}
				}
			}
		});
	}

	function showHomepage() {
		getBrowser().removeEventListener('load', arguments.callee, true);
		var homepg = 'http://www.enjoyfreeware.org/sbex';
		
		getBrowser().selectedTab = getBrowser().addTab(homepg); 
	}


	////////////////////////////////////////////////////////////////////////////////////////////////
	/* A fixed size, FIFO array (queue) */
	function FixedQueue(capacity) {
		capacity = capacity ? capacity : 10;

		var data = new Array(capacity + 1);
		var begin = 0, end = 0;

		this.capacity = function() {
			return capacity;
		}

		this.push = function(v) {
			data[end ++] = v;
			if (end > capacity) {
				end = 0;
			}

			if (end == begin) {
				if (++ begin > capacity) {
					begin = 0;
				}
			}
		}

		this.size = function() {
			if (end >= begin) {
				return end - begin;
			} else {
				return capacity;
			}
		}

		this.get = function(idx) {
			if (idx >= capacity) {
				return undefined;
			}

			return data[(begin + idx) % (capacity + 1)];
		}

		this.clear = function(clearData) {
			begin = end = 0;
			if (clearData) {
				data = new Array(capacity + 1);
			}
		}

	};

})();
