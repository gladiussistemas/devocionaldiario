# 🚀 Configuração do Deploy Automático via GitHub Actions

## Como configurar

### 1. Adicionar Secrets no GitHub

Vá em: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Adicione os seguintes secrets:

#### `SERVER_HOST`
```
201.54.11.117
```

#### `SERVER_USER`
```
root
```

#### `SERVER_SSH_KEY`
Sua chave SSH privada para acessar o servidor.

**Como obter:**
```bash
# No seu computador local, copie a chave privada:
cat ~/.ssh/id_rsa

# OU gere uma nova chave específica para o GitHub Actions:
ssh-keygen -t rsa -b 4096 -C "github-actions" -f ~/.ssh/github_actions_key

# Copie a chave pública para o servidor:
ssh-copy-id -i ~/.ssh/github_actions_key.pub root@201.54.11.117

# Cole o conteúdo da chave PRIVADA no secret:
cat ~/.ssh/github_actions_key
```

---

## Como funciona

### 🔄 Deploy Automático

Toda vez que você fizer `git push` para a branch `main`, o GitHub Actions irá:

1. **Deploy Backend:**
   - Conectar no servidor via SSH
   - Fazer `git pull`
   - Rebuild do container backend
   - Restart dos serviços

2. **Deploy Admin Panel:**
   - Build do React/Vite
   - Upload dos arquivos estáticos para o servidor
   - Restart do nginx

3. **Notificação:**
   - Aviso de sucesso ou falha

### 🎯 Deploy Manual

Você também pode disparar o deploy manualmente:

1. Vá em **Actions** no GitHub
2. Selecione **Deploy to Production**
3. Clique em **Run workflow**
4. Escolha a branch `main`
5. Clique em **Run workflow**

---

## Verificar logs

Após cada push:

1. Vá em **Actions** no GitHub
2. Clique no workflow em execução
3. Veja os logs de cada etapa

---

## Rollback

Se algo der errado, você pode:

1. Fazer revert do commit problemático
2. Fazer push
3. O GitHub Actions fará deploy da versão anterior automaticamente

OU

1. Conectar no servidor manualmente
2. Fazer git reset para commit anterior
3. Rebuild manual

---

## Estrutura do Workflow

```
┌─────────────────┐
│   git push      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   GitHub Actions Triggered       │
└────────┬────────────────────────┘
         │
         ├──► Deploy Backend (Docker)
         │     └─ git pull
         │     └─ docker-compose build
         │     └─ docker-compose up
         │
         ├──► Deploy Admin Panel (Static)
         │     └─ npm build
         │     └─ SCP upload
         │     └─ nginx restart
         │
         └──► Notify Success/Failure
```

---

## Segurança

- ✅ SSH Keys são armazenadas como secrets encriptados
- ✅ Nunca exponha credenciais no código
- ✅ Use chaves SSH específicas para CI/CD
- ✅ Revogue chaves antigas periodicamente

---

## Troubleshooting

### Erro: "Permission denied"
- Verifique se a chave SSH está correta
- Verifique se a chave pública está no servidor: `~/.ssh/authorized_keys`

### Erro: "Host key verification failed"
- Adicione o servidor ao known_hosts:
  ```bash
  ssh-keyscan -H 201.54.11.117 >> ~/.ssh/known_hosts
  ```

### Build falha
- Verifique os logs no Actions
- Teste o build localmente primeiro
- Verifique variáveis de ambiente

---

**Pronto!** Agora todo push na branch `main` fará deploy automático! 🎉
