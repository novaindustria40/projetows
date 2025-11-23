#!/bin/bash

# Script para implantar a aplicação no AWS ECS

# --- CONFIGURAÇÕES ---
AWS_ACCOUNT_ID="<aws_account_id>"
AWS_REGION="<aws_region>"
ECR_REPOSITORY="zapscale-saas"
ECS_CLUSTER="zapscale-saas-cluster"
ECS_SERVICE="zapscale-saas-service" # O nome do serviço que você criou no cluster
IMAGE_TAG="latest"
# --- FIM DAS CONFIGURAÇÕES ---

# Faça o login no Amazon ECR
echo "Fazendo login no Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Verifique se o login foi bem-sucedido
if [ $? -ne 0 ]; then
    echo "Erro ao fazer login no ECR. Verifique suas credenciais da AWS."
    exit 1
fi

# Construa a imagem Docker
echo "Construindo a imagem Docker..."
docker build -t $ECR_REPOSITORY:$IMAGE_TAG .

# Verifique se a imagem foi construída com sucesso
if [ $? -ne 0 ]; then
    echo "Erro ao construir a imagem Docker."
    exit 1
fi

# Marque a imagem Docker para o repositório ECR
echo "Marcando a imagem Docker..."
docker tag $ECR_REPOSITORY:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG

# Envie a imagem para o ECR
echo "Enviando a imagem para o ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG

# Verifique se a imagem foi enviada com sucesso
if [ $? -ne 0 ]; then
    echo "Erro ao enviar a imagem para o ECR."
    exit 1
fi

# Atualize o serviço ECS para usar a nova imagem
echo "Atualizando o serviço ECS..."
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $AWS_REGION

if [ $? -ne 0 ]; then
    echo "Erro ao atualizar o serviço ECS. Verifique se o nome do cluster e do serviço estão corretos."
    exit 1
fi

echo "
--------------------------------------------------
Implantação no ECS concluída com sucesso!

- A nova imagem foi enviada para o ECR.
- O serviço ECS foi atualizado para usar a nova imagem.
- A sua aplicação estará disponível em breve.

Verifique o status da implantação no console da AWS.
--------------------------------------------------
"
