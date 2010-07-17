
#include "stdafx.h"
#include "sys_query.h"
#include <windows.h>
#include <process.h>
#include <stdio.h>
#include <assert.h>


#ifdef _MSC_VER
// #pragma comment (lib, "Iphlpapi.lib")
// #pragma comment (lib, "Psapi.lib")
#endif


//////////////////////////////////////////////////////////////////////////
// helper function

class sys_info_query_holder {
	friend class sys_info_query;

	sys_info_query m_holder;

	sys_info_query_holder (){}

public:
	~sys_info_query_holder (){}
};

//////////////////////////////////////////////////////////////////////////

// static CRITICAL_SECTION s_cs;
// #define LOCK()		EnterCriticalSection(&s_cs)
// #define UNLOCK()	LeaveCriticalSection(&s_cs)


//////////////////////////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////////////////


typedef DWORD speed_type;
struct t_if_record {
//	DWORD time_stamp;
	DWORD in_octets;
	DWORD out_octets;

	speed_type in_speed;
	speed_type out_speed;
	// std::wstring name;
	wchar_t name[MAXLEN_IFDESCR];
};

/**
 * !!! I use a PPPOE connection, and I found that
 * the dwOutOctets doesn't change on the ETHERNET,
 * so I must check the PPP connection....
 */
inline static bool _row_filter (PMIB_IFROW row) {
	DWORD dwType = row->dwType;
	DWORD dwOperStatus = row->dwOperStatus;
	return ((dwType == MIB_IF_TYPE_ETHERNET || dwType == MIB_IF_TYPE_PPP || dwType == MIB_IF_TYPE_FDDI || dwType == IF_TYPE_IEEE80211) &&
		(dwOperStatus == MIB_IF_OPER_STATUS_OPERATIONAL || dwOperStatus == MIB_IF_OPER_STATUS_CONNECTED) &&
		(row->dwInOctets > 0 && row->dwOutOctets > 0));
}

const int MAX_INTERFACE_COUNT = 32;
class ethernet_info {
	// bool m_first_run;
	DWORD m_tick;
	DWORD m_current_count;
	t_if_record m_records[MAX_INTERFACE_COUNT];

public:
	ethernet_info () : m_tick(0) // m_first_run(true)
	                 , m_current_count(0)
	{
		memset (m_records, 0, sizeof(m_records));
	}

	int get_count () const {
		return m_current_count;
	}

	speed_type get_in_speed (int index) const {
		if (index >= MAX_INTERFACE_COUNT) {
			return 0;
		}
		return m_records[index].in_speed;
	}

	speed_type get_out_speed (int index) const {
		if (index >= MAX_INTERFACE_COUNT) {
			return 0;
		}
		return m_records[index].out_speed;
	}

	void get_name (int index, std::wstring &name) const {
		if (index >= MAX_INTERFACE_COUNT) {
			return;
		}
		name = m_records[index].name;
	}


	void update (PMIB_IFTABLE tbl) {
		DWORD tick = GetTickCount();
		if ((tick < m_tick)) {
			reset();
		}

		DWORD count = 0;
		DWORD dw;
		for (dw = 0; dw < tbl->dwNumEntries; ++ dw) {
			PMIB_IFROW row = tbl->table + dw;
			if (_row_filter(row))
				++ count;
		}
		if (count != m_current_count) {
			reset();
		}

		m_current_count = count;
		if (m_current_count > MAX_INTERFACE_COUNT) {
			m_current_count = MAX_INTERFACE_COUNT;
		}

#ifdef _DEBUG
		char buf[1024] = {0};
		char temp[256] = {0};
#endif
		count = 0;
		for (dw = 0; dw < tbl->dwNumEntries; ++ dw) {
			PMIB_IFROW row = tbl->table + dw;
#ifdef _DEBUG
			sprintf (temp, "eth%d (out:%d - in:%d - type:%d - status:%d - OutUcastPkts:%d - OutNUcastPkts:%d)  ", 
				dw, row->dwOutOctets, row->dwInOctets, row->dwType, row->dwOperStatus, row->dwOutUcastPkts, row->dwOutNUcastPkts);
			strcat(buf, temp);
#endif
			if (!_row_filter(row)) {
				continue;
			}

			t_if_record* record = m_records + count;
			++ count;
			if (count == MAX_INTERFACE_COUNT) {
				break;
			}

			if (m_tick > 0) {
				DWORD t = tick - m_tick;
				if (t == 0) {
					t = 1;
				}
#if 0
				record->in_speed = (row->dwInOctets - record->in_octets) * 1000 / (1024 * t);
				record->out_speed = (row->dwOutOctets - record->out_octets) * 1000 / (1024 * t);
#else
				record->in_speed = (row->dwInOctets - record->in_octets) * 1000 / t;
				record->out_speed = (row->dwOutOctets - record->out_octets) * 1000 / t;
#endif
			}

			record->in_octets = row->dwInOctets;
			record->out_octets = row->dwOutOctets;
			// record->name = row->wszName;
			// wcsncpy(record->name, row->wszName, MAXLEN_IFDESCR);
			MultiByteToWideChar(CP_ACP, MB_PRECOMPOSED, (LPCSTR)row->bDescr, row->dwDescrLen, record->name, MAXLEN_IFDESCR);
		}

#ifdef _DEBUG
		strcat(buf, "\n");
		OutputDebugStringA(buf);
#endif

		m_tick = tick;
	}

