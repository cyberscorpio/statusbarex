/**
 The available string IDs:
	main_charging 
	main_aclineon 
	main_batteryremaining 
	main_statusbarexupdatefail 
	main_empty 
	main_lastmodified 
	main_loading 
	main_lastmodified 
	main_memoryavailable 
	main_totalmemory 
	main_cpuusage
	main_memoryfirefoxused 
	main_firefoxcpuusage 
	main_downup 
	main_downup 
	main_statusbarexupdatetool
 */

const SBEX_UPDATE_RATE = 1000;
const SBEX_DUMP_FOR_EVERY_N_REQUEST = 10;
const SBEX_MAX_ETH_COUNT = 5;


if ("undefined" == typeof(StatusbarEx)) {
	var StatusbarEx = {
		init : function() {
			const Cc = Components.classes;
			const Ci = Components.interfaces;
			this.logger = Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService);
			var sbundle = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);
			this.strings = sbundle.createBundle("chrome://statusbarex/locale/main.properties");
			this.sm = Cc["@doudehou/statusbarEx;1"].createInstance(Ci.IStatusbarExCore);

			// variables
			this.text_color = '#000000';
			this.show_page = false;
			this.show_memory = true;
			this.show_totalmemory = true;
			this.show_syscpu = true;
			this.show_fxmemory = true;
			this.show_fxcpu = true;
			this.show_ethN = new Array();
			this.ethN_name_got = false;
			this.fixed_length = true;
			this.compact_mode = false;
			this.sbVersion = '0';
			this.show_pwr = true;
			this.pwr_ac = -1;
			this.pwr_flag = -1;

			this.paneIds = ['sbex-page', 'sbex-sys', 'sbex-fx', 'sbex-net', 'sbex-pwr'];

			// methods
			this.dump = function(str) {
				var d = new Date();
				var dump_str = d.toTimeString() + ":" + str;
				this.logger.logStringMessage(dump_str);
			}
		
			this.getString = function(name) {
				try {
					var str = this.strings.GetStringFromName(name);
				} catch (e) {
					var txt = e.message + " (" + name + ") is invalid";
					this.dump(txt);
					// alert(txt);
				}
				return str;
			}

			this.addClickHandler = function () {
				try {
					for (index in this.paneIds) {
						var pane = document.getElementById(this.paneIds[index]);
						pane.addEventListener('click', function(e) {StatusbarEx.onClick(e);}, false);
					}
				} catch (e) {
					alert (e.message);
					this.dump(e.message);
				}
			}

		}
	};


	(function() {
		this.init();
	}).apply(StatusbarEx);
}


function sbexShowHomePage() {
	getBrowser().removeEventListener('load', sbexShowHomePage, true);
	var homepg = 'http://www.xilou.us/home/statusbarex';
	
	getBrowser().selectedTab = getBrowser().addTab(homepg); 
}


StatusbarEx.show_system_info = function () {
	var txt = "";

	if (this.show_memory || this.show_totalmemory || this.show_syscpu) {
		var mem1 = {value:0};
		var mem2 = {value:0};
		this.sm.GetMemoryStatus(mem1, mem2);
		var syscpu = {value:0};
		this.sm.GetSysCpuUsage(syscpu);

		if (this.show_memory) {
			txt += mem2.value.toString() + "M";
			if (this.show_totalmemory) {
				txt += "/" + mem1.value.toString() + "M";
			}
		} else if (this.show_totalmemory) {
			txt += mem1.value.toString() + "M";				
		}

		if (this.show_syscpu) {
			if (txt.length > 0) {
				txt += " ";
			}
			txt += syscpu.value.toString() + "%";
		}

		document.getElementById('sbex-sys').label = txt;
	}
}


StatusbarEx.show_fx_info = function () {
	var txt = "";

	if (this.show_fxmemory || this.show_fxcpu) {
		var val = {value:0};
		txt = this.compact_mode ? "" : "Fx:["
		
		if (this.show_fxmemory) {
			var vm_size = {value:0};
			this.sm.GetFxMemory(val, vm_size);
			txt += val.value.toString() + "M";// + "/" + vm_size.value.toString() + "M";
			
			if (this.show_fxcpu) {
				txt += ' ';
			}
		}

		if (this.show_fxcpu) {
			this.sm.GetFxCpuUsage(val);
			txt += val.value.toString() + "%";
		}
		
		txt += this.compact_mode ? "" : "]"
		document.getElementById('sbex-fx').label = txt;
	}
}


