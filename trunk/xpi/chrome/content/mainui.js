var gstatusbarexBundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);
var mystrings = gstatusbarexBundle.createBundle("chrome://statusbarex/locale/main.properties");
var main_charging = mystrings.GetStringFromName("main_charging");
var main_aclineon = mystrings.GetStringFromName("main_aclineon");
var main_batteryremaining = mystrings.GetStringFromName("main_batteryremaining");
var main_getpowerstatusmeter8 = mystrings.GetStringFromName("main_getpowerstatusmeter8");
var main_statusbarexupdatefail9 = mystrings.GetStringFromName("main_statusbarexupdatefail9");
var main_empty = mystrings.GetStringFromName("main_empty");
var main_lastmodified = mystrings.GetStringFromName("main_lastmodified");
var main_loading = mystrings.GetStringFromName("main_loading");
var main_lastmodified = mystrings.GetStringFromName("main_lastmodified");
var main_statusbarexattribute = mystrings.GetStringFromName("main_statusbarexattribute");
var main_memoryavailable = mystrings.GetStringFromName("main_memoryavailable");
var main_totalmemory = mystrings.GetStringFromName("main_totalmemory");
var main_memoryfirefoxused = mystrings.GetStringFromName("main_memoryfirefoxused");
var main_firefoxcpuusage = mystrings.GetStringFromName("main_firefoxcpuusage");
var main_downup = mystrings.GetStringFromName("main_downup");
var main_downup = mystrings.GetStringFromName("main_downup");
var main_statusbarexupdatetoo16 = mystrings.GetStringFromName("main_statusbarexupdatetoo16");
var main_statusbarexprefchanged = mystrings.GetStringFromName("main_statusbarexprefchanged");


const _SBEX_CC = Components.classes;

const SBEX_UPDATE_RATE = 1000;
const SBEX_DUMP_FOR_EVERY_N_REQUEST = 10;
const SBEX_MAX_ETH_COUNT = 5;

var text_color = '#000000';
var show_page = false;
var show_memory = true;
var show_totalmemory = true;
var show_fxmemory = true;
var show_fxcpu = true;
var show_ethN = new Array();
var ethN_name_got = false;
var fixed_length = true;
var compact_mode = false;
var sbVersion = '0';
var show_pwr = true;

var pwr_ac = -1;
var pwr_flag = -1;



function jsdump(str)
{
	if (false) // turn off dump when release.
	{
		var d = new Date();
		var dump_str = d.toTimeString() + ":" + str;
		_SBEX_CC['@mozilla.org/consoleservice;1'].getService(Components.interfaces.nsIConsoleService).logStringMessage(dump_str);
	}
}

function fix_string_length(str, len)
{
	if (fixed_length)
	{
		while (str.length < len)
			str = " " + str;
	}
	return str;
}


function sbexShowHomePage()
{
	getBrowser().removeEventListener('load', sbexShowHomePage, true);
	var homepg = 'http://www.xilou.us/home/statusbarex';
	
	getBrowser().selectedTab = getBrowser().addTab(homepg); 
}


function show_system_info(sm)
{
	var txt = "";

	if (show_memory || show_totalmemory)
	{
		var mem1 = {value:0};
		var mem2 = {value:0};
		sm.GetMemoryStatus(mem1, mem2);

		if (show_memory)
		{
			txt += mem2.value.toString() + "M";
			if (show_totalmemory)
				txt += "/" + mem1.value.toString() + "M";
		}
		else
			txt += mem1.value.toString() + "M";				

		document.getElementById('sbex-sys').label = txt;
	}
}


