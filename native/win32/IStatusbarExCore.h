/*
 * DO NOT EDIT.  THIS FILE IS GENERATED FROM IStatusbarExCore.idl
 */

#ifndef __gen_IStatusbarExCore_h__
#define __gen_IStatusbarExCore_h__


#ifndef __gen_nsISupports_h__
#include "nsISupports.h"
#endif

/* For IDL files that don't want to include root IDL files. */
#ifndef NS_NO_VTABLE
#define NS_NO_VTABLE
#endif

/* starting interface:    IStatusbarExCore */
#define ISTATUSBAREXCORE_IID_STR "490b7862-b2e9-4b25-9171-0c9e8bfbbfc1"

#define ISTATUSBAREXCORE_IID \
  {0x490b7862, 0xb2e9, 0x4b25, \
    { 0x91, 0x71, 0x0c, 0x9e, 0x8b, 0xfb, 0xbf, 0xc1 }}

/**

// {490B7862-B2E9-4b25-9171-0C9E8BFBBFC1}
static const GUID <<name>> = 
{ 0x490b7862, 0xb2e9, 0x4b25, 
{ 0x91, 0x71, 0xc, 0x9e, 0x8b, 0xfb, 0xbf, 0xc1 } };

**/
class NS_NO_VTABLE NS_SCRIPTABLE IStatusbarExCore : public nsISupports {
 public: 

  NS_DECLARE_STATIC_IID_ACCESSOR(ISTATUSBAREXCORE_IID)

  /* void GetMemoryStatus (out long total_memory, out long free_memory); */
  NS_SCRIPTABLE NS_IMETHOD GetMemoryStatus(PRInt32 *total_memory NS_OUTPARAM, PRInt32 *free_memory NS_OUTPARAM) = 0;

  /* void GetFxMemory (out long usage, out long vm_size); */
  NS_SCRIPTABLE NS_IMETHOD GetFxMemory(PRInt32 *usage NS_OUTPARAM, PRInt32 *vm_size NS_OUTPARAM) = 0;

  /* void GetFxCpuUsage (out long cpu_usage); */
  NS_SCRIPTABLE NS_IMETHOD GetFxCpuUsage(PRInt32 *cpu_usage NS_OUTPARAM) = 0;

  /* long GetEthernetCount (); */
  NS_SCRIPTABLE NS_IMETHOD GetEthernetCount(PRInt32 *_retval NS_OUTPARAM) = 0;

  /* void GetEthernetSpeed (in long index, out long in_speed, out long out_speed); */
  NS_SCRIPTABLE NS_IMETHOD GetEthernetSpeed(PRInt32 index, PRInt32 *in_speed NS_OUTPARAM, PRInt32 *out_speed NS_OUTPARAM) = 0;

  /* void GetEthernetName (in long index, out DOMString name); */
  NS_SCRIPTABLE NS_IMETHOD GetEthernetName(PRInt32 index, nsAString & name NS_OUTPARAM) = 0;

  /**
	 * @ACLineStatus:
	 *  - 0: offline
	 *  - 1: online
	 *  - 255: unknown
	 * @BatteryFlag: 
	 *  - 1:High/2:Low/4:Critical
	 *  - 8:Charging
	 *  - 128:No system battery
	 *  - 255:Unknown
	 * @BatteryLifePercent:
	 *  - 0-100: percent remaining
	 *  - 255: unknown
	 * @BatteryLifeTime:
	 * - In second time remaining
	 * - -1 unknown
	 **/
  /* void GetPowerStatus (out long ACLineStatus, out long BatteryFlag, out long BatteryLifePercent, out long BatteryLifeTime, out long hour, out long minute, out long second); */
  NS_SCRIPTABLE NS_IMETHOD GetPowerStatus(PRInt32 *ACLineStatus NS_OUTPARAM, PRInt32 *BatteryFlag NS_OUTPARAM, PRInt32 *BatteryLifePercent NS_OUTPARAM, PRInt32 *BatteryLifeTime NS_OUTPARAM, PRInt32 *hour NS_OUTPARAM, PRInt32 *minute NS_OUTPARAM, PRInt32 *second NS_OUTPARAM) = 0;

};

  NS_DEFINE_STATIC_IID_ACCESSOR(IStatusbarExCore, ISTATUSBAREXCORE_IID)

