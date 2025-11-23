# deploy.ps1
# Script para implantar e atualizar a aplicação em um servidor Windows.

# --- CONFIGURAÇÕES ---
# Substitua pela URL do seu repositório Git.
$repoUrl = "https://github.com/novaindustria40/projetows"
# Diretório onde a aplicação será clonada.
$projectPath = "C:\inetpub\wwwroot\zapscale-saas"
# Nome do processo no PM2.
$appName = "zapscale-saas"
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

# --- DEPLOY DA APLICAÇÃO ---
Write-Host "Instalando dependências do projeto (raiz)..."
npm install

Write-Host "Compilando o Frontend..."
npm run build

$backendPath = Join-Path $projectPath "server"
cd $backendPath

Write-Host "Instalando dependências do Backend..."
npm install


# Inicia ou reinicia o servidor com PM2
$app = pm2 jlist | ConvertFrom-Json | Where-Object { $_.name -eq $appName }
if ($app) {
    Write-Host "Reiniciando a aplicação..."
    pm2 restart $appName
} else {
    Write-Host "Iniciando a aplicação..."
    # O backend irá servir a aplicação na porta 80
    pm2 start index.js --name $appName
}

# Salva a lista de processos do PM2 para reiniciar junto com o sistema
pm2 save

Write-Host "
--------------------------------------------------
Implantação concluída!

- A aplicação está sendo servida na porta 80.

Verifique o status do processo com o comando: pm2 list
--------------------------------------------------
"