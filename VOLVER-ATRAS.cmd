@echo off
REM  ============================================================
REM   VOLVER ATRAS  -  doble clic y la web vuelve a la version buena
REM  ============================================================
REM
REM  Vuelve simplystudioai.com a la version marcada con la etiqueta
REM  "version-que-funciona". Hoy es la del 17/09 (antes del inicio nuevo
REM  con la galeria arriba): Edicion Septiembre, precio 67, Bose y COS.
REM
REM  No borra nada: crea un cambio nuevo que devuelve los archivos a esa
REM  version y lo publica. Si despues queres volver a lo nuevo, se puede.
REM
REM  No toca Meta ni Hotmart: misma direccion, mismo pixel, mismo checkout.
REM  Las campanas siguen corriendo sin enterarse.
REM
REM  Cuando publiquemos algo nuevo y se compruebe que anda, se mueve la
REM  etiqueta a ese punto. La version del 29/08 quedo guardada como
REM  "version-29-agosto" por si alguna vez hace falta.
REM
REM  Detalle tecnico: Windows lee este archivo mientras lo ejecuta, y git
REM  cambia archivos de esta carpeta. Por eso primero se copia a TEMP y
REM  corre desde ahi: asi git nunca le cambia el piso.

if /i not "%~1"=="--corriendo" (
  copy /y "%~f0" "%TEMP%\simplystudio-volver-atras.cmd" >nul
  "%TEMP%\simplystudio-volver-atras.cmd" --corriendo "%~dp0."
)

cd /d "%~2" || goto error
echo.
echo   Esto vuelve simplystudioai.com a la version anterior
echo   (la marcada como buena: version-que-funciona).
echo.
choice /c SN /m "  Seguro que queres volver atras"
if errorlevel 2 goto cancelado

echo.
echo   Guardando cualquier cambio sin terminar...
git stash push -u -m "respaldo automatico antes de volver atras" >nul 2>&1

echo   Trayendo la ultima version del servidor...
git fetch -q origin --tags || goto error
git checkout -q -f main || goto error
git reset -q --hard origin/main || goto error

echo   Volviendo los archivos a la version buena...
git checkout version-que-funciona -- . ":(exclude)VOLVER-ATRAS.cmd" || goto error

git commit -q -m "Vuelta a la version anterior (version-que-funciona)" || goto nada
echo   Publicando...
git push -q origin main || goto error

echo.
echo   LISTO. Vercel esta publicando la version anterior.
echo   En uno o dos minutos recarga simplystudioai.com
goto fin

:nada
echo.
echo   La web ya estaba en esa version. No hubo nada que cambiar.
goto fin

:cancelado
echo.
echo   Cancelado. No se toco nada.
goto fin

:error
echo.
echo   ALGO FALLO y no se publico nada. La web sigue como estaba.
echo   Avisale a Claude y mandale una captura de esta ventana.

:fin
echo.
pause
