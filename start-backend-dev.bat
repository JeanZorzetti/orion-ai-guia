@echo off
echo ============================================
echo    Orion ERP - Backend DESENVOLVIMENTO
echo    🔥 AUTO-RELOAD ATIVO - Detecta mudancas!
echo ============================================
echo.

cd backend
echo [DEV] Iniciando servidor FastAPI com auto-reload...
echo [DEV] URL: http://localhost:8000
echo [DEV] Docs: http://localhost:8000/docs
echo [DEV] Frontend: http://localhost:3000
echo.
echo ⚡ VANTAGEM: O servidor reinicia automaticamente
echo    quando voce alterar qualquer arquivo Python!
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

py -m uvicorn main-simple:app --reload --host 0.0.0.0 --port 8000