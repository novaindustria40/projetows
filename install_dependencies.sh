#!/bin/bash
set -e

# Atualiza a lista de pacotes do Ubuntu
sudo apt-get update -y

# Instala dependências básicas e o Docker
sudo apt-get install -y git docker.io

# Inicia e habilita o serviço do Docker para iniciar com o sistema
sudo systemctl start docker
sudo systemctl enable docker

# Adiciona o usuário 'ubuntu' (padrão do EC2 Ubuntu) ao grupo do docker
# para que você possa executar comandos docker sem usar sudo
sudo usermod -aG docker ubuntu

echo "================================================================================"
echo "Docker e Git foram instalados com sucesso."
echo "IMPORTANTE: Saia da sua sessão SSH e conecte-se novamente para aplicar as"
echo "permissões de grupo do Docker."
echo "Depois de reconectar, verifique a instalação com: docker ps"
echo "================================================================================"