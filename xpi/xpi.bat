@echo off
if not exist ..\native\win32\Release\statusbarex.dll goto dllmissing
if not exist ..\native\win32\IStatusbarExCore.xpt goto xptmissing
@copy ..\native\win32\Release\statusbarex.dll components
@copy ..\native\win32\IStatusbarExCore.xpt components
@set path="C:\Program Files\7-Zip";%path%
if exist statusbarex.xpi goto deletexpi

: createxpi
call 7z.exe a statusbarex.xpi * -r -x!xpi.bat -x!*.tmp -x!*.swp -x!*.svn
@goto end

:deletexpi
del statusbarex.xpi
@goto createxpi

:dllmissing
echo statusbarex.dll is missing....
@goto end

:xptmissing
echo IStatusbarExCore.xpt is missing....
@goto end

:end
@echo on