StatusbarEx.show_network_info = function () {
	var txt = "";

	var cnt = this.sm.GetEthernetCount();
	if (cnt > SBEX_MAX_ETH_COUNT) {
		cnt = SBEX_MAX_ETH_COUNT;
	}
	var i = 0;
	var sep = "";
	for (; i < cnt; ++ i) {
		if (this.show_ethN[i]) {
			var temp_text = "";
			var in_speed = {value:0};
			var out_speed = {value:0};
			this.sm.GetEthernetSpeed(i, in_speed, out_speed);
			// in
			var inString = '';
			if (in_speed.value == 0) {
				inString = ' 0';
			} else if (in_speed.value < 12) {
				inString = '0.01K';
			} else if (in_speed.value < 1024) {
				inString = (in_speed.value / 1024).toFixed(2) + 'K';
			} else if (in_speed.value < 1024 * 1024) {
				inString = (in_speed.value / 1024).toFixed() + 'K';
			} else {
				inString = (in_speed.value / (1024 * 1024)).toFixed(2) + 'M';
			}
			// out
			var outString = '';
			if (out_speed.value == 0) {
				outString = '0';
			} else if (out_speed.value < 12) {
				outString = '0.01K';
			} else if (out_speed.value < 1024) {
				outString = (out_speed.value / 1024).toFixed(2) + 'K';
			} else if (out_speed.value < 1024 * 1024) {
				outString = (out_speed.value / 1024).toFixed() + 'K';
			} else {
				outString = (out_speed.value / (1024 * 1024)).toFixed(2) + 'M';
			}

			if (this.compact_mode) {
				temp_text = sep + "#" + i.toString() + ":" + inString + "/" + outString;
			} else {
				temp_text = sep + "#" + i.toString() + "[D:" + inString + " - U:" + outString + "]";
			}

			txt += temp_text;
			sep = " ";
		}
	}
	document.getElementById('sbex-net').label = txt;

	if (!this.ethN_name_got) {
		this.updateTooltip();
	}
}


StatusbarEx.show_power_info = function () {
	var txt = "";

	// power
	if (this.show_pwr) {
		var panel_pwr = document.getElementById('sbex-pwr');
		var panel_pwr_img = document.getElementById('sbex-pwr-img');
		var panel_pwr_desc = document.getElementById('sbex-pwr-desc');
		var ac = {value:0};
		var btyFlag = {value:0};
		var btyLifePercent = {value:0};
		var btyLifeTime = {value:0};
		var hour = {value:0};
		var minute = {value:0};
		var second = {value:0};
		this.sm.GetPowerStatus(ac, btyFlag, btyLifePercent, btyLifeTime, hour, minute, second);

		if (ac.value == 1) { // AC on line
			if (btyFlag.value & 8) { // charging
				panel_pwr_img.src = "chrome://statusbarex/content/charging.gif";
				panel_pwr.setAttribute('tooltiptext', this.getString("main_charging"));
				panel_pwr_img.setAttribute('tooltiptext', this.getString("main_charging"));
				panel_pwr_desc.setAttribute('tooltiptext', this.getString("main_charging"));

				var percent = btyLifePercent.value;
				panel_pwr_desc.style.display="";
				panel_pwr_desc.value = percent.toString() + "%";
			} else {
				panel_pwr_img.src = "chrome://statusbarex/content/ac.png";
				panel_pwr.setAttribute('tooltiptext', this.getString("main_aclineon"));
				panel_pwr_img.setAttribute('tooltiptext', this.getString("main_aclineon"));
				panel_pwr_desc.style.display="none";
				// panel_pwr_desc.setAttribute('tooltiptext', "AC line on")
			}
		} else if (ac.value == 0) { // AC off line
			var percent = btyLifePercent.value;
			if (percent > 100) {
				percent = 100;
			}
			if (percent < 10) {
				panel_pwr_img.src = "chrome://statusbarex/content/battery-empty.png";
			} else if(percent < 30) {
				panel_pwr_img.src = "chrome://statusbarex/content/battery-low.png";
			} else if(percent < 85) {
				panel_pwr_img.src = "chrome://statusbarex/content/battery-middle.png";
			} else {
				panel_pwr_img.src = "chrome://statusbarex/content/battery-high.png";
			}
			panel_pwr.setAttribute('tooltiptext', this.getString("main_batteryremaining") + percent.toString() + "%");
			panel_pwr_img.setAttribute('tooltiptext', this.getString("main_batteryremaining") + percent.toString() + "%");

			panel_pwr_desc.style.display="";
			panel_pwr_desc.setAttribute('tooltiptext', this.getString("main_batteryremaining") + percent.toString() + "%");
			panel_pwr_desc.value = percent.toString() + "%  " +
				(hour.value <= 9 ? "0" : "") + hour.value.toString() + ":" + 
				(minute.value <= 9 ? "0" : "") + minute.value.toString() + (this.compact_mode ? " hours" : "");
		} else {
		}

	}
}




