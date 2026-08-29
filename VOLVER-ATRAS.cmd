@echo off
REM  Vuelve la web a la ultima version que funcionaba.
REM
REM  Doble clic y listo. Tarda lo que tarde Vercel en desplegar, uno o dos
REM  minutos. No toca los anuncios de Meta: la direccion del sitio, el pixel
REM  y los enlaces de Hotmart son los mismos, asi que las campanas siguen
REM  corriendo sin enterarse.
REM
REM  La version buena esta marcada con la etiqueta "version-que-funciona".
REM  Cuando publiquemos algo nuevo y quede demostrado que anda, se mueve la
REM  etiqueta a ese punto y este archivo pasa a devolver ahi.

cd /d "%~dp0"

echo.
echo   Volviendo a la version marcada como buena...
echo.

git fetch origin --tags
git checkout main
git reset --hard version-que-funciona
git push --force origin main

echo.
echo   Listo. Vercel esta desplegando la version anterior.
echo   Dale uno o dos minutos y recarga simplystudioai.com
echo.
pause