function show_fx_info(sm)
{
	var txt = "";

	if (show_fxmemory || show_fxcpu)
	{
		var val = {value:0};
		txt = compact_mode ? "" : "Fx:["
		
		if (show_fxmemory)
		{
			var vm_size = {value:0};
			sm.GetFxMemory(val, vm_size);
			txt += val.value.toString() + "M";// + "/" + vm_size.value.toString() + "M";
			
			if (show_fxcpu)
				txt += ' ';
		}

		if (show_fxcpu)
		{
			sm.GetFxCpuUsage(val);
			txt += fix_string_length(val.value.toString(), 2) + "%";
		}
		
		txt += compact_mode ? "" : "]"
		document.getElementById('sbex-fx').label = txt;
	}
}


function show_network_info(sm)
{
	var txt = "";

	var cnt = sm.GetEthernetCount();
	if (cnt > SBEX_MAX_ETH_COUNT)
		cnt = SBEX_MAX_ETH_COUNT;
	var i = 0;
	var fix_len = 0;
	var sep = "";
	for (; i < cnt; ++ i)
	{
		if (show_ethN[i])
		{
			var temp_text = '';
			var in_speed = {value:0};
			var out_speed = {value:0};
			sm.GetEthernetSpeed(i, in_speed, out_speed);
			var inString = in_speed.value.toString() + 'K';
			var outString = out_speed.value.toString() + 'K';

			if (compact_mode)
				temp_text = " #" + i.toString() + " " + inString + "/" + outString + sep;
			else
				temp_text = " #" + i.toString() + "[D:" + inString + " - U:" + outString + "]" + sep;

			fix_len = temp_text.length - inString.length - outString.length;
			txt += fix_string_length(temp_text, fix_len + 4 + 4);
			sep = " ";
		}
	}
	document.getElementById('sbex-net').label = txt;

	if (!ethN_name_got)
		updateTooltip();
}


function show_power_info(sm)
{
	var txt = "";

	// power
	if (show_pwr)
	{
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
		sm.GetPowerStatus(ac, btyFlag, btyLifePercent, btyLifeTime, hour, minute, second);

		if (ac.value == 1) // AC on line
		{
			if (btyFlag.value & 8) // charging
			{
				panel_pwr_img.src = "chrome://statusbarex/content/charging.gif";
				panel_pwr.setAttribute('tooltiptext', main_charging)
				panel_pwr_img.setAttribute('tooltiptext', main_charging)
				panel_pwr_desc.setAttribute('tooltiptext', main_charging)

				var percent = btyLifePercent.value;
				panel_pwr_desc.style.display="";
				panel_pwr_desc.value = fix_string_length(percent.toString(),3) + "%";
			}
			else
			{
				panel_pwr_img.src = "chrome://statusbarex/content/ac.png";
				panel_pwr.setAttribute('tooltiptext', main_aclineon)
				panel_pwr_img.setAttribute('tooltiptext', main_aclineon)
				panel_pwr_desc.style.display="none";
				// panel_pwr_desc.setAttribute('tooltiptext', "AC line on")
			}
		}
		else if (ac.value == 0) // AC off line
		{
			var percent = btyLifePercent.value;
			if (percent > 100)
				percent = 100;
			if (percent < 10)
				panel_pwr_img.src = "chrome://statusbarex/content/battery-empty.png";
			else if(percent < 30)
				panel_pwr_img.src = "chrome://statusbarex/content/battery-low.png";
			else if(percent < 85)
				panel_pwr_img.src = "chrome://statusbarex/content/battery-middle.png";
			else
				panel_pwr_img.src = "chrome://statusbarex/content/battery-high.png";
			panel_pwr.setAttribute('tooltiptext', main_batteryremaining + percent.toString() + "%");
			panel_pwr_img.setAttribute('tooltiptext', main_batteryremaining + percent.toString() + "%");

			panel_pwr_desc.style.display="";
			panel_pwr_desc.setAttribute('tooltiptext', main_batteryremaining + percent.toString() + "%");
			panel_pwr_desc.value = fix_string_length(percent.toString(),2) + "%  " +
				(hour.value <= 9 ? "0" : "") + hour.value.toString() + ":" + 
				(minute.value <= 9 ? "0" : "") + minute.value.toString() + (compact_mode ? " hours" : "");
		}
		else
		{
			jsdump(main_getpowerstatusmeter8);
		}

	}
}




