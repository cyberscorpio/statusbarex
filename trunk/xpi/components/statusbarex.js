/************************************************
 * constants
 ************************************************/
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Ce = Components.Exception;

const nsISupports = Ci.nsISupports;
const IStatusbarExCore = Ci.IStatusbarExCore;


Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Components.utils.import("resource://gre/modules/ctypes.jsm")


/**
 * The object for all interfaces in StatusbarEx
 */
function StatusbarExObj() {
	this.logger = Cc['@mozilla.org/consoleservice;1'].getService(Ci.nsIConsoleService);
	var logger = this.logger;

try {
	// memory 
	const MEMORYSTATUSEX = new ctypes.StructType('MEMORYSTATUSEX',
		[
			{dwLength: ctypes.uint32_t},
			{dwMemoryLoad: ctypes.uint32_t},
			{ullTotalPhys: ctypes.uint64_t},
			{ullAvailPhys: ctypes.uint64_t},
			{ullTotalPageFile: ctypes.uint64_t},
			{ullAvailPageFile: ctypes.uint64_t},
			{ullTotalVirtual: ctypes.uint64_t},
			{ullAvailVirtual: ctypes.uint64_t},
			{ullAvailExtendedVirtual: ctypes.uint64_t}
		]);
	// process memory
	const PROCESS_MEMORY_COUNTERS = new ctypes.StructType('PROCESS_MEMORY_COUNTERS',
		[
			{cb: ctypes.uint32_t},
			{PageFaultCount: ctypes.uint32_t},
			{PeakWorkingSetSize: ctypes.uintptr_t},
			{WorkingSetSize: ctypes.uintptr_t},
			{QuotaPeakPagedPoolUsage: ctypes.uintptr_t},
			{QuotaPagePoolUsage: ctypes.uintptr_t},
			{QuotaPeakNonPagedPoolUsage: ctypes.uintptr_t},
			{QuotaNonPagedPoolUsage: ctypes.uintptr_t},
			{PagefileUsage: ctypes.uintptr_t},
			{PeakPagefileUsage: ctypes.uintptr_t}
		]);
	// system info
	const SYSTEM_INFO = new ctypes.StructType('SYSTEM_INFO',
		[
			{oemid: ctypes.uint32_t},
			{dwPageSize: ctypes.uint32_t},
			{lpMinApplicationAddr: ctypes.voidptr_t},
			{lpMaxApplicationAddr: ctypes.voidptr_t},
			{dwActiveProcessorMask: ctypes.uintptr_t},
			{dwNumberOfProcessors: ctypes.uint32_t},
			{dwProcessorType: ctypes.uint32_t},
			{dwAllocationGranularity: ctypes.uint32_t},
			{wProcessorLevel: ctypes.uint16_t},
			{wProcessorRevision: ctypes.uint16_t}
		]);
	// file time
	const FILETIME = new ctypes.StructType('FILETIME',
		[
			{dwLowDateTime: ctypes.uint32_t},
			{dwHighDateTime: ctypes.uint32_t}
			// {ullDateTime: ctypes.uint64_t}
		]);


	var kernel32 = ctypes.open('kernel32.dll');
	var psapi = ctypes.open('psapi.dll');

	// GlobalMemoryStatusEx
	var fnGlobalMemoryStatusEx = kernel32.declare('GlobalMemoryStatusEx',
			ctypes.winapi_abi,
			ctypes.uint32_t,
			MEMORYSTATUSEX.ptr);

	// GetCurrentProcess
	var fnGetCurrentProcess = kernel32.declare('GetCurrentProcess',
			ctypes.winapi_abi,
			ctypes.voidptr_t);
	var currentProcess = fnGetCurrentProcess();

	// GetProcessTimes
	var fnGetProcessTimes = kernel32.declare('GetProcessTimes',
			ctypes.winapi_abi,
			ctypes.uint32_t,
			ctypes.voidptr_t,
			FILETIME.ptr,
			FILETIME.ptr,
			FILETIME.ptr,
			FILETIME.ptr);

	// GetSystemInfo
	var fnGetSystemInfo = kernel32.declare('GetSystemInfo',
			ctypes.winapi_abi,
			ctypes.void_t,
			SYSTEM_INFO.ptr);
	var si = SYSTEM_INFO();
	fnGetSystemInfo(si.address());
	var cpuCount = si.dwNumberOfProcessors;

	// GetProcessMemoryInfo
	var fnGetProcessMemoryInfo = psapi.declare('GetProcessMemoryInfo',
			ctypes.winapi_abi,
			ctypes.uint32_t,
			ctypes.voidptr_t,
			PROCESS_MEMORY_COUNTERS.ptr,
			ctypes.uint32_t);


	////////////////////////////////////////////////
	// Memory usage 

	var msex = MEMORYSTATUSEX();
	this.GetMemoryStatus = function(total_memory, free_memory) {
		try {
			msex.dwLength = MEMORYSTATUSEX.size;
			fnGlobalMemoryStatusEx(msex.address());
			total_memory.value = Math.floor(msex.ullTotalPhys / (1024 * 1024));
			free_memory.value = Math.floor(msex.ullAvailPhys / (1024 * 1024));
		} catch (e) {
			logger.logStringMessage('++++++++++' + e + '++++++++++');
		}
	}

	var pmc = PROCESS_MEMORY_COUNTERS();
	this.GetFxMemory = function(usage, vm_size) {
		try {
			pmc.cb = PROCESS_MEMORY_COUNTERS.size;
			fnGetProcessMemoryInfo(currentProcess, pmc.address(), PROCESS_MEMORY_COUNTERS.size);
			usage.value = Math.floor(pmc.WorkingSetSize / (1024 * 1024));
			vm_size.value = Math.floor(pmc.PagefileUsage / (1024 * 1024));
		} catch (e) {
			logger.logStringMessage('-----------' + e + '----------');
		}
	}


	////////////////////////////////////////////////
	// CPU usage 

	var ftdmy1 = FILETIME(), ftdmy2 = FILETIME(); // used by sys & fx cpu usage

	var fxKt = FILETIME(), fxUt = FILETIME();
	var fxKtNow = FILETIME(), fxUtNow = FILETIME();
	fnGetProcessTimes(currentProcess, ftdmy1.address(), ftdmy2.address(), fxKt.address(), fxUt.address());
	var fxTs = Date.now();
	var fxCpuUsage = 0;
	this.GetFxCpuUsage = function(cpu_usage) {
		try {
			var ts = Date.now();
			if (ts - fxTs > 500) {
				fnGetProcessTimes(currentProcess,
					ftdmy1.address(), ftdmy2.address(),
					fxKtNow.address(), fxUtNow.address());
				// logger.logStringMessage(' -----------------');
				fxCpuUsage = getValueFromFileTime(fxKtNow) - getValueFromFileTime(fxKt) +
					getValueFromFileTime(fxUtNow) - getValueFromFileTime(fxUt);
				// logger.logStringMessage(' +++++++++++++++++');
				/*
				logger.logStringMessage('=============    ' + fxKtNow.ullDateTime + ':' + fxKt.ullDateTime + ' >>> ' + ts + ':' +  fxTs + '     ===============');
				logger.logStringMessage('-------------    ' + fxUtNow.ullDateTime + ':' + fxUt.ullDateTime + ' >>> ' + ts + ':' +  fxTs + '     ===============');
				*/
				// logger.logStringMessage('-----------   ' + fxCpuUsage + '   ----------');
				fxCpuUsage /= 100;
				fxCpuUsage /= (ts - fxTs);
				fxCpuUsage = Math.floor(fxCpuUsage / cpuCount);

				if (fxCpuUsage > 100) {
					fxCpuUsage = 100;
				}
	
				fxTs = ts;
				fxKt.dwLowDateTime = fxKtNow.dwLowDateTime;
				fxKt.dwHighDateTime = fxKtNow.dwHighDateTime;
				fxUt.dwLowDateTime = fxUtNow.dwLowDateTime;
				fxUt.dwHighDateTime = fxUtNow.dwHighDateTime;
			}
	
			cpu_usage.value = fxCpuUsage;
		} catch (e) {
			logger.logStringMessage('^^^^^^^^^^' + e + '^^^^^^^^^^');
		}
	}

	this.GetSysCpuUsage = function(sys_cpu_usage) {
		sys_cpu_usage.value = 50;
	}


	////////////////////////////////////////////////
	// Ethernet

	this.GetEthernetCount = function() {
		return 1;
	}

	this.GetEthernetSpeed = function(index, in_speed, out_speed) {
		in_speed.value = 1024 * 24;
		out_speed.value = 1024 * 32;
	}

	this.GetEthernetName = function(index, name) {
		name.value = 'dummy!';
	}

} catch (e) {
	logger.logStringMessage('***********' + e + '**********');
}

	function getValueFromFileTime(ft) {
		var value = ctypes.UInt64.join(ft.dwHighDateTime, ft.dwLowDateTime);
		// logger.logStringMessage('value: ' + value);
		return value.toString() - 0;
	}
}

