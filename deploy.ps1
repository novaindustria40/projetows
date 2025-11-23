# deploy.ps1
# Script para implantar e atualizar a aplicação ZapScale em um servidor Windows.

# --- CONFIGURAÇÕES ---
# Substitua pela URL do seu repositório Git.
$repoUrl = "https://github.com/seu-usuario/seu-repositorio.git"
# Diretório onde a aplicação será clonada.
$projectPath = "C:\inetpub\wwwroot\zapscale"
# Nome do processo do backend no PM2.
$backendAppName = "zapscale-backend"
# Nome do processo do frontend no PM2.
$frontendAppName = "zapscale-frontend"
# --- FIM DAS CONFIGURAÇÕES ---

# Garante que o diretório de projeto exista
if (-Not (Test-Path $projectPath -PathType Container)) {
    New-Item -ItemType Directory -Path $projectPath | Out-Null
}
cd $projectPath

# Verifica se o repositório já foi clonado
if (Test-Path (Join-Path $projectPath ".git") -PathType Container) {
    Write-Host "Repositório existente encontrado. Puxando atualizações..."
    git pull
} else {
    Write-Host "Clonando o repositório..."
    git clone $repoUrl .
}

# --- DEPLOY DO FRONTEND ---
Write-Host "Instalando dependências do Frontend..."
npm install

Write-Host "Compilando o Frontend..."
npm run build

# Instala 'serve' para servir os arquivos estáticos
Write-Host "Instalando 'serve' para o frontend..."
npm install -g serve

# Inicia ou reinicia o servidor de frontend com PM2
$frontendApp = pm2 jlist | ConvertFrom-Json | Where-Object { $_.name -eq $frontendAppName }
if ($frontendApp) {
    Write-Host "Reiniciando o servidor de frontend..."
    pm2 restart $frontendAppName
} else {
    Write-Host "Iniciando o servidor de frontend..."
    # 'serve' irá servir a pasta 'dist' na porta 3000 por padrão.
    # Ajuste a porta se necessário com o parâmetro -l
    pm2 start "serve -s dist -l 80" --name $frontendAppName
}


# --- DEPLOY DO BACKEND ---
$backendPath = Join-Path $projectPath "server"
cd $backendPath

Write-Host "Instalando dependências do Backend..."
npm install

# Inicia ou reinicia o servidor de backend com PM2
$backendApp = pm2 jlist | ConvertFrom-Json | Where-Object { $_.name -eq $backendAppName }
if ($backendApp) {
    Write-Host "Reiniciando o servidor de backend..."
    pm2 restart $backendAppName
} else {
    Write-Host "Iniciando o servidor de backend..."
    # O backend será iniciado na porta definida no seu código (provavelmente 8080 ou 3000)
    pm2 start "npm -- start" --name $backendAppName
}

# Salva a lista de processos do PM2 para reiniciar junto com o sistema
pm2 save

Write-Host "
--------------------------------------------------
Implantação concluída!

- Frontend (React) está sendo servido pela porta 80.
- Backend (Node.js) está rodando sob o PM2.

Verifique o status dos processos com o comando: pm2 list
--------------------------------------------------
"
