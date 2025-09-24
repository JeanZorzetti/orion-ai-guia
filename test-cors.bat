@echo off
echo ============================================
echo    Orion ERP - Teste de CORS
echo ============================================
echo.

echo [TEST] Testando CORS para dominios de producao...
echo.

echo 1. Testando orionerp.roilabs.com.br:
curl -H "Origin: https://orionerp.roilabs.com.br" -H "Access-Control-Request-Method: POST" -X OPTIONS "http://localhost:8000/api/v1/auth/login"
echo.

echo 2. Testando orionback.roilabs.com.br:
curl -H "Origin: https://orionback.roilabs.com.br" -H "Access-Control-Request-Method: GET" -X OPTIONS "http://localhost:8000/api/v1/dashboard/"
echo.

echo 3. Testando localhost (desenvolvimento):
curl -H "Origin: http://localhost:3000" -H "Access-Control-Request-Method: POST" -X OPTIONS "http://localhost:8000/api/v1/financials/invoices/upload"
echo.

echo 4. Testando endpoint de health:
curl -X GET "http://localhost:8000/health"
echo.

echo.
echo ============================================
echo    Teste de CORS concluido!
echo ============================================