# Script PowerShell para executar testes dentro do WSL
param([string]$Command = "test")

Write-Host "Executando testes no WSL..." -ForegroundColor Cyan

# Caminho fixo conhecido
$linuxPath = "/home/suissa/projetos/novos/SUPARAG/server"

# Mapear comandos
$npmCommand = switch ($Command) {
    "watch" { "test:watch" }
    "coverage" { "test:coverage" }
    "report" { "report" }
    "snapshot" { "snapshot" }
    default { "test" }
}

Write-Host "Diretorio: $linuxPath"
Write-Host "Comando: npm run $npmCommand"
Write-Host ""

# Executar no WSL
wsl bash -c "cd $linuxPath && npm run $npmCommand"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Testes executados com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Testes falharam!" -ForegroundColor Red
}

exit $LASTEXITCODE
