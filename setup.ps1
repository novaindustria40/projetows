# setup.ps1
# Script para configurar o ambiente de um servidor Windows para a aplicação projetows.

# Define a política de execução para permitir scripts
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

# Instala o Chocolatey (gerenciador de pacotes para Windows) se ainda não estiver instalado
If (-Not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Instalando Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
} else {
    Write-Host "Chocolatey já está instalado."
}

# Atualiza as variáveis de ambiente para incluir o Chocolatey
$env:PATH = "$env:ALLUSERSPROFILE\chocolatey\bin;$env:PATH"
Import-Module -Name Chocolatey -Force

# Instala as dependências de software com Chocolatey
Write-Host "Instalando Node.js (LTS), Git..."
choco install nodejs-lts git -y --force

# Atualiza as variáveis de ambiente após a instalação
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
$env:PATH = "C:\Program Files\Git\cmd;$env:PATH"

# Instala o PM2 globalmente com npm
Write-Host "Instalando PM2 e configurando para inicialização com o Windows..."
npm install pm2 -g
npm install pm2-windows-startup -g

# Configura o PM2 para iniciar com o sistema
pm2-startup install

Write-Host "
--------------------------------------------------
Ambiente configurado com sucesso!

Software instalado:
- Node.js (LTS)
- Git
- PM2 (com inicialização automática)

O servidor está pronto para a implantação da aplicação.
--------------------------------------------------
"
