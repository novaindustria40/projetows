# Implantação na AWS ECS com Docker

Esta é uma guia para implantar a sua aplicação na Amazon ECS (Elastic Container Service) usando Docker. Esta abordagem é mais moderna, escalável e robusta do que a implantação em uma única instância EC2.

## Benefícios do Docker e ECS

- **Portabilidade:** A sua aplicação é empacotada em um contêiner Docker, que pode ser executado em qualquer ambiente que suporte Docker.
- **Escalabilidade:** O ECS pode escalar automaticamente o número de contêineres da sua aplicação para cima ou para baixo, com base na demanda.
- **Isolamento:** Cada contêiner é executado em seu próprio ambiente isolado, o que melhora a segurança e a estabilidade.
- **Gerenciamento Simplificado:** O ECS simplifica o processo de implantação, gerenciamento e monitoramento de aplicações em contêineres.

## Pré-requisitos

1.  **AWS CLI:** Instale e configure a [AWS CLI](https://aws.amazon.com/cli/) com as suas credenciais da AWS.
2.  **Docker:** Instale o [Docker](https://www.docker.com/get-started) em sua máquina de desenvolvimento.

## Passos da Implantação

### 1. Criar um Repositório no ECR (Elastic Container Registry)

O ECR é um registro de contêineres Docker gerenciado pela AWS. Você precisa criar um repositório para armazenar a imagem Docker da sua aplicação.

```bash
aws ecr create-repository --repository-name zapscale-saas --region us-east-1
```

### 2. Armazenar a URI do MongoDB no AWS Secrets Manager

É uma prática recomendada armazenar informações sensíveis, como a sua string de conexão do MongoDB, no AWS Secrets Manager.

1.  Vá para o [AWS Secrets Manager](https://console.aws.amazon.com/secretsmanager/).
2.  Clique em **"Store a new secret"**.
3.  Selecione **"Other type of secret"**.
4.  Em **"Secret key/value"**, crie uma chave chamada `MONGODB_URI` e cole a sua string de conexão como o valor.
5.  Clique em **"Next"**.
6.  Dê um nome ao segredo, por exemplo, `zapscale-saas/mongodb`.
7.  Clique em **"Next"** e, em seguida, em **"Store"**.

### 3. Criar um Cluster ECS

Um cluster é um agrupamento lógico de tarefas ou serviços.

```bash
aws ecs create-cluster --cluster-name zapscale-saas-cluster --region us-east-1
```

### 4. Criar uma Definição de Tarefa (Task Definition)

A definição de tarefa é um blueprint para a sua aplicação. Ela especifica qual imagem Docker usar, quanta CPU e memória alocar, as portas a serem abertas e as variáveis de ambiente.

Crie um arquivo chamado `task-definition.json` (será criado para você). Você precisará editar este arquivo e substituir os placeholders `<aws_account_id>`, `<aws_region>` e o ARN do seu segredo do Secrets Manager.

### 5. Criar um Serviço ECS

O serviço ECS é responsável por executar e manter o número desejado de instâncias da sua definição de tarefa. Ele também pode ser configurado para se conectar a um Application Load Balancer (ALB) para distribuir o tráfego para a sua aplicação.

A criação de um serviço com um load balancer é um processo mais envolvido e geralmente é feito através do console da AWS.

**Passos de alto nível:**

1.  Crie um Application Load Balancer (ALB).
2.  Crie um Target Group e aponte para o seu cluster ECS.
3.  Crie um Listener no seu ALB na porta 80 e encaminhe para o seu Target Group.
4.  Crie o serviço ECS e associe-o ao Target Group.

**Para uma configuração mais simples sem load balancer (não recomendado para produção):**

Você pode criar o serviço e a AWS atribuirá um endereço IP público a cada tarefa.

### 6. Script de Implantação (`deploy-ecs.sh`)

Este script irá automatizar o processo de build da imagem Docker, o push para o ECR e a atualização do seu serviço ECS.

## Acesso Externo

Para acessar a sua aplicação externamente, você precisa configurar o seguinte:

-   **Security Group do Load Balancer (ou da Tarefa):** Abra a porta 80 (HTTP) para o tráfego de entrada (`0.0.0.0/0` para acesso público).
-   **Rotas de DNS:** Aponte o seu domínio para o DNS do seu Application Load Balancer.

## Resumo

A implantação na ECS é mais complexa inicialmente, mas oferece benefícios significativos a longo prazo. Esta guia fornece uma visão geral. Para um guia passo a passo detalhado, consulte a [documentação oficial da AWS](https://docs.aws.amazon.com/ecs/latest/developerguide/getting-started-ecs-ec2.html).
