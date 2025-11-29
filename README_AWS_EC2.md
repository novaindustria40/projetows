# Roteiro de Implantação: ZapScale na AWS EC2 (Ubuntu)

Este guia descreve o processo passo a passo para implantar a aplicação ZapScale em uma instância EC2 da AWS utilizando Ubuntu, Docker e Git.

## Pré-requisitos

1.  **Conta na AWS**: Você precisa de uma conta na AWS com permissões para criar e gerenciar instâncias EC2 e Security Groups.
2.  **Git**: A aplicação será clonada de um repositório Git. Certifique-se de que o código-fonte esteja em um repositório (ex: GitHub, GitLab, AWS CodeCommit).
3.  **Chave SSH (.pem)**: Você precisará de um par de chaves SSH para conectar-se à sua instância EC2.

---

## Passo 1: Lançar e Configurar a Instância EC2

1.  **Acesse o Console da AWS** e navegue até o serviço **EC2**.
2.  Clique em **"Launch instances"**.
3.  **Nome**: Dê um nome à sua instância (ex: `zapscale-server-ubuntu`).
4.  **Application and OS Images**: Selecione **Ubuntu**. A AMI `Ubuntu` LTS (ex: 22.04) é recomendada.
5.  **Instance type**: Escolha um tipo de instância. `t2.micro` ou `t3.micro` são suficientes para começar.
6.  **Key pair (login)**: Selecione o par de chaves SSH que você criou ou crie um novo. **Não perca este arquivo `.pem`!**
7.  **Network settings**:
    *   Clique em **"Edit"**.
    *   **Security group name**: Crie um novo Security Group com um nome descritivo (ex: `zapscale-sg`).
    *   **Inbound security groups rules**: Adicione as seguintes regras para permitir tráfego de entrada:
        *   **Regra 1 (SSH)**:
            *   **Type**: `SSH`
            *   **Source type**: `My IP` (Recomendado para segurança, para que apenas seu IP possa conectar).
        *   **Regra 2 (HTTP)**:
            *   **Type**: `HTTP`
            *   **Source type**: `Anywhere` (Para que qualquer pessoa possa acessar a aplicação web).
        *   **Regra 3 (HTTPS)**:
            *   **Type**: `HTTPS`
            *   **Source type**: `Anywhere` (Necessário se você configurar um certificado SSL no futuro).
8.  **Configure storage**: 8 GB é o padrão e geralmente suficiente para começar.
9.  Clique em **"Launch instance"**.

---

## Passo 2: Conectar à Instância EC2

1.  Aguarde a instância estar no estado **"Running"**.
2.  Selecione a instância no console EC2 e copie seu **Public IPv4 address**.
3.  Abra um terminal ou PowerShell no seu computador.
4.  Use o comando SSH para conectar. O usuário padrão para Ubuntu é `ubuntu`.

    ```bash
    # Substitua 'caminho/para/sua-chave.pem' pelo caminho real do seu arquivo .pem
    # Substitua 'seu_ip_publico' pelo endereço IP público da sua instância
    ssh -i "caminho/para/sua-chave.pem" ubuntu@seu_ip_publico
    ```

5.  Você estará conectado ao terminal da sua instância EC2.

---

## Passo 3: Preparar o Ambiente de Implantação

Uma vez conectado à instância, você precisa instalar as dependências necessárias (Git e Docker).

1.  Execute o script `install_dependencies.sh` (que já atualizamos para Ubuntu). Para isso, primeiro crie o arquivo na instância:
    ```bash
    nano install_dependencies.sh
    ```
2.  Cole o conteúdo do script `install_dependencies.sh` gerado, salve (Ctrl+O) e feche (Ctrl+X).
3.  Dê permissão de execução ao script:
    ```bash
    chmod +x install_dependencies.sh
    ```
4.  Execute o script para instalar Docker e Git:
    ```bash
    ./install_dependencies.sh
    ```
5.  **IMPORTANTE**: Para que as permissões do Docker para o `ubuntu` tenham efeito, saia da sessão SSH e conecte-se novamente.
    ```bash
    exit
    ssh -i "caminho/para/sua-chave.pem" ubuntu@seu_ip_publico
    ```
6.  Verifique se o Docker está funcionando sem `sudo`:
    ```bash
    docker ps
    ```
    Você deverá ver uma tabela vazia sem erros de permissão.

---

## Passo 4: Clonar e Configurar a Aplicação

1.  Clone o repositório do seu projeto para a instância EC2.
    ```bash
    # Substitua pela URL do seu repositório
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio # Entre no diretório do projeto
    ```
2.  **Configurar Variáveis de Ambiente**: A aplicação precisa de um arquivo `.env` para carregar as variáveis de ambiente necessárias para o container Docker.
    *   Crie e edite o arquivo `.env` no diretório **raiz** do projeto:
        ```bash
        nano .env
        ```
    *   Adicione as variáveis necessárias. O arquivo deve conter **apenas** as chaves e valores, sem aspas.
        ```env
        # Exemplo de conteúdo para o arquivo .env
        MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-url>/<database>
        GEMINI_API_KEY=sua-chave-gemini-aqui
        ```
    *   Salve o arquivo (Ctrl+O) e saia (Ctrl+X). Este arquivo será usado pelo script de atualização para injetar as variáveis no container.

---

## Passo 5: Implantação e Atualização com o Roteiro Automatizado

Para simplificar tanto a primeira implantação quanto as futuras atualizações, foi criado o roteiro `update.sh`.

1.  **Dar Permissão de Execução ao Roteiro**:
    Antes de executar o roteiro pela primeira vez, você precisa torná-lo executável:
    ```bash
    chmod +x update.sh
    ```

2.  **Executar o Roteiro de Implantação/Atualização**:
    Execute o roteiro para construir a imagem Docker, parar e remover qualquer container antigo, e iniciar um novo com as configurações corretas.
    ```bash
    ./update.sh
    ```
    O roteiro irá:
    *   Puxar as últimas alterações do Git (`git pull`).
    *   Verificar se o arquivo `.env` existe.
    *   Construir a imagem Docker mais recente.
    *   Parar e remover o container `zapscale` antigo.
    *   Iniciar um novo container `zapscale`, injetando as variáveis de ambiente do arquivo `.env`.

3.  **Verificação**: Após a execução do roteiro, a aplicação deve estar acessível no navegador através do endereço IP público da sua instância:
    `http://seu_ip_publico`

---

## Gerenciamento do Container

Aqui estão alguns comandos úteis para gerenciar o container Docker:

*   **Ver logs da aplicação em tempo real**:
    ```bash
    docker logs -f zapscale
    ```
*   **Parar o container**:
    ```bash
    docker stop zapscale
    ```
*   **Iniciar o container novamente**:
    ```bash
    docker start zapscale
    ```
*   **Acessar o terminal do container** (para depuração avançada):
    ```bash
    docker exec -it zapscale /bin/bash
    ```
*   **Remover o container** (pare-o primeiro):
    ```bash
    docker rm zapscale
    ```

---

## Para Atualizar a Aplicação

O processo de atualização agora é muito simples. Basta executar o mesmo roteiro novamente no diretório do projeto:

```bash
./update.sh
```
Ele cuidará de todo o processo de baixar o código novo e reiniciar o container.