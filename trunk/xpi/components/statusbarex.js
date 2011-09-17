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
		]);
	// MIB_IFROW
	const MIB_IFROW = new ctypes.StructType('MIB_IFROW',
		[
			{wszName: ctypes.ArrayType(ctypes.jschar, 256)},
			{dwIndex: ctypes.uint32_t},
			{dwType: ctypes.uint32_t},
			{dwMtu: ctypes.uint32_t},
			{dwSpeed: ctypes.uint32_t},
			{dwPhysAddrLen: ctypes.uint32_t},
			{bPhysAddr: ctypes.ArrayType(ctypes.uint8_t, 8)},
			{dwAdminStatus: ctypes.uint32_t},
			{dwOperStatus: ctypes.uint32_t},
			{dwLastChange: ctypes.uint32_t}, 
			{dwInOctets: ctypes.uint32_t},
			{dwInUcastPkts: ctypes.uint32_t},
			{dwInNUcastPkts: ctypes.uint32_t},
			{dwInDiscards: ctypes.uint32_t},
			{dwInErrors: ctypes.uint32_t},
			{dwInUnknownProtos: ctypes.uint32_t},
			{dwOutOctets: ctypes.uint32_t},
			{dwOutUcastPkts: ctypes.uint32_t},
			{dwOutNUcastPkts: ctypes.uint32_t},
			{dwOutDiscards: ctypes.uint32_t},
			{dwOutErrors: ctypes.uint32_t},
			{dwOutQLen: ctypes.uint32_t},
			{dwDescrLen: ctypes.uint32_t},
			{bDescr: ctypes.ArrayType(ctypes.uint8_t, 256)}
		]);
	const MIB_IFTABLE = new ctypes.StructType('MIB_IFTABLE',
		[
			{dwNumEntries: ctypes.uint32_t},
			{table: ctypes.ArrayType(MIB_IFROW, 64)}
		]);


	var kernel32 = ctypes.open('kernel32.dll');
	var psapi = ctypes.open('psapi.dll');
	var iphlpapi = ctypes.open('iphlpapi.dll');


	// the ABI code is copied from: http://forums.mozillazine.org/viewtopic.php?p=10255979
	// I don't know whether it works or not...
	if (ctypes.size_t.size == 8) {
		var CallBackABI = ctypes.default_abi;
		var WinABI = ctypes.default_abi;
	} else {
		var CallBackABI = ctypes.stdcall_abi;
		var WinABI = ctypes.winapi_abi;
	}

	// MultiByteToWideChar
	var fnMultiByteToWideChar = kernel32.declare('MultiByteToWideChar',
			WinABI,
			ctypes.int32_t,
			ctypes.uint32_t, // code page
			ctypes.uint32_t, // flag
			ctypes.char.ptr, // 
			ctypes.int32_t,
			ctypes.jschar.ptr,
			ctypes.int32_t);



	// GlobalMemoryStatusEx
	var fnGlobalMemoryStatusEx = kernel32.declare('GlobalMemoryStatusEx',
			WinABI,
			ctypes.uint32_t,
			MEMORYSTATUSEX.ptr);

	// GetCurrentProcess
	var fnGetCurrentProcess = kernel32.declare('GetCurrentProcess',
			WinABI,
			ctypes.voidptr_t);
	var currentProcess = fnGetCurrentProcess();

	// GetProcessTimes
	var fnGetProcessTimes = kernel32.declare('GetProcessTimes',
			WinABI,
			ctypes.uint32_t,
			ctypes.voidptr_t,
			FILETIME.ptr,
			FILETIME.ptr,
			FILETIME.ptr,
			FILETIME.ptr);

	// GetSystemTimes
	var fnGetSystemTimes = kernel32.declare('GetSystemTimes',
			WinABI,
			ctypes.uint32_t,
			FILETIME.ptr,
			FILETIME.ptr,
			FILETIME.ptr);

	// GetSystemInfo
	var fnGetSystemInfo = kernel32.declare('GetSystemInfo',
			WinABI,
			ctypes.void_t,
			SYSTEM_INFO.ptr);
	var si = SYSTEM_INFO();
	fnGetSystemInfo(si.address());
	var cpuCount = si.dwNumberOfProcessors;

	// GetProcessMemoryInfo
	var fnGetProcessMemoryInfo = psapi.declare('GetProcessMemoryInfo',
			WinABI,
			ctypes.uint32_t,
			ctypes.voidptr_t,
			PROCESS_MEMORY_COUNTERS.ptr,
			ctypes.uint32_t);

	// GetIfTable
	var fnGetIfTable = iphlpapi.declare('GetIfTable',
			WinABI,
			ctypes.uint32_t,
			MIB_IFTABLE.ptr,
			ctypes.uint32_t.ptr,
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
				fxCpuUsage = getValueFromFileTime(fxKtNow) - getValueFromFileTime(fxKt) +
					getValueFromFileTime(fxUtNow) - getValueFromFileTime(fxUt);
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


	var sysFt = FILETIME();
	var sysFtNow = FILETIME();
	fnGetSystemTimes(sysFt.address(), ftdmy1.address(), ftdmy2.address());
	var sysTs = Date.now();
	var sysCpuUsage = 0;
	this.GetSysCpuUsage = function(sys_cpu_usage) {
		try {
			var ts = Date.now();
			if (ts - sysTs > 500) {
				fnGetSystemTimes(sysFtNow.address(), ftdmy1.address(), ftdmy2.address());
				sysCpuUsage = getValueFromFileTime(sysFtNow) - getValueFromFileTime(sysFt);
				sysCpuUsage /= 100;
				sysCpuUsage /= (ts - sysTs);
				sysCpuUsage = Math.floor(sysCpuUsage / cpuCount);

				if (sysCpuUsage > 100) {
					sysCpuUsage = 100;
				}
	
				sysTs = ts;
				sysFt.dwLowDateTime = sysFtNow.dwLowDateTime;
				sysFt.dwHighDateTime = sysFtNow.dwHighDateTime;
			}
	
			sys_cpu_usage.value = 100 - sysCpuUsage;
		} catch (e) {
			logger.logStringMessage('vvvvvvvvvv' + e + 'vvvvvvvvvv');
		}
	}


	////////////////////////////////////////////////
	// Ethernet

	/* below adapted from Ipifcons.h */
	const MIB_IF_TYPE_OTHER              = 1;
	const MIB_IF_TYPE_ETHERNET           = 6;
	const MIB_IF_TYPE_TOKENRING          = 9;
	const MIB_IF_TYPE_FDDI               = 15;
	const MIB_IF_TYPE_PPP                = 23;
	const MIB_IF_TYPE_LOOPBACK           = 24;
	const MIB_IF_TYPE_SLIP               = 28;
	const IF_TYPE_IEEE80211              = 71;

	const IF_OPER_STATUS_NON_OPERATIONAL = 0;
	const IF_OPER_STATUS_UNREACHABLE     = 1;
	const IF_OPER_STATUS_DISCONNECTED    = 2;
	const IF_OPER_STATUS_CONNECTING      = 3;
	const IF_OPER_STATUS_CONNECTED       = 4;
	const IF_OPER_STATUS_OPERATIONAL     = 5;


	var iftable = MIB_IFTABLE();
	iftable.dwNumEntries = 64;
	var numEntries = ctypes.uint32_t(64);

	var ethernetEntry = [];
	var ethernetTick = 0;
	this.GetEthernetCount = function() {
		updateEthernet();
		return ethernetEntry.length;
	}

	this.GetEthernetSpeed = function(index, in_speed, out_speed) {
		updateEthernet();
		if (index >= 0 && index < ethernetEntry.length) {
			var entry = ethernetEntry[index];
			in_speed.value = entry.in_speed;
			out_speed.value = entry.out_speed;
		}
	}

	this.GetEthernetName = function(index, name) {
		updateEthernet();
		if (index >= 0 && index < ethernetEntry.length) {
			name.value = ethernetEntry[index].name;
		}
	}

	var ethernetUpdateTime = 0;
	function updateEthernet() {
		var updateTime = Date.now();
		if (updateTime - ethernetUpdateTime < 500) {
			return;
		} else{
			ethernetUpdateTime = updateTime;
		}

		fnGetIfTable(iftable.address(), numEntries.address(), 1);
		var count = 0;
		for (var i = 0; i < iftable.dwNumEntries; ++ i) {
			var row = iftable.table[i];
			if (filterRow(row)) {
				++ count;
			}
		}

		// reset entries
		if (count != ethernetEntry.length) {
			ethernetEntry = [];
			ethernetTick = 0;
			for (var i = 0; i < count; ++ i) {
				ethernetEntry.push(
					{
						in_octets: 0,
						out_octets: 0,
						in_speed: 0,
						out_speed: 0
					});
			}
		}

		count = 0;
		var tick = updateTime;
		var t = tick - ethernetTick;
		if (t <= 0) {
			t = 1;
		}
		for (var i = 0, j = 0; i < iftable.dwNumEntries; ++ i) {
			var row = iftable.table[i];
			if (!filterRow(row)) {
				continue;
			}

			var entry = ethernetEntry[j];
			if (ethernetTick > 0) {
				entry.in_speed = Math.floor((row.dwInOctets - entry.in_octets) * 1000 / t);
				entry.out_speed = Math.floor((row.dwOutOctets - entry.out_octets) * 1000 / t);
			}

			entry.in_octets = row.dwInOctets;
			entry.out_octets = row.dwOutOctets;
			if (entry.name === undefined) {
				entry.name = '';
				let n = row.dwDescrLen;
				if (n > 1) {
					-- n;
				}
				if (n > 0) {
					let bDesc = new ctypes.ArrayType(ctypes.char)(n);
					for (let k = 0; k < n; ++ k) {
						bDesc[k] = row.bDescr[k];
					}
					let Name = new ctypes.ArrayType(ctypes.jschar)(n * 2);
					let len = fnMultiByteToWideChar(0, 0, bDesc, n, Name, n * 2);
					for (let k = 0; k < len; ++ k) {
						entry.name += Name[k];
					}
				}
			}

			++ j;
			if (j == count) {
				break;
			}
		}
		ethernetTick = tick;
	}


	function filterRow (row) {
		var dwType = row.dwType;
		var dwOperStatus = row.dwOperStatus;
		return ((dwType == MIB_IF_TYPE_ETHERNET || dwType == MIB_IF_TYPE_PPP || dwType == MIB_IF_TYPE_FDDI || dwType == IF_TYPE_IEEE80211) &&
			(dwOperStatus == IF_OPER_STATUS_OPERATIONAL || dwOperStatus == IF_OPER_STATUS_CONNECTED) &&
			(row.dwInOctets > 0 && row.dwOutOctets > 0));
	}


} catch (e) {
	logger.logStringMessage('***********' + e + '**********');
}

	function getValueFromFileTime(ft) {
		var value = ctypes.UInt64.join(ft.dwHighDateTime, ft.dwLowDateTime);
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



