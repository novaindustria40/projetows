#!/bin/bash
set -e

# Nome da aplicação e do container
APP_NAME="zapscale-app"
CONTAINER_NAME="zapscale-container"

# Verifica se o arquivo .env existe
if [ ! -f "server/.env" ]; then
    echo "Erro: O arquivo de configuração 'server/.env' não foi encontrado."
    echo "Por favor, crie o arquivo .env com as variáveis de ambiente necessárias antes de continuar."
    exit 1
fi

echo "Iniciando o processo de build e deploy..."

# Para e remove um container antigo com o mesmo nome, se existir
if [ "$(docker ps -a -q -f name=^/${CONTAINER_NAME}$)" ]; then
    echo "Parando e removendo container antigo..."
    docker stop ${CONTAINER_NAME}
    docker rm ${CONTAINER_NAME}
fi

echo "Construindo a nova imagem Docker..."
# Constrói a imagem Docker a partir do Dockerfile no diretório atual
docker build -f ./Dockerfile -t ${APP_NAME} .

echo "Iniciando o novo container..."

# Garante que os diretórios para os volumes existam
mkdir -p ./server/.wwebjs_auth
mkdir -p ./uploads

# Executa o container
docker run -d \
    -p 80:80 \
    --name ${CONTAINER_NAME} \
    --restart always \
    -v "$(pwd)/server/.wwebjs_auth:/app/server/.wwebjs_auth" \
    -v "$(pwd)/uploads:/app/uploads" \
    --env-file ./server/.env \
    ${APP_NAME}

echo "================================================================================"
echo "Deploy concluído com sucesso!"
echo "A aplicação está rodando no container '${CONTAINER_NAME}'."
echo "Acesse a aplicação em http://<seu_ip_publico_da_ec2>"
echo "Para ver os logs, execute: docker logs -f ${CONTAINER_NAME}"
echo "================================================================================"