var dump_request = 0;
function update_content()
{
	try
	{
		var sm = _SBEX_CC["@doudehou/statusbarEx;1"].createInstance(Components.interfaces.IStatusbarExCore);

		show_system_info(sm);
		show_fx_info(sm);
		show_network_info(sm);
		show_power_info(sm);


		return true;
	}
	catch (e)
	{
		var txt = main_statusbarexupdatefail9 + e.message + ">";
		jsdump(txt);
		return false;
	}

}


function update_page_info(doc)
{
	var panel = document.getElementById('sbex-page');
	var bReset = false;
	try
	{
		if (doc.location.toString().search("about:") == 0)
		{
			// bReset = true;
			panel.label = main_empty;
			jsdump(">>>update_page_info() with:" + doc.location.toString());
		}
		else
		{
			panel.label = doc.lastModified;
		}

		panel.setAttribute('tooltiptext', main_lastmodified + doc.location.toString() + ")");
	}
	catch(e)
	{
		bReset = true;
		jsdump(">>>sbex_on_tabselect() error with <" + e.message + ">"); 
	}

	if (bReset)
	{
		try{
			panel.label = main_loading;
			panel.setAttribute('tooltiptext', main_lastmodified);
		}
		catch(e){}
	}
}


function update_on_timer()
{
	if (update_content())
		window.setTimeout(update_on_timer, SBEX_UPDATE_RATE);
	else
		window.setTimeout(update_on_timer, SBEX_UPDATE_RATE * 3); // try 3 seconds later.
}

window.setTimeout(update_on_timer, SBEX_UPDATE_RATE);



function showSbExOptions()
{
	window.openDialog('chrome://statusbarex/content/options.xul','_blank','chrome,centerscreen,resizable=no,dialog=yes,close=no,dependent=yes').focus();
}

function on_click(e)
{
	showSbExOptions();
}



///////////////////////////////////////////////////////////////////////////////////
// const SBEX_STATE_START = Components.interfaces.nsIWebProgressListener.STATE_START;
const SBEX_STATE_STOP = Components.interfaces.nsIWebProgressListener.STATE_STOP;
var sbex_progListener =
{
	QueryInterface: function(aIID)
	{
		if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
			 aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
			 aIID.equals(Components.interfaces.nsISupports))
			return this;
		throw Components.results.NS_NOINTERFACE;
	},

	onStateChange: function(aProgress, aRequest, aFlag, aStatus)
	{
		if (!show_page)
			return 0;

		try
		{
			var doc = aProgress.DOMWindow.document;
			var browser = gBrowser.getBrowserForDocument(doc);
			if (browser == gBrowser.selectedBrowser)
				update_page_info(doc);
		}
		catch(ex)
		{
			jsdump(">>>onStateChange() error with " + ex.message);
		}
		return 0;
	},

	onLocationChange: function(aProgress, aRequest, aURI)
	{
		if (!show_page)
			return 0;

		if (aProgress.DOMWindow != gBrowser.selectedBrowser)
			return 0;

		update_page_info(gBrowser.selectedBrowser.document);
		return 0;
	},

	// For definitions of the remaining functions see XULPlanet.com
	onProgressChange: function() {return 0;},
	onStatusChange: function() {return 0;},
	onSecurityChange: function() {return 0;},
	onLinkIconAvailable: function() {return 0;}
}




function sbex_on_tabselect(evt)
{
	if (!show_page)
		return;

	var doc = gBrowser.selectedBrowser.contentDocument;
	update_page_info(doc);
}


