#!/bin/bash
set -e

# Atualiza os pacotes da instância
sudo yum update -y

# Instala o Git
sudo yum install -y git

# Instala o Docker
sudo yum install -y docker

# Inicia o serviço do Docker
sudo service docker start

# Adiciona o usuário ec2-user ao grupo do docker para que você possa executar comandos docker sem usar sudo
sudo usermod -a -G docker ec2-user

echo "================================================================================"
echo "Docker e Git foram instalados com sucesso."
echo "IMPORTANTE: Saia da sua sessão SSH e conecte-se novamente para aplicar as"
echo "permissões de grupo do Docker."
echo "Depois de reconectar, verifique a instalação com: docker ps"
echo "================================================================================"
