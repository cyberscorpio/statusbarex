
#ifdef _MSC_VER
#pragma once
#endif
#include <windows.h>
#include <string>
//////////////////////////////////////////////////////////////////////////
#if (_MSC_VER > 1200)

#include <Iphlpapi.h>
#include <psapi.h>

#else /* make it compilable in VC 6.0 */

#ifndef MAXLEN_IFDESCR
#define MAXLEN_IFDESCR 256
#endif
#ifndef MAXLEN_PHYSADDR
#define MAXLEN_PHYSADDR 8
#endif
#ifndef MAX_INTERFACE_NAME_LEN
#define MAX_INTERFACE_NAME_LEN  256
#endif

#ifndef ANY_SIZE
#define ANY_SIZE 1
#endif

typedef struct _MIB_IFROW
{
    WCHAR   wszName[MAX_INTERFACE_NAME_LEN];
    DWORD    dwIndex;
    DWORD    dwType;
    DWORD    dwMtu;
    DWORD    dwSpeed;
    DWORD    dwPhysAddrLen;
    BYTE    bPhysAddr[MAXLEN_PHYSADDR];
    DWORD    dwAdminStatus;
    DWORD    dwOperStatus;
    DWORD    dwLastChange;
    DWORD    dwInOctets;
    DWORD    dwInUcastPkts;
    DWORD    dwInNUcastPkts;
    DWORD    dwInDiscards;
    DWORD    dwInErrors;
    DWORD    dwInUnknownProtos;
    DWORD    dwOutOctets;
    DWORD    dwOutUcastPkts;
    DWORD    dwOutNUcastPkts;
    DWORD    dwOutDiscards;
    DWORD    dwOutErrors;
    DWORD    dwOutQLen;
    DWORD    dwDescrLen;
    BYTE    bDescr[MAXLEN_IFDESCR];
} MIB_IFROW,*PMIB_IFROW;

typedef struct _MIB_IFTABLE
{
    DWORD     dwNumEntries;
    MIB_IFROW table[ANY_SIZE];
} MIB_IFTABLE, *PMIB_IFTABLE;

// #define SIZEOF_IFTABLE(X) (FIELD_OFFSET(MIB_IFTABLE,table[0]) + ((X) * sizeof(MIB_IFROW)) + ALIGN_SIZE)

#define MIB_IF_TYPE_OTHER               1
#define MIB_IF_TYPE_ETHERNET            6
#define MIB_IF_TYPE_TOKENRING           9
#define MIB_IF_TYPE_FDDI                15
#define MIB_IF_TYPE_PPP                 23
#define MIB_IF_TYPE_LOOPBACK            24
#define MIB_IF_TYPE_SLIP                28

#define MIB_IF_ADMIN_STATUS_UP          1
#define MIB_IF_ADMIN_STATUS_DOWN        2
#define MIB_IF_ADMIN_STATUS_TESTING     3

#define MIB_IF_OPER_STATUS_NON_OPERATIONAL      0
#define MIB_IF_OPER_STATUS_UNREACHABLE          1
#define MIB_IF_OPER_STATUS_DISCONNECTED         2
#define MIB_IF_OPER_STATUS_CONNECTING           3
#define MIB_IF_OPER_STATUS_CONNECTED            4
#define MIB_IF_OPER_STATUS_OPERATIONAL          5


typedef struct _PROCESS_MEMORY_COUNTERS {
	DWORD cb;
	DWORD PageFaultCount;
	DWORD PeakWorkingSetSize;
	DWORD WorkingSetSize;
	DWORD QuotaPeakPagedPoolUsage;
	DWORD QuotaPagedPoolUsage;
	DWORD QuotaPeakNonPagedPoolUsage;
	DWORD QuotaNonPagedPoolUsage;
	DWORD PagefileUsage;
	DWORD PeakPagefileUsage;
} PROCESS_MEMORY_COUNTERS,*PPROCESS_MEMORY_COUNTERS;


typedef struct _MEMORYSTATUSEX {
    DWORD dwLength; 
    DWORD dwMemoryLoad; 
    DWORDLONG ullTotalPhys; 
    DWORDLONG ullAvailPhys; 
    DWORDLONG ullTotalPageFile; 
    DWORDLONG ullAvailPageFile; 
    DWORDLONG ullTotalVirtual; 
    DWORDLONG ullAvailVirtual; 
    DWORDLONG ullAvailExtendedVirtual;
} MEMORYSTATUSEX, *LPMEMORYSTATUSEX; 



#endif
//////////////////////////////////////////////////////////////////////////



//////////////////////////////////////////////////////////////////////////
typedef DWORD (WINAPI * PTR_GetIfTable)(PMIB_IFTABLE, PULONG, BOOL);
typedef BOOL (WINAPI * PTR_GetProcessMemoryInfo)(
				HANDLE,
				PPROCESS_MEMORY_COUNTERS,
				DWORD
				);
typedef BOOL (WINAPI * PTR_GlobalMemoryStatusEx)(
						  LPMEMORYSTATUSEX
				);



//////////////////////////////////////////////////////////////////////////
class sys_info_query_holder;

class sys_info_query
{
	friend class sys_info_query_holder;

	sys_info_query(void);
	~sys_info_query(void);

	HMODULE m_hIphlpapi;
	HMODULE m_hPsapi;
	HMODULE m_hKernel32;
	PTR_GetIfTable m_pfnGetIfTable;
	PTR_GetProcessMemoryInfo m_pfnGetProcessMemoryInfo;
	PTR_GlobalMemoryStatusEx m_pfnGlobalMemoryStatusEx;

	static unsigned __stdcall update_thread(void*);

public:
	static sys_info_query* get_instance();

	int get_ethernet_count() const;
	int get_in_speed(int index) const;
	int get_out_speed(int index) const;
	void get_ethernet_name(int index, std::wstring &name) const;

	void get_fx_memory(int *usage, int *vm_size);
	int get_fx_cpu_usage();

	void get_global_memory_status(int *total_memory, int *free_memory);
};