function onLoad()
{
	setSbPref();

	// --- Check the first run OR new version ---
	var sbEM = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
	var sbAddon = sbEM.getItemForID("doudehou@gmail.com");
	var newVersion = sbAddon.version;
	jsdump(main_statusbarexattribute + sbAddon.name + "@" + sbAddon.version);
	
	if (sbAddon.name == "StatusbarEx")
	{
		if(sbVersion != newVersion)
		{
			if(window.navigator.onLine)
			{
				Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).setCharPref("extensions.statusbarEx.firstrun", newVersion);
				getBrowser().addEventListener('load', sbexShowHomePage, true);
			}
		}
	}
	// ---          END OF CHECKING           ---

	window.removeEventListener('load', onLoad, false);

	// gBrowser.addEventListener("load", sbex_on_page_load, true);

	gBrowser.addProgressListener(sbex_progListener,
		Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);

	var tabContainer = gBrowser.tabContainer;
	tabContainer.addEventListener("TabSelect", sbex_on_tabselect, false);
	return;
}



function showPane(pane, show)
{
	if (show)
		pane.style.display = "";
	else
		pane.style.display = "none";

	if (fixed_length)
		pane.style.fontFamily = "\"Courier New\",monospace";
	else
		pane.style.fontFamily = "";
}

function updateTooltip()
{
	try
	{
		var txt = '';
	
		if (show_memory)
		{
			txt = main_memoryavailable;
			if (show_totalmemory)
				txt += ' / '+main_totalmemory;
		}
		else if (show_totalmemory)
			txt = main_totalmemory; 
		document.getElementById('sbex-sys').setAttribute('tooltiptext', txt);
	
		txt = '';
		if (show_fxmemory)
		{
			txt = main_memoryfirefoxused;
			if (show_fxcpu)
				txt += ' | '+main_firefoxcpuusage;
		}
		else if (show_fxcpu)
			txt = main_firefoxcpuusage;
		document.getElementById('sbex-fx').setAttribute('tooltiptext', txt);


		txt = '';
		if (compact_mode)
		{
			txt = main_downup;
		}
		else
		{
			txt = main_downup;
		}
		var tmpFlag = false;
		var idx;
		var sm = _SBEX_CC["@doudehou/statusbarEx;1"].createInstance(Components.interfaces.IStatusbarExCore);
		txt += " (";
		for (idx = 0; idx < SBEX_MAX_ETH_COUNT; ++ idx)
		{
			if (show_ethN[idx])
			{
				var eth_name = {value:""};
				sm.GetEthernetName(idx, eth_name);
				if (tmpFlag)
					txt += " - ";
				txt += "#" + idx.toString() + ":" + eth_name.value;
				tmpFlag = true;

				if (eth_name.value.length > 0)
					ethN_name_got = true;
			}
		}
		txt += ")";
		document.getElementById('sbex-net').setAttribute('tooltiptext', txt);
	}
	catch(e)
	{
		var txt = main_statusbarexupdatetoo16 + e.message + ">";
		jsdump(txt);
	}
}

function showPaneS()
{
	var pane = document.getElementById('sbex-page');
	showPane(pane, show_page);
	if (show_page)
	{
		var doc = gBrowser.selectedBrowser.contentDocument;
		update_page_info(doc);
	}

	pane = document.getElementById('sbex-sys');
	showPane(pane, show_memory || show_totalmemory);

	pane = document.getElementById('sbex-fx');
	showPane(pane, show_fxcpu || show_fxmemory);

	pane = document.getElementById('sbex-net');
	var bShow = false;
	var i = 0;
	for (; i < SBEX_MAX_ETH_COUNT; ++ i)
	{
		if (show_ethN[i])
		{
			bShow = true;
			break;
		}
	}
	showPane(pane, bShow);

	// hide the power pane first.
	pane = document.getElementById('sbex-pwr');
	showPane(pane, show_pwr);

	updateTooltip();
}