/* Use this macro when declaring classes that implement this interface. */
#define NS_DECL_ISTATUSBAREXCORE \
  NS_SCRIPTABLE NS_IMETHOD GetMemoryStatus(PRInt32 *total_memory NS_OUTPARAM, PRInt32 *free_memory NS_OUTPARAM); \
  NS_SCRIPTABLE NS_IMETHOD GetFxMemory(PRInt32 *usage NS_OUTPARAM, PRInt32 *vm_size NS_OUTPARAM); \
  NS_SCRIPTABLE NS_IMETHOD GetFxCpuUsage(PRInt32 *cpu_usage NS_OUTPARAM); \
  NS_SCRIPTABLE NS_IMETHOD GetEthernetCount(PRInt32 *_retval NS_OUTPARAM); \
  NS_SCRIPTABLE NS_IMETHOD GetEthernetSpeed(PRInt32 index, PRInt32 *in_speed NS_OUTPARAM, PRInt32 *out_speed NS_OUTPARAM); \
  NS_SCRIPTABLE NS_IMETHOD GetEthernetName(PRInt32 index, nsAString & name NS_OUTPARAM); \
  NS_SCRIPTABLE NS_IMETHOD GetPowerStatus(PRInt32 *ACLineStatus NS_OUTPARAM, PRInt32 *BatteryFlag NS_OUTPARAM, PRInt32 *BatteryLifePercent NS_OUTPARAM, PRInt32 *BatteryLifeTime NS_OUTPARAM, PRInt32 *hour NS_OUTPARAM, PRInt32 *minute NS_OUTPARAM, PRInt32 *second NS_OUTPARAM); 

/* Use this macro to declare functions that forward the behavior of this interface to another object. */
#define NS_FORWARD_ISTATUSBAREXCORE(_to) \
  NS_SCRIPTABLE NS_IMETHOD GetMemoryStatus(PRInt32 *total_memory NS_OUTPARAM, PRInt32 *free_memory NS_OUTPARAM) { return _to GetMemoryStatus(total_memory, free_memory); } \
  NS_SCRIPTABLE NS_IMETHOD GetFxMemory(PRInt32 *usage NS_OUTPARAM, PRInt32 *vm_size NS_OUTPARAM) { return _to GetFxMemory(usage, vm_size); } \
  NS_SCRIPTABLE NS_IMETHOD GetFxCpuUsage(PRInt32 *cpu_usage NS_OUTPARAM) { return _to GetFxCpuUsage(cpu_usage); } \
  NS_SCRIPTABLE NS_IMETHOD GetEthernetCount(PRInt32 *_retval NS_OUTPARAM) { return _to GetEthernetCount(_retval); } \
  NS_SCRIPTABLE NS_IMETHOD GetEthernetSpeed(PRInt32 index, PRInt32 *in_speed NS_OUTPARAM, PRInt32 *out_speed NS_OUTPARAM) { return _to GetEthernetSpeed(index, in_speed, out_speed); } \
  NS_SCRIPTABLE NS_IMETHOD GetEthernetName(PRInt32 index, nsAString & name NS_OUTPARAM) { return _to GetEthernetName(index, name); } \
  NS_SCRIPTABLE NS_IMETHOD GetPowerStatus(PRInt32 *ACLineStatus NS_OUTPARAM, PRInt32 *BatteryFlag NS_OUTPARAM, PRInt32 *BatteryLifePercent NS_OUTPARAM, PRInt32 *BatteryLifeTime NS_OUTPARAM, PRInt32 *hour NS_OUTPARAM, PRInt32 *minute NS_OUTPARAM, PRInt32 *second NS_OUTPARAM) { return _to GetPowerStatus(ACLineStatus, BatteryFlag, BatteryLifePercent, BatteryLifeTime, hour, minute, second); } 