	void reset () {
		// m_first_run = true;
		m_tick = 0;
		m_current_count = 0;
		memset (m_records, 0, sizeof(m_records));
	}
};


//////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////


#define GET_INT64_FROM_FILETIME(i64, ft) do {\
	i64 = ft.dwHighDateTime;\
	i64 <<= 32;\
	i64 |= ft.dwLowDateTime;\
} while(0)

class cpu_usage_base {
protected:
	int m_cpu_usage;
	DWORD m_cpu_count;
	FILETIME m_kernel_time;
	FILETIME m_user_time;
	DWORD m_record_tick;

	virtual bool get_kernel_and_user_time (FILETIME *k, FILETIME *u) = 0;
public:
	cpu_usage_base () {
		memset(&m_kernel_time, 0, sizeof(m_kernel_time));
		memset(&m_user_time, 0, sizeof(m_user_time));
		m_record_tick = 0;
		m_cpu_count = 1;

		SYSTEM_INFO si;
		::GetSystemInfo(&si);
		m_cpu_count = si.dwNumberOfProcessors;
	}

	void update ();

	int get_cpu_usage () {
		return m_cpu_usage;
	}
};

void cpu_usage_base::update () {
	if (m_record_tick == 0) {
		// first run, skip this round
		get_kernel_and_user_time(&m_kernel_time, &m_user_time);
		m_record_tick = GetTickCount();
	} else {
		FILETIME kernel_time, user_time;
		if (get_kernel_and_user_time(&kernel_time, &user_time)) {
			__int64 k, k_now;
			GET_INT64_FROM_FILETIME(k, m_kernel_time);
			GET_INT64_FROM_FILETIME(k_now, kernel_time);
			__int64 u, u_now;
			GET_INT64_FROM_FILETIME(u, m_user_time);
			GET_INT64_FROM_FILETIME(u_now, user_time);

			k = (k_now - k) / 100;
			u = (u_now - u) / 100;

			DWORD tick_now = GetTickCount();
			m_cpu_usage = ((int)(k + u)) / (tick_now - m_record_tick);
			m_cpu_usage /= m_cpu_count;
			if (m_cpu_usage > 100) {
				m_cpu_usage = 100;
			}

			m_record_tick = tick_now;
			m_kernel_time = kernel_time;
			m_user_time = user_time;
		} else {
			m_cpu_usage = 0;
		}
	}
}

class self_cpu_usage : public cpu_usage_base {
protected:
	virtual bool get_kernel_and_user_time (FILETIME *kernel_time, FILETIME *user_time) {
		FILETIME f1, f2;
		return ::GetProcessTimes(GetCurrentProcess(), &f1, &f2, kernel_time, user_time) == TRUE;
	}
};

class sys_cpu_usage : public cpu_usage_base {
protected:
	virtual bool get_kernel_and_user_time (FILETIME *kernel_time, FILETIME *user_time) {
		FILETIME k, u;
		// return ::GetSystemTimes(&idle, kernel_time, user_time) == TRUE;
		return ::GetSystemTimes(kernel_time, &k, &u) == TRUE;
	}
public:
	int get_cpu_usage () {
		return 100 - m_cpu_usage;
	}
};


//////////////////////////////////////////////////////////////////////////

static ethernet_info s_ei;
static self_cpu_usage s_scu;
static sys_cpu_usage s_syscu;


