@echo off
echo ============================================
echo    Orion ERP - Backend PRODUCAO
echo    ⚡ Performance otimizada
echo ============================================
echo.

cd backend
echo [PROD] Iniciando servidor FastAPI...
echo [PROD] URL: http://localhost:8000
echo [PROD] Docs: http://localhost:8000/docs
echo [PROD] Frontend: http://localhost:3000
echo.
echo ⚠️  NOTA: Sem auto-reload - reinicie manualmente
echo    para aplicar mudanças no codigo
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

py main-simple.py