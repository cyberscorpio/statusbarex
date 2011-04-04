#include "stdafx.h"
#include <assert.h>

#ifdef _MSC_VER
// #pragma comment (lib, "Psapi.lib")
#endif

#include "xpcom-config.h"
#define MOZILLA_STRICT_API

#include "nsCOMPtr.h"
#include "nsIModule.h"
#include "nsIFactory.h"
#include "mozilla/ModuleUtils.h"
#include "nsIClassInfoImpl.h"
#include "nsIComponentManager.h"
#include "nsIComponentRegistrar.h"
#include "nsIServiceManager.h"
#include "nsICategoryManager.h"
#include "nsMemory.h"
#include "nsStringAPI.h"

#include "IStatusbarExCore.h"
#include "sys_query.h"


static const char *s_szClassName = "StatusbarExCore";
static const char *s_szContractID = "@doudehou/statusbarEx;1";

// the CID
// {9C876432-4901-4a41-ACB4-20D3550E5655}
#define STATUSBAREXCORE_CID \
{ 0x9c876432, 0x4901, 0x4a41, \
{ 0xac, 0xb4, 0x20, 0xd3, 0x55, 0xe, 0x56, 0x55 } }





//////////////////////////////////////////////////////////////////////////
class StatusbarExCore : public IStatusbarExCore
{
public:
	NS_DECL_ISUPPORTS
	NS_DECL_ISTATUSBAREXCORE

	StatusbarExCore();

private:
	virtual ~StatusbarExCore();

protected:
	/* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(StatusbarExCore, IStatusbarExCore)

StatusbarExCore::StatusbarExCore () {
	/* member initializers and constructor code */
	// ::MessageBoxA(NULL, "I'm created!", "SBEX", MB_OK);
}

StatusbarExCore::~StatusbarExCore () {
	/* destructor code */
}

/* void GetMemoryStatus (out long total_memory, out long free_memory); */
NS_IMETHODIMP StatusbarExCore::GetMemoryStatus (
                                                PRInt32 *total_memory NS_OUTPARAM,
                                                PRInt32 *free_memory NS_OUTPARAM
                                               ) {
	assert (total_memory);
	assert (free_memory);

	sys_info_query *eq = sys_info_query::get_instance();
	eq->get_global_memory_status(total_memory, free_memory);

	return NS_OK;
}


/* void GetFxMemory (out long memory_usage); */
NS_IMETHODIMP StatusbarExCore::GetFxMemory (
                                            PRInt32 *usage NS_OUTPARAM,
                                            PRInt32 *vm_size NS_OUTPARAM
                                           ) {
	assert (usage && vm_size);

	sys_info_query *eq = sys_info_query::get_instance();
	eq->get_fx_memory(usage, vm_size);

	return NS_OK;
}


/* void GetFxCpuUsage (out long cpu_usage); */
NS_IMETHODIMP StatusbarExCore::GetFxCpuUsage (PRInt32 *cpu_usage NS_OUTPARAM) {
	assert (cpu_usage);

	sys_info_query *eq = sys_info_query::get_instance();
	*cpu_usage = eq->get_fx_cpu_usage();
	return NS_OK;
}

/* void GetSysCpuUsage (out long sys_cpu_usage); */
NS_IMETHODIMP StatusbarExCore::GetSysCpuUsage(PRInt32 *sys_cpu_usage NS_OUTPARAM) {
	assert (sys_cpu_usage);

	sys_info_query *eq = sys_info_query::get_instance();
	*sys_cpu_usage = eq->get_sys_cpu_usage();
	return NS_OK;
}


/* long GetEthernetCount (); */
NS_IMETHODIMP StatusbarExCore::GetEthernetCount (PRInt32 *_retval NS_OUTPARAM) {
	assert (_retval);

	sys_info_query *eq = sys_info_query::get_instance();
	*_retval = eq->get_ethernet_count();
	return NS_OK;
}

/* void GetEthernetSpeed (in long index, out long in_speed, out long out_speed); */
NS_IMETHODIMP StatusbarExCore::GetEthernetSpeed (
                                                 PRInt32 index,
                                                 PRInt32 *in_speed NS_OUTPARAM, 
                                                 PRInt32 *out_speed NS_OUTPARAM
                                                ) {
	sys_info_query *eq = sys_info_query::get_instance();
	*in_speed = eq->get_in_speed(index);
	*out_speed = eq->get_out_speed(index);
	return NS_OK;
}

/* void GetEthernetName (in long index, out DOMString name); */
NS_IMETHODIMP StatusbarExCore::GetEthernetName (PRInt32 index, nsAString &name NS_OUTPARAM) {
	sys_info_query *eq = sys_info_query::get_instance();
	std::wstring std_name;
	eq->get_ethernet_name(index, std_name);
	NS_StringSetData(name, std_name.c_str());
	return NS_OK;
}



