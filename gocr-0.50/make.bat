@rem why does DJGPP not work with dosemu?
@echo " --- compiling GOCR under DOS --- "
@GOTO DOS
# unix-shell does not know GOTO
# changes: .tcl cat=?, xli=?
#          progress before Stop/button, gocrexe.zip-package
exit
:DOS
if "%1" == "compile" GOTO compile
@echo "I love this environment. --- Kick me!"
@rem %0 works only with real-dos, not with DOSEMU
@if "%0" == "" GOTO compile
@command.com /E:8000 /c %0 compile
@GOTO END
exit
:compile
@echo off
SET ROOT=D:\TMP2\CDROM\DOS\DJGPP
SET TEMP=%ROOT%\tmp
SET TMP=%TEMP%
SET BINPATH=%ROOT%\BIN\
PATH %BINPATH%;%PATH%
SET DJGPP=%ROOT%\DJGPP.ENV
SET OPT=-O2 -pedantic -Iinclude -Wall
SET OPT=-O2 -DHAVE_CONFIG_H
SET C_INCLUDE_PATH=SRC;INCLUDE;%C_INCLUDE_PATH%
REM mkdir tmp
@echo on
REM make makefile.dos
REM exit
gcc %OPT% -o a1.o -c src\box.c
gcc %OPT% -o a2.o -c src\database.c
gcc %OPT% -o a3.o -c src\detect.c
gcc %OPT% -o a4.o -c src\gocr.c
gcc %OPT% -o a5.o -c src\lines.c
gcc %OPT% -o a6.o -c src\list.c
gcc %OPT% -o a7.o -c src\ocr0.c
gcc %OPT% -o a8.o -c src\ocr0n.c
gcc %OPT% -o a9.o -c src\ocr1.c
gcc %OPT% -o aa.o -c src\otsu.c
gcc %OPT% -o ab.o -c src\output.c
gcc %OPT% -o ac.o -c src\pcx.c
gcc %OPT% -o ad.o -c src\pgm2asc.c
gcc %OPT% -o ae.o -c src\pixel.c
gcc %OPT% -o af.o -c src\pnm.c
gcc %OPT% -o ag.o -c src\remove.c
gcc %OPT% -o ah.o -c src\unicode.c
gcc %OPT% -o ai.o -c src\barcode.c
gcc %OPT% -o aj.o -c src\job.c
gcc %OPT% -o ak.o -c src\progress.c
REM having only 128 byte for command line is terrible (concatenate?)
gcc -o gocr.exe a1.o a2.o a3.o a4.o a5.o a6.o a7.o a8.o a9.o aa.o ab.o ac.o ad.o ae.o af.o ag.o ah.o ai.o aj.o ak.o
@if exist gocr.exe del *.o
@if exist gocr.exe strip gocr.exe
rem pkzip gocrexe gocr.exe gocr.tcl README 
@GOTO END
:END
