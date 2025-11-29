#!/bin/bash

# --- Roteiro de Atualização da Aplicação ZapScale ---
# Este script automatiza o processo de atualização da aplicação no servidor.
# Ele baixa as últimas alterações, reconstrói a imagem Docker e reinicia o container.

echo "=> Iniciando a atualização da aplicação ZapScale..."

# 1. Parar o script em caso de erro
set -e

# 2. Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
  echo "!!!!!! ERRO !!!!!!"
  echo "O arquivo .env não foi encontrado."
  echo "Crie um arquivo chamado .env no diretório do projeto e adicione a sua MONGODB_URI nele."
  echo "Exemplo de conteúdo do .env:"
  echo "MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database"
  exit 1
fi

echo "=> [1/5] Puxando as últimas alterações do repositório Git..."
git pull

echo "=> [2/5] Reconstruindo a imagem Docker (zapscale-app)..."
docker build -t zapscale-app .

echo "=> [3/5] Parando o container Docker atual (zapscale)..."
# O comando 'docker ps' é usado para verificar se o container existe antes de tentar pará-lo.
# O '|| true' garante que o script não pare se o container não existir.
docker stop zapscale || true

echo "=> [4/5] Removendo o container Docker antigo (zapscale)..."
docker rm zapscale || true

echo "=> [5/5] Iniciando o novo container Docker..."
# A flag '--env-file ./.env' carrega as variáveis de ambiente (como MONGODB_URI) do arquivo .env
# A flag '-p 80:3001' mapeia a porta 80 do servidor para a porta 3001 da aplicação dentro do container.
# Se a porta 80 do seu servidor estiver ocupada, você pode mudar para outra, como '-p 8080:3001'.
docker run -d -p 80:3001 --env-file ./.env --name zapscale zapscale-app

echo ""
echo "✅ Atualização concluída com sucesso!"
echo "A nova versão da aplicação está no ar."
echo "Para verificar os logs, use o comando: docker logs -f zapscale"