sys_info_query::sys_info_query (void)
	: m_hIphlpapi (NULL)
	, m_hPsapi (NULL)
	, m_hKernel32 (NULL)
	, m_pfnGetIfTable (NULL)
	, m_pfnGetProcessMemoryInfo (NULL)
	, m_pfnGlobalMemoryStatusEx (NULL)
{
#ifdef _DEBUG
	// __asm int 3;
#endif
	// InitializeCriticalSection(&s_cs);

	// load the DLLs
	m_hIphlpapi = ::LoadLibrary(TEXT("Iphlpapi.dll"));
	m_hPsapi = ::LoadLibrary(TEXT("Psapi.dll"));
	m_hKernel32 = ::LoadLibrary(TEXT("Kernel32.dll"));
	if (m_hIphlpapi) {
		m_pfnGetIfTable = (PTR_GetIfTable)GetProcAddress(m_hIphlpapi, "GetIfTable");
	}
	if (m_hPsapi) {
		m_pfnGetProcessMemoryInfo = (PTR_GetProcessMemoryInfo)GetProcAddress(m_hPsapi, "GetProcessMemoryInfo");
	}
	if (m_hKernel32) {
		m_pfnGlobalMemoryStatusEx = (PTR_GlobalMemoryStatusEx)GetProcAddress(m_hKernel32, "GlobalMemoryStatusEx");
	}

	_beginthreadex(NULL, 0, update_thread, this, 0, NULL);
}

sys_info_query::~sys_info_query (void) {
	if (m_hIphlpapi) {
		FreeLibrary(m_hIphlpapi);
	}

	if (m_hPsapi) {
		FreeLibrary(m_hPsapi);
	}
}


sys_info_query* sys_info_query::get_instance () {
	static sys_info_query_holder nqh;
	return &(nqh.m_holder);
}


int sys_info_query::get_ethernet_count () const {
	//LOCK();
	return s_ei.get_count();
	//UNLOCK();
}

int sys_info_query::get_in_speed (int index) const {
	//LOCK();
	return s_ei.get_in_speed(index);
	//UNLOCK();
}

int sys_info_query::get_out_speed (int index) const {
	//LOCK();
	return s_ei.get_out_speed(index);
	//UNLOCK();
}

void sys_info_query::get_ethernet_name (int index, std::wstring &name) const {
	s_ei.get_name(index, name);
	return;
}


void sys_info_query::get_fx_memory (int *usage, int *vm_size) {
	assert (usage && vm_size);
	*usage = 0;
	*vm_size = 0;

	if (m_pfnGetProcessMemoryInfo) 	{
		PROCESS_MEMORY_COUNTERS pmc;
		pmc.cb = sizeof(pmc);
		if ((*m_pfnGetProcessMemoryInfo)(GetCurrentProcess(), &pmc, sizeof(pmc))) {
			*usage = (int)(pmc.WorkingSetSize / (1024 * 1024));
			*vm_size = (int)(pmc.PagefileUsage / (1024 * 1024));
		}
	}
}

int sys_info_query::get_fx_cpu_usage () {
	return s_scu.get_cpu_usage();
}

int sys_info_query::get_sys_cpu_usage () {
	return s_syscu.get_cpu_usage();
}


void sys_info_query::get_global_memory_status (int *total_memory, int *free_memory) {
	MEMORYSTATUSEX ms;
	ms.dwLength = sizeof(ms);
	if (m_pfnGlobalMemoryStatusEx) {
		(*m_pfnGlobalMemoryStatusEx)(&ms);
		
		*total_memory = (int)(ms.ullTotalPhys / (1024 * 1024));
		*free_memory = (int)(ms.ullAvailPhys / (1024 * 1024));
	} else {
		*total_memory = -1;
		*free_memory = -1;
	}
}




//////////////////////////////////////////////////////////////////////////

unsigned __stdcall sys_info_query::update_thread (void* pArg) {
	PMIB_IFTABLE pIfTable = NULL;
	ULONG ulTableLen = 0;

	sys_info_query *pThis = (sys_info_query *)pArg;
	assert (pThis);

	for (;;) {
		// Update the network speed
		if (pThis->m_pfnGetIfTable) {
			DWORD result = (*(pThis->m_pfnGetIfTable))(pIfTable, &ulTableLen, TRUE);
			if (result == ERROR_INSUFFICIENT_BUFFER) {
				if (pIfTable != NULL) {
					delete []pIfTable;
					pIfTable = NULL;
				}

				pIfTable = (PMIB_IFTABLE) new char[ulTableLen];
				result = (*(pThis->m_pfnGetIfTable))(pIfTable, &ulTableLen, TRUE);
			}
			if (result == ERROR_SUCCESS) {
				s_ei.update(pIfTable);
			} else {
				s_ei.reset();
			}
		}

		// update CPU usage
		s_scu.update();
		s_syscu.update();

		Sleep(1000);
	}

	// _endthreadex( 0 );
	return 0;
} 

