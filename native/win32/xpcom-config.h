/* xpcom/xpcom-config.h.  Generated automatically by configure.  */
/* Global defines needed by xpcom clients */

#ifndef _XPCOM_CONFIG_H_
#define _XPCOM_CONFIG_H_

/* Define this to throw() if the compiler complains about 
 * constructors returning NULL
 */
#define CPP_THROW_NEW throw()

/*********************************************************
 * copied from mozilla-config.h
 ********************************************************/
#define ACCESSIBILITY 1
#define BUILD_CTYPES 1
#define D_INO d_ino
#define HAVE_ATLBASE_H 1
#define HAVE_IO_H 1
#define HAVE_ISATTY 1
#define HAVE_MMINTRIN_H 1
#define HAVE_OLEACC_IDL 1
#define HAVE_SETBUF 1
#define HAVE_SNPRINTF 1
#define HAVE_UINT64_T 1
#define HAVE_WINSDKVER_H 1
#define HAVE_WPCAPI_H 1
#define HW_THREADS 1
#define IBMBIDI 1
#define MOZILLA_VERSION "1.9.2"
#define MOZILLA_VERSION_U 1.9.2
#define MOZ_BUILD_APP xulrunner
#define MOZ_CRASHREPORTER 1
#define MOZ_CRASHREPORTER_ENABLE_PERCENT 100
#define MOZ_DEFAULT_TOOLKIT "cairo-windows"
#define MOZ_DISTRIBUTION_ID "org.mozilla"
#define MOZ_DLL_SUFFIX ".dll"
#define MOZ_EMBEDDING_LEVEL_BASIC 1
#define MOZ_EMBEDDING_LEVEL_DEFAULT 1
#define MOZ_EMBEDDING_LEVEL_MINIMAL 1
#define MOZ_ENABLE_CANVAS 1
#define MOZ_ENABLE_LIBXUL 1
#define MOZ_FEEDS 1
#define MOZ_JSLOADER 1
#define MOZ_LOGGING 1
#define MOZ_MATHML 1
#define MOZ_MEDIA 1
#define MOZ_MEMORY 1
#define MOZ_MEMORY_SIZEOF_PTR_2POW 2
#define MOZ_MEMORY_WINDOWS 1
#define MOZ_MORKREADER 1
#define MOZ_NO_XPCOM_OBSOLETE 1
#define MOZ_NTDDI_LONGHORN 0x06000000
#define MOZ_NTDDI_WIN7 0x06010000
#define MOZ_NTDDI_WS03 0x05020000
#define MOZ_OGG 1
#define MOZ_PLACES 1
#define MOZ_PROFILELOCKING 1
#define MOZ_RDF 1
#define MOZ_STORAGE 1
#define MOZ_SVG 1
#define MOZ_SYDNEYAUDIO 1
#define MOZ_TREE_CAIRO 1
#define MOZ_UPDATE_CHANNEL default
#define MOZ_USER_DIR "Mozilla"
#define MOZ_VIEW_SOURCE 1
#define MOZ_WAVE 1
#define MOZ_WINSDK_TARGETVER 0x06010000
#define MOZ_XPINSTALL 1
#define MOZ_XTF 1
#define MOZ_XUL 1
#define MOZ_XULRUNNER 1
#define NO_X11 1
#define NS_PRINTING 1
#define NS_PRINT_PREVIEW 1
#define STDC_HEADERS 1
#define WIN32 1
#define XP_WIN 1
#define XP_WIN32 1
#define X_DISPLAY_MISSING 1
#define _CRT_NONSTDC_NO_DEPRECATE 1
#define _CRT_SECURE_NO_DEPRECATE 1
#define _STATIC_CPPLIB 1
#define _WINDOWS 1
/******************************************************/

/* Define if the c++ compiler supports a 2-byte wchar_t */
/* #undef HAVE_CPP_2BYTE_WCHAR_T */

/* Define if the c++ compiler supports changing access with |using| */
/* #undef HAVE_CPP_ACCESS_CHANGING_USING */

/* Define if the c++ compiler can resolve ambiguity with |using| */
/* #undef HAVE_CPP_AMBIGUITY_RESOLVING_USING */

/* Define if the c++ compiler has builtin Bool type */
/* #undef HAVE_CPP_BOOL */

/* Define if the c++ compiler supports char16_t */
/* #undef HAVE_CPP_CHAR16_T */

/* Define if a dyanmic_cast to void* gives the most derived object */
/* #undef HAVE_CPP_DYNAMIC_CAST_TO_VOID_PTR */

/* Define if the c++ compiler supports the |explicit| keyword */
/* #undef HAVE_CPP_EXPLICIT */

/* Define if the c++ compiler supports the modern template 
 * specialization syntax 
 */
/* #undef HAVE_CPP_MODERN_SPECIALIZE_TEMPLATE_SYNTAX */

/* Define if the c++ compiler supports the |std| namespace */
/* #undef HAVE_CPP_NAMESPACE_STD */

/* Define if the c++ compiler supports reinterpret_cast */
/* #undef HAVE_CPP_NEW_CASTS */

/* Define if the c++ compiler supports partial template specialization */
/* #undef HAVE_CPP_PARTIAL_SPECIALIZATION */

/* Define if the c++ compiler has trouble comparing a constant
 * reference to a templatized class to zero
 */
/* #undef HAVE_CPP_TROUBLE_COMPARING_TO_ZERO */

/* Define if the c++ compiler supports the |typename| keyword */
/* #undef HAVE_CPP_TYPENAME */

/* Define if the stanard template operator!=() is ambiguous */
/* #undef HAVE_CPP_UNAMBIGUOUS_STD_NOTEQUAL */

/* Define if statvfs() is available */
/* #undef HAVE_STATVFS */

/* Define if the c++ compiler requires implementations of 
 * unused virtual methods
 */
/* #undef NEED_CPP_UNUSED_IMPLEMENTATIONS */

/* Define to either <new> or <new.h> */
#define NEW_H <new>

#endif /* _XPCOM_CONFIG_H_ */