NS_IMETHODIMP StatusbarExCore::GetPowerStatus(
                                              PRInt32 *ACLineStatus NS_OUTPARAM,
                                              PRInt32 *BatteryFlag NS_OUTPARAM,
                                              PRInt32 *BatteryLifePercent NS_OUTPARAM,
                                              PRInt32 *BatteryLifeTime NS_OUTPARAM,
                                              PRInt32 *hour NS_OUTPARAM,
                                              PRInt32 *minute NS_OUTPARAM,
                                              PRInt32 *second NS_OUTPARAM
                                             ) {
	SYSTEM_POWER_STATUS sps;
	memset(&sps, 0, sizeof(sps));
	if (!GetSystemPowerStatus(&sps))
		return NS_ERROR_FAILURE;
	// GetSystemPowerStatus(&sps);

	if (ACLineStatus)
		*ACLineStatus = sps.ACLineStatus;
	if (BatteryFlag)
		*BatteryFlag = sps.BatteryFlag;
	if (BatteryLifePercent)
		*BatteryLifePercent = sps.BatteryLifePercent;
	if (BatteryLifeTime)
		*BatteryLifeTime = sps.BatteryLifeTime;

	DWORD dw = sps.BatteryLifeTime;
	if (dw == (DWORD) -1)
		dw = 0;
	if (hour)
		*hour = dw / 3600;
	if (minute)
		*minute = (dw % 3600) / 60;
	if (second)
		*second = (dw % 60);

	return NS_OK;
}




//////////////////////////////////////////////////////////////////////////
// the factory

NS_GENERIC_FACTORY_CONSTRUCTOR(StatusbarExCore)
NS_DEFINE_NAMED_CID(STATUSBAREXCORE_CID);
static const mozilla::Module::CIDEntry kSbExCoreCIDs[] = {
	{ &kSTATUSBAREXCORE_CID, false, NULL, StatusbarExCoreConstructor },
	{ NULL }
};
static const mozilla::Module::ContractIDEntry kSbExCoreContracts[] = {
	{ s_szContractID, &kSTATUSBAREXCORE_CID },
	{ NULL }
};
static const mozilla::Module::CategoryEntry kSbExCoreCategories[] = {
	{ "my-category", "my-key", s_szContractID },
	{ NULL }
};
static const mozilla::Module kSbExCoreModule = {
	mozilla::Module::kVersion,
	kSbExCoreCIDs,
	kSbExCoreContracts,
	kSbExCoreCategories
};
NSMODULE_DEFN(IStatusbarExCore) = &kSbExCoreModule;
NS_IMPL_MOZILLA192_NSGETMODULE(&kSbExCoreModule)


/*
static NS_METHOD StatusbarExCoreRegistration(nsIComponentManager *aCompMgr,
					     nsIFile *aPath,
					     const char *registryLocation,
					     const char *componentType,
					     const nsModuleComponentInfo *info);
static NS_METHOD StatusbarExCoreUnregistration(nsIComponentManager *aCompMgr,
					       nsIFile *aPath,
					       const char *registryLocation,
					       const nsModuleComponentInfo *info);



static const nsModuleComponentInfo s_arComponents[] =
{
	{
		s_szClassName,
		STATUSBAREXCORE_CID,
		s_szContractID,
		StatusbarExCoreConstructor,
		StatusbarExCoreRegistration,
		StatusbarExCoreUnregistration
	},
};


NS_IMPL_NSGETMODULE(StatusbarExCoreModule, s_arComponents)



static NS_METHOD StatusbarExCoreRegistration(nsIComponentManager *aCompMgr,
					nsIFile *aPath,
					const char *registryLocation,
					const char *componentType,
					const nsModuleComponentInfo *info)
{
	nsresult rv;

	nsCOMPtr<nsIServiceManager> servman =
		do_QueryInterface((nsISupports*)aCompMgr, &rv);

	if (NS_FAILED(rv))
		return rv;

	nsCOMPtr<nsICategoryManager> catman;
	servman->GetServiceByContractID(NS_CATEGORYMANAGER_CONTRACTID,
		NS_GET_IID(nsICategoryManager),
		getter_AddRefs(catman));

	if (NS_FAILED(rv))
		return rv;


	char* previous = nsnull;
	rv = catman->AddCategoryEntry("xpcom-startup",
		s_szClassName,
		s_szContractID,
		PR_TRUE,
		PR_TRUE,
		&previous);
	if (previous)
		nsMemory::Free(previous);
	return rv;
}

static NS_METHOD StatusbarExCoreUnregistration(nsIComponentManager *aCompMgr,
					  nsIFile *aPath,
					  const char *registryLocation,
					  const nsModuleComponentInfo *info)
{
	nsresult rv;

	nsCOMPtr<nsIServiceManager> servman =
		do_QueryInterface((nsISupports*)aCompMgr, &rv);
	if (NS_FAILED(rv))
		return rv;

	nsCOMPtr<nsICategoryManager> catman;
	servman->GetServiceByContractID(NS_CATEGORYMANAGER_CONTRACTID,
		NS_GET_IID(nsICategoryManager),
		getter_AddRefs(catman));
	if (NS_FAILED(rv))
		return rv;

	rv = catman->DeleteCategoryEntry("xpcom-startup",
		s_szClassName,
		PR_TRUE);
	return rv;
}
*/
