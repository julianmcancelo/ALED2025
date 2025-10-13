@echo off
echo ========================================
echo DESPLEGANDO A PRODUCCION - MERCADO PAGO
echo ========================================
echo.

echo [1/3] Compilando funciones de Firebase...
cd functions
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo la compilacion
    pause
    exit /b 1
)
cd ..

echo.
echo [2/3] Desplegando funciones a Firebase...
firebase deploy --only functions
if %errorlevel% neq 0 (
    echo ERROR: Fallo el despliegue de funciones
    pause
    exit /b 1
)

echo.
echo [3/3] Compilando y desplegando frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Fallo la compilacion del frontend
    pause
    exit /b 1
)

firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo ERROR: Fallo el despliegue del hosting
    pause
    exit /b 1
)

echo.
echo ========================================
echo DESPLIEGUE COMPLETADO EXITOSAMENTE!
echo ========================================
echo.
echo Tu aplicacion esta ahora en produccion con las nuevas credenciales de Mercado Pago.
echo URL: https://aled2025-5be25.web.app
echo.
pause
