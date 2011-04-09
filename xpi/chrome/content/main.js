
(function() {
	const Cc = Components.classes;
	const Ci = Components.interfaces;
	var logger = Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService);
	var strings = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService).createBundle("chrome://statusbarex/locale/main.properties");
	var sbprefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
	var tm = Cc['@mozilla.org/timer;1'].createInstance(Ci.nsITimer);
	var sm = Cc["@doudehou/statusbarEx;1"].createInstance(Ci.IStatusbarExCore);

	var config = {
		memory: true,
		cpuSys: true,
		cpuFx: true,
		network: true,
		netIndex: 0,

		textonly: false
	};

	// save the elements for memory display
	var memElems = {};
	var cpuElems = {};
	var netElems = {};

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
		// document.getElementById('sbex').onclick = showSbexMenu;
		var ids = ['sbex-logo', 'sbex-memory', 'sbex-cpu', 'sbex-network-value'];
		for (var i = 0, l = ids.length; i < l; ++ i) {
			var elem = document.getElementById(ids[i]);
			elem.onclick = showSbexMenu;
		}

		update();
		tm.initWithCallback({'notify' : update}, 1000, Ci.nsITimer.TYPE_REPEATING_SLACK);
		// window.setTimeout(update, 1000);

		checkFirstRun();
	}

	var updateExceptionLogged = false;
	function update() {
		try {
			updateMemory();
			updateCpu();
			updateNetwork();

		} catch (e) {
			if (!updateExceptionLogged) { // log only once
				logger.logStringMessage('statusbarex exception: ' + e);
				updateExceptionLogged = true;
			}
			return;
		}
	}

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
		ratio = Math.ceil(ratio * 100 + 0.5);

		var tooltip = getString('sbexMemoryTooltipTemplate');
		tooltip = tooltip.replace(/%fm%/, freeMemory.value).replace(/%fx%/, fxMemory.value).replace(/%ratio%/, ratio);
		memElems.container.setAttribute('tooltiptext', tooltip);

		var value = getString('sbexMemoryTemplate');
		value = value.replace(/%fm%/, freeMemory.value).replace(/%fx%/, fxMemory.value);
		memElems.value.setAttribute('value', value);

		if (ratio != memCache.ratio) {
			var w = memElems.all.getBoundingClientRect();
			memElems.used.style.width = ratio * w.width / 100 + 'px';
			memCache.ratio = ratio;
		}
	}

	/* cpu */
	var cpuCache = {sys: -1, fx: -1};
	function updateCpu() {
		var cpu = {value: 0};

		// sys
		if (config.cpuSys) {
			sm.GetSysCpuUsage(cpu);
			if (cpu.value != cpuCache.sys) {
				cpuCache.sys = cpu.value;
				var w = cpuElems.sysImage.getBoundingClientRect();
				cpuElems.sysUsed.style.height = cpu.value * w.height / 100 + 'px';
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
				var w = cpuElems.fxImage.getBoundingClientRect();
				cpuElems.fxUsed.style.height = cpu.value * w.height / 100 + 'px';
				cpuElems.fxValue.setAttribute('value', cpu.value + '%');
	
				var tooltip = getString('sbexCpuTooltipFx');
				tooltip = tooltip.replace(/%value%/, cpu.value);
				cpuElems.fx.setAttribute('tooltiptext', tooltip);
			}
		}
	}


	netCache = {index: -1};
	function updateNetwork() {
		if (!config.network) {
			return;
		}

		var netIndex = config.netIndex;
		var inSpeed = {value: 0}, outSpeed = {value: 0};
		sm.GetEthernetSpeed(netIndex, inSpeed, outSpeed);
		var value = getString('sbexNetworkTemplate');
		value = value.replace(/%down%/, formatSpeed(inSpeed.value)).replace(/%up%/, formatSpeed(outSpeed.value));
		netElems.value.setAttribute('value', value);

		if (netIndex != netCache.index) {
			var count = sm.GetEthernetCount();
			if (count > 0) { // when get 0, the DLL is not ready
				netCache.index = netIndex;
				var name = {value: ''};
				sm.GetEthernetName(netIndex, name);
				netElems.container.setAttribute('tooltiptext', name.value);
			}
		}
	}


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

	function showSbexMenu(e) {
		if (e.button != 0) {
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

	function showNetworkMenu(e) {
		if (e.button != 0) {
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
						getBrowser().addEventListener('load', showHomepage, true);
					}
				}
			}
		});
	}

	function showHomepage() {
		getBrowser().removeEventListener('load', arguments.callee, true);
		// var homepg = 'http://www.xilou.us/home/statusbarex';
		// var homepg = 'http://www.google.com.hk';
		var homepg = 'http://www.enjoyfreeware.org/sbex';
		
		getBrowser().selectedTab = getBrowser().addTab(homepg); 
	}

})();