function setTextColor()
{
	var pane = document.getElementById('sbex-sys');
	pane.style.color = text_color;

	pane = document.getElementById('sbex-fx');
	pane.style.color = text_color;

	pane = document.getElementById('sbex-net');
	pane.style.color = text_color;

	pane = document.getElementById('sbex-pwr');
	pane.style.color = text_color;

	pane = document.getElementById('sbex-page');
	pane.style.color = text_color;
}



function setSbPref()
{
	var sbprefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	sbPrefObserver.register();
	try
	{
		text_color = sbprefs.getCharPref("extensions.statusbarEx.text_color");
		show_page = sbprefs.getBoolPref("extensions.statusbarEx.show_page");
		show_memory = sbprefs.getBoolPref("extensions.statusbarEx.show_memory");
		show_totalmemory = sbprefs.getBoolPref("extensions.statusbarEx.show_totalmemory");
		show_fxmemory = sbprefs.getBoolPref("extensions.statusbarEx.show_fxmemory");
		show_fxcpu = sbprefs.getBoolPref("extensions.statusbarEx.show_fxcpu");
		show_pwr = sbprefs.getBoolPref("extensions.statusbarEx.show_power");
		fixed_length = sbprefs.getBoolPref("extensions.statusbarEx.fixed_length");
		compact_mode = sbprefs.getBoolPref("extensions.statusbarEx.compact_mode");
 		sbVersion = sbprefs.getCharPref("extensions.statusbarEx.firstrun");

		var i = 0;
		for (; i < SBEX_MAX_ETH_COUNT; ++ i)
		{
			var Key = "extensions.statusbarEx.show_eth";
			Key += i;
			show_ethN[i] = sbprefs.getBoolPref(Key);
		}

		setTextColor();
		showPaneS();
	}
	catch(e)
	{
    		jsdump('>>>StatusbarEx::setSbPref error with ' + e.message);
	}
}


var sbPrefObserver =
{
	register: function()
	{
		var prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
		this._branch = prefService.getBranch("extensions.statusbarEx.");
		this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this._branch.addObserver("", this, false);
	},

	unregister: function()
	{
		if(!this._branch)
			return;
		this._branch.removeObserver("", this);
	},

	observe: function(aSubject, aTopic, aData)
	{
		if(aTopic != "nsPref:changed")
			return;

		jsdump(main_statusbarexprefchanged + aData);
		var sbprefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

		if (aData == "text_color")
		{
			text_color = sbprefs.getCharPref("extensions.statusbarEx.text_color");
			setTextColor();
			return;
		}
		else if (aData == "show_page")
			show_page = sbprefs.getBoolPref("extensions.statusbarEx.show_page");
		else if (aData == "show_memory")
			show_memory = sbprefs.getBoolPref("extensions.statusbarEx.show_memory");
		else if (aData == "show_totalmemory")
			show_totalmemory = sbprefs.getBoolPref("extensions.statusbarEx.show_totalmemory");
		else if (aData == "show_fxmemory")
			show_fxmemory = sbprefs.getBoolPref("extensions.statusbarEx.show_fxmemory");
		else if (aData == "show_fxcpu")
			show_fxcpu = sbprefs.getBoolPref("extensions.statusbarEx.show_fxcpu");
		else if (aData == "show_power")
			show_pwr = sbprefs.getBoolPref("extensions.statusbarEx.show_power");
		else if (aData == "fixed_length")
			fixed_length = sbprefs.getBoolPref("extensions.statusbarEx.fixed_length");
		else if (aData == "compact_mode")
			compact_mode = sbprefs.getBoolPref("extensions.statusbarEx.compact_mode");
		else if (aData == "firstrun")
			sbVersion = sbprefs.getCharPref("extenstions.statusbarEx.firstrun");
		else
		{
			var i = 0;
			for (; i < SBEX_MAX_ETH_COUNT; ++ i)
			{
				var Key = "extensions.statusbarEx.show_eth";
				Key += i;
				show_ethN[i] = sbprefs.getBoolPref(Key);
			}
		}
		showPaneS();
	}
}



