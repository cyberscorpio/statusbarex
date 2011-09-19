@echo off
@set path="C:\Program Files\7-Zip";%path%
REM create tags first
ctags -R *
REM create the xpt then
call build-idl.bat
if exist statusbarex.xpi goto deletexpi

: createxpi
call 7z.exe a statusbarex.xpi * -r -x!*.bat -x!*.tmp -x!*.swp -x!*.svn -x!*.zip -x!*.git -x!*.php -x!tags -x!*.idl -x!*.xpi
@goto end

:deletexpi
del statusbarex.xpi
@goto createxpi

:end
@echo on

REM @echo off
REM if not exist ..\native\win32\Release\statusbarex.dll goto dllmissing
REM if not exist ..\native\win32\IStatusbarExCore.xpt goto xptmissing
REM @copy ..\native\win32\Release\statusbarex.dll components
REM @copy ..\native\win32\IStatusbarExCore.xpt components
REM @set path="C:\Program Files\7-Zip";%path%
REM if exist statusbarex.xpi goto deletexpi
REM 
REM : createxpi
REM call 7z.exe a statusbarex.xpi * -r -x!xpi.bat -x!*.tmp -x!*.swp -x!*.svn -x!*.zip
REM @goto end
REM 
REM :deletexpi
REM del statusbarex.xpi
REM @goto createxpi
REM 
REM :dllmissing
REM echo statusbarex.dll is missing....
REM @goto end
REM 
REM :xptmissing
REM echo IStatusbarExCore.xpt is missing....
REM @goto end
REM 
REM :end
REM @echo on