StatusbarEx.update_content = function () {
	try {
		this.show_system_info();
		this.show_fx_info();
		this.show_network_info();
		this.show_power_info();

		return true;
	} catch (e) {
		var txt = this.getString("main_statusbarexupdatefail") + e.message + ">";
		this.dump(txt);
		return false;
	}

}


StatusbarEx.update_page_info = function (doc) {
	var panel = document.getElementById('sbex-page');
	var bReset = false;
	try {
		if (doc.location.toString().search("about:") == 0) {
			panel.label = this.getString("main_empty");
		} else {
			panel.label = doc.lastModified;
		}

		panel.setAttribute('tooltiptext', this.getString("main_lastmodified") + doc.location.toString() + ")");
	} catch(e) {
		bReset = true;
	}

	if (bReset) {
		try {
			panel.label = this.getString("main_loading");
			panel.setAttribute('tooltiptext', this.getString("main_lastmodified"));
		}
		catch(e){}
	}
}


function sbex_update_on_timer() {
	if (StatusbarEx.update_content()) {
		window.setTimeout(sbex_update_on_timer, SBEX_UPDATE_RATE);
	} else {
		window.setTimeout(sbex_update_on_timer, SBEX_UPDATE_RATE * 3); // try 3 seconds later.
	}
}

window.setTimeout(sbex_update_on_timer, SBEX_UPDATE_RATE);



StatusbarEx.showSbExOptions = function () {
	window.openDialog('chrome://statusbarex/content/options.xul','_blank','chrome,centerscreen,resizable=no,dialog=yes,close=no,dependent=yes').focus();
}

StatusbarEx.onClick = function (e) {
	this.showSbExOptions();
}



///////////////////////////////////////////////////////////////////////////////////
// const SBEX_STATE_START = Components.interfaces.nsIWebProgressListener.STATE_START;
const SBEX_STATE_STOP = Components.interfaces.nsIWebProgressListener.STATE_STOP;
var sbex_progListener = {
	QueryInterface: function(aIID) {
		if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
			 aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
			 aIID.equals(Components.interfaces.nsISupports))
			return this;
		throw Components.results.NS_NOINTERFACE;
	},

	onStateChange: function(aProgress, aRequest, aFlag, aStatus) {
		if (!StatusbarEx.show_page) {
			return 0;
		}

		try {
			var doc = aProgress.DOMWindow.document;
			var browser = gBrowser.getBrowserForDocument(doc);
			if (browser == gBrowser.selectedBrowser) {
				StatusbarEx.update_page_info(doc);
			}
		} catch(ex) {
			StatusbarEx.dump(ex.message);
		}
		return 0;
	},

	onLocationChange: function(aProgress, aRequest, aURI) {
		if (!StatusbarEx.show_page) {
			return 0;
		}

		if (aProgress.DOMWindow != gBrowser.selectedBrowser) {
			return 0;
		}

		StatusbarEx.update_page_info(gBrowser.selectedBrowser.document);
		return 0;
	},

	// For definitions of the remaining functions see XULPlanet.com
	onProgressChange: function() {return 0;},
	onStatusChange: function() {return 0;},
	onSecurityChange: function() {return 0;},
	onLinkIconAvailable: function() {return 0;}
}




function sbex_on_tabselect(evt) {
	if (!StatusbarEx.show_page) {
		return;
	}

	var doc = gBrowser.selectedBrowser.contentDocument;
	StatusbarEx.update_page_info(doc);
}