/* Use this macro to declare functions that forward the behavior of this interface to another object in a safe way. */
#define NS_FORWARD_SAFE_ISTATUSBAREXCORE(_to) \
  NS_SCRIPTABLE NS_IMETHOD GetMemoryStatus(PRInt32 *total_memory NS_OUTPARAM, PRInt32 *free_memory NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetMemoryStatus(total_memory, free_memory); } \
  NS_SCRIPTABLE NS_IMETHOD GetFxMemory(PRInt32 *usage NS_OUTPARAM, PRInt32 *vm_size NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetFxMemory(usage, vm_size); } \
  NS_SCRIPTABLE NS_IMETHOD GetFxCpuUsage(PRInt32 *cpu_usage NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetFxCpuUsage(cpu_usage); } \
  NS_SCRIPTABLE NS_IMETHOD GetEthernetCount(PRInt32 *_retval NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetEthernetCount(_retval); } \
  NS_SCRIPTABLE NS_IMETHOD GetEthernetSpeed(PRInt32 index, PRInt32 *in_speed NS_OUTPARAM, PRInt32 *out_speed NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetEthernetSpeed(index, in_speed, out_speed); } \
  NS_SCRIPTABLE NS_IMETHOD GetEthernetName(PRInt32 index, nsAString & name NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetEthernetName(index, name); } \
  NS_SCRIPTABLE NS_IMETHOD GetPowerStatus(PRInt32 *ACLineStatus NS_OUTPARAM, PRInt32 *BatteryFlag NS_OUTPARAM, PRInt32 *BatteryLifePercent NS_OUTPARAM, PRInt32 *BatteryLifeTime NS_OUTPARAM, PRInt32 *hour NS_OUTPARAM, PRInt32 *minute NS_OUTPARAM, PRInt32 *second NS_OUTPARAM) { return !_to ? NS_ERROR_NULL_POINTER : _to->GetPowerStatus(ACLineStatus, BatteryFlag, BatteryLifePercent, BatteryLifeTime, hour, minute, second); } 

#if 0
/* Use the code below as a template for the implementation class for this interface. */

/* Header file */
class _MYCLASS_ : public IStatusbarExCore
{
public:
  NS_DECL_ISUPPORTS
  NS_DECL_ISTATUSBAREXCORE

  _MYCLASS_();

private:
  ~_MYCLASS_();

protected:
  /* additional members */
};

/* Implementation file */
NS_IMPL_ISUPPORTS1(_MYCLASS_, IStatusbarExCore)

_MYCLASS_::_MYCLASS_()
{
  /* member initializers and constructor code */
}

_MYCLASS_::~_MYCLASS_()
{
  /* destructor code */
}

/* void GetMemoryStatus (out long total_memory, out long free_memory); */
NS_IMETHODIMP _MYCLASS_::GetMemoryStatus(PRInt32 *total_memory NS_OUTPARAM, PRInt32 *free_memory NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* void GetFxMemory (out long usage, out long vm_size); */
NS_IMETHODIMP _MYCLASS_::GetFxMemory(PRInt32 *usage NS_OUTPARAM, PRInt32 *vm_size NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* void GetFxCpuUsage (out long cpu_usage); */
NS_IMETHODIMP _MYCLASS_::GetFxCpuUsage(PRInt32 *cpu_usage NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* long GetEthernetCount (); */
NS_IMETHODIMP _MYCLASS_::GetEthernetCount(PRInt32 *_retval NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* void GetEthernetSpeed (in long index, out long in_speed, out long out_speed); */
NS_IMETHODIMP _MYCLASS_::GetEthernetSpeed(PRInt32 index, PRInt32 *in_speed NS_OUTPARAM, PRInt32 *out_speed NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* void GetEthernetName (in long index, out DOMString name); */
NS_IMETHODIMP _MYCLASS_::GetEthernetName(PRInt32 index, nsAString & name NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* void GetPowerStatus (out long ACLineStatus, out long BatteryFlag, out long BatteryLifePercent, out long BatteryLifeTime, out long hour, out long minute, out long second); */
NS_IMETHODIMP _MYCLASS_::GetPowerStatus(PRInt32 *ACLineStatus NS_OUTPARAM, PRInt32 *BatteryFlag NS_OUTPARAM, PRInt32 *BatteryLifePercent NS_OUTPARAM, PRInt32 *BatteryLifeTime NS_OUTPARAM, PRInt32 *hour NS_OUTPARAM, PRInt32 *minute NS_OUTPARAM, PRInt32 *second NS_OUTPARAM)
{
    return NS_ERROR_NOT_IMPLEMENTED;
}

/* End of implementation class template. */
#endif


#endif /* __gen_IStatusbarExCore_h__ */