StatusbarExObj.prototype = {
	// 9A15453F-2D14-42E5-91EA-09A32E88FF39
	classID: Components.ID("{9A15453F-2D14-42E5-91EA-09A32E88FF39}"),
	/**
	 * .classDescription and .contractID are only used for backwards compatibility
	 * with Gecko 1.9.2 and XPCOMUtils.generateNSGetModule.
	 * in gecko 2, the information is in chrome.manifest
	 */
	classDescription: 'StatusbarExCoreObject',
	contractID: '@enjoyfreeware.org/statusbarex;1',

	/**
	 * List all the interfaces your component supports.
	 * @note nsISupports is generated automatically; you don't need to list it.
	 */
	// QueryInterface: XPCOMUtils.generateQI([ssIObserverable, ssIConfig, ssISiteManager, ssITodoList]),
	QueryInterface: XPCOMUtils.generateQI([IStatusbarExCore]),


	/////////////////////////////////////////
	// utilies

	// below file I/O is copied from:
	// - https://developer.mozilla.org/en/Code_snippets/File_I%2f%2fO
	/**
	 * @param file is nsIFile
	 * @return the content of the file, as a string
	 */
	fileGetContents: function(file) {
		var is = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);
		var cs = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
		is.init(file, -1, 0, 0);
		cs.init(is, "UTF-8", 0, 0); // you can use another encoding here if you wish
		
		var data = '';
		let (str = {}) {
			let read = 0;
			do { 
				read = cs.readString(0xffffffff, str); // read as much as we can and put it in str.value
				data += str.value;
			} while (read != 0);
		}
		cs.close(); // this closes 'is'
		
		return data;
	},

	/**
	 * @param file is nsIFile
	 * @param data is a string
	 */
	filePutContents: function(file, data) {
		var os = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
		
		// use 0x02 | 0x10 to open file for appending.
		os.init(file, 0x02 | 0x08 | 0x20, FileUtils.PERMS_FILE, 0); 
		// write, create, truncate
		// In a c file operation, we have no need to set file mode with or operation,
		// directly using "r" or "w" usually.
		
		// if you are sure there will never ever be any non-ascii text in data you can 
		// also call foStream.writeData directly
		var converter = Cc["@mozilla.org/intl/converter-output-stream;1"].createInstance(Ci.nsIConverterOutputStream);
		converter.init(os, "UTF-8", 0, 0);
		converter.writeString(data);
		converter.close(); // this closes os
	},
};

/**
 * XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
 * XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 (Firefox 3.6).
 */
if (XPCOMUtils.generateNSGetFactory) {
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([StatusbarExObj]);
} else {
	var NSGetModule = XPCOMUtils.generateNSGetModule([StatusbarExObj]);
}