function StatusbarEx_onLoad () {
	const Cc = Components.classes;
	const Ci = Components.interfaces;

	StatusbarEx.setSbPref();

	// --- Check the first run OR new version ---
	var sbEM = Cc["@mozilla.org/extensions/manager;1"].getService(Ci.nsIExtensionManager);
	var sbAddon = sbEM.getItemForID("doudehou@gmail.com");
	var newVersion = sbAddon.version;
	
	if (sbAddon.name == "StatusbarEx") {
		if(StatusbarEx.sbVersion != newVersion) {
			if(window.navigator.onLine) {
				Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch).setCharPref("extensions.statusbarEx.firstrun", newVersion);
				getBrowser().addEventListener('load', sbexShowHomePage, true);
			}
		}
	}
	// ---          END OF CHECKING           ---

	window.removeEventListener('load', StatusbarEx_onLoad, false);

	// gBrowser.addEventListener("load", sbex_on_page_load, true);

	gBrowser.addProgressListener(sbex_progListener, Ci.nsIWebProgress.NOTIFY_STATE_DOCUMENT);

	var tabContainer = gBrowser.tabContainer;
	tabContainer.addEventListener("TabSelect", sbex_on_tabselect, false);

	/**
	 * Add the click listener
	 */
	StatusbarEx.addClickHandler();

	return;
}



StatusbarEx.showPane = function (pane, show, width) {
	if (show) {
		pane.style.display = "";
	} else {
		pane.style.display = "none";
	}

	if (StatusbarEx.fixed_length) {
		// pane.style.fontFamily = "Courier, \"Lucida Console\", monospace";
		pane.style.width = width + "px";
	} else {
		// pane.style.fontFamily = "";
		pane.style.width = "";
	}
}

StatusbarEx.updateTooltip = function () {
	try {
		var txt = '';
	
		if (this.show_memory) {
			txt = this.getString("main_memoryavailable");
			if (this.show_totalmemory) {
				txt += ' / '+ this.getString("main_totalmemory");
			}
		} else if (this.show_totalmemory) {
			txt = this.getString("main_totalmemory"); 
		}
		if (this.show_syscpu) {
			txt += " " + this.getString("main_cpuusage");
		}
		document.getElementById('sbex-sys').setAttribute('tooltiptext', txt);
	
		txt = '';
		if (this.show_fxmemory) {
			txt = this.getString("main_memoryfirefoxused");
			if (this.show_fxcpu) {
				txt += ' | '+ this.getString("main_firefoxcpuusage");
			}
		} else if (this.show_fxcpu) {
			txt = this.getString("main_firefoxcpuusage");
		}
		document.getElementById('sbex-fx').setAttribute('tooltiptext', txt);


		txt = this.getString("main_downup");
		var idx;
		for (idx = 0; idx < SBEX_MAX_ETH_COUNT; ++ idx) {
			if (this.show_ethN[idx]) {
				var eth_name = {value : ""};
				this.sm.GetEthernetName(idx, eth_name);
				txt += "\r\n#" + idx.toString() + ": " + eth_name.value;

				if (eth_name.value.length > 0) {
					this.ethN_name_got = true;
				}
			}
		}
		document.getElementById('sbex-net').setAttribute('tooltiptext', txt);
	} catch (e) {
		var txt = this.getString("main_statusbarexupdatetool") + e.message + ">";
		this.dump(txt);
	}
}

StatusbarEx.showPaneS = function () {
	var pane = document.getElementById('sbex-page');
	this.showPane(pane, this.show_page, 140);
	if (this.show_page) {
		var doc = gBrowser.selectedBrowser.contentDocument;
		this.update_page_info(doc);
	}

	pane = document.getElementById('sbex-sys');
	var width = 0;
	if (this.show_memory) {
		width += 60;
	}
	if (this.show_totalmemory) {
		width += 60;
	}
	if (this.show_syscpu) {
		width += 60;
	}
	this.showPane(pane, width > 0, width);

	pane = document.getElementById('sbex-fx');
	if (this.compact_mode) {
		this.showPane(pane, this.show_fxcpu || this.show_fxmemory, this.show_fxcpu && this.show_fxmemory ? 120 : 60);
	} else {
		this.showPane(pane, this.show_fxcpu || this.show_fxmemory, this.show_fxcpu && this.show_fxmemory ? 130 : 80);
	}

	pane = document.getElementById('sbex-net');
	var bShow = false;
	var i = 0;
	width = 0;
	for (; i < SBEX_MAX_ETH_COUNT; ++ i) {
		if (this.show_ethN[i]) {
			bShow = true;
			if (this.compact_mode) {
				width = width + 120;
			} else {
				width = width + 140;
			}
		}
	}
	this.showPane(pane, bShow, width);

	// hide the power pane first.
	pane = document.getElementById('sbex-pwr');
	this.showPane(pane, this.show_pwr);

	this.updateTooltip();
}

StatusbarEx.setTextColor = function () {
	var pane = document.getElementById('sbex-sys');
	pane.style.color = this.text_color;

	pane = document.getElementById('sbex-fx');
	pane.style.color = this.text_color;

	pane = document.getElementById('sbex-net');
	pane.style.color = this.text_color;

	pane = document.getElementById('sbex-pwr');
	pane.style.color = this.text_color;

	pane = document.getElementById('sbex-page');
	pane.style.color = this.text_color;
}



StatusbarEx.setSbPref = function () {
	var sbprefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	sbPrefObserver.register();
	try {
		this.text_color = sbprefs.getCharPref("extensions.statusbarEx.text_color");
		this.show_page = sbprefs.getBoolPref("extensions.statusbarEx.show_page");
		this.show_memory = sbprefs.getBoolPref("extensions.statusbarEx.show_memory");
		this.show_totalmemory = sbprefs.getBoolPref("extensions.statusbarEx.show_totalmemory");
		this.show_syscpu = sbprefs.getBoolPref("extensions.statusbarEx.show_syscpu");
		this.show_fxmemory = sbprefs.getBoolPref("extensions.statusbarEx.show_fxmemory");
		this.show_fxcpu = sbprefs.getBoolPref("extensions.statusbarEx.show_fxcpu");
		this.show_pwr = sbprefs.getBoolPref("extensions.statusbarEx.show_power");
		this.fixed_length = sbprefs.getBoolPref("extensions.statusbarEx.fixed_length");
		this.compact_mode = sbprefs.getBoolPref("extensions.statusbarEx.compact_mode");
 		this.sbVersion = sbprefs.getCharPref("extensions.statusbarEx.firstrun");

		var i = 0;
		for (; i < SBEX_MAX_ETH_COUNT; ++ i) {
			var Key = "extensions.statusbarEx.show_eth";
			Key += i;
			this.show_ethN[i] = sbprefs.getBoolPref(Key);
		}

		this.setTextColor();
		this.showPaneS();
	} catch (e) {
    		this.dump('StatusbarEx::setSbPref error with ' + e.message);
	}
}


var sbPrefObserver = {
	register: function() {
		var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		this._branch = prefService.getBranch("extensions.statusbarEx.");
		this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this._branch.addObserver("", this, false);
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

		var sbprefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		if (aData == "text_color") {
			StatusbarEx.text_color = sbprefs.getCharPref("extensions.statusbarEx.text_color");
			StatusbarEx.setTextColor();
			return;
		} else if (aData == "show_page") {
			StatusbarEx.show_page = sbprefs.getBoolPref("extensions.statusbarEx.show_page");
		} else if (aData == "show_memory") {
			StatusbarEx.show_memory = sbprefs.getBoolPref("extensions.statusbarEx.show_memory");
		} else if (aData == "show_totalmemory") {
			StatusbarEx.show_totalmemory = sbprefs.getBoolPref("extensions.statusbarEx.show_totalmemory");
		} else if (aData == "show_syscpu") {
			StatusbarEx.show_syscpu = sbprefs.getBoolPref("extensions.statusbarEx.show_syscpu");
		} else if (aData == "show_fxmemory") {
			StatusbarEx.show_fxmemory = sbprefs.getBoolPref("extensions.statusbarEx.show_fxmemory");
		} else if (aData == "show_fxcpu") {
			StatusbarEx.show_fxcpu = sbprefs.getBoolPref("extensions.statusbarEx.show_fxcpu");
		} else if (aData == "show_power") {
			StatusbarEx.show_pwr = sbprefs.getBoolPref("extensions.statusbarEx.show_power");
		} else if (aData == "fixed_length") {
			StatusbarEx.fixed_length = sbprefs.getBoolPref("extensions.statusbarEx.fixed_length");
		} else if (aData == "compact_mode") {
			StatusbarEx.compact_mode = sbprefs.getBoolPref("extensions.statusbarEx.compact_mode");
		} else if (aData == "firstrun") {
			StatusbarEx.sbVersion = sbprefs.getCharPref("extenstions.statusbarEx.firstrun");
		} else {
			var i = 0;
			for (; i < SBEX_MAX_ETH_COUNT; ++ i) {
				var Key = "extensions.statusbarEx.show_eth";
				Key += i;
				StatusbarEx.show_ethN[i] = sbprefs.getBoolPref(Key);
			}
		}
		StatusbarEx.showPaneS();
	}
}



