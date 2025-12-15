# 🏃 Configuração do Self-Hosted Runner (igual Azure DevOps)

## O que é?

Um **self-hosted runner** é um agente que roda NO SEU SERVIDOR e se conecta ao GitHub automaticamente para receber e executar jobs.

**Vantagens:**
- ✅ Sem necessidade de SSH
- ✅ Sem expor credenciais
- ✅ Mais rápido (já está no servidor)
- ✅ Mais seguro
- ✅ Igual ao Azure DevOps Pipelines!

---

## 📦 Instalação

### 1. No GitHub, obter o token de registro:

1. Vá em: `https://github.com/gladiussistemas/devocionaldiario/settings/actions/runners/new`
2. Você verá comandos com um TOKEN gerado
3. **Copie apenas o TOKEN** (usado no passo 4)

### 2. Conectar no servidor:

```bash
ssh root@201.54.11.117
```

### 3. Instalar o runner:

```bash
# Criar diretório
mkdir -p /opt/github-runner
cd /opt/github-runner

# Baixar runner (Linux x64)
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extrair
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Limpar
rm actions-runner-linux-x64-2.311.0.tar.gz
```

### 4. Configurar o runner:

```bash
# Substituir SEU_TOKEN pelo token copiado do GitHub
./config.sh \
  --url https://github.com/gladiussistemas/devocionaldiario \
  --token SEU_TOKEN_AQUI \
  --name "devocional-server" \
  --work _work

# Responder as perguntas:
# - Nome do runner group: [Enter] (usa default)
# - Labels adicionais: [Enter] (deixa vazio)
# - Nome da pasta de trabalho: [Enter] (usa _work)
```

### 5. Instalar como serviço systemd:

```bash
# Instalar serviço
sudo ./svc.sh install

# Iniciar serviço
sudo ./svc.sh start

# Verificar status
sudo ./svc.sh status

# Deve aparecer: "Active: active (running)"
```

### 6. Verificar no GitHub:

1. Vá em: `https://github.com/gladiussistemas/devocionaldiario/settings/actions/runners`
2. Você deve ver o runner **"devocional-server"** com status **"Idle"** (aguardando jobs)

✅ **Pronto! O runner está instalado e aguardando jobs!**

---

## 🎯 Como usar

Agora, quando você fizer:

```bash
git add .
git commit -m "minha alteração"
git push
```

**O que acontece:**

1. GitHub detecta o push na branch `main`
2. GitHub envia o job para o runner `self-hosted`
3. Runner (no servidor) recebe o job
4. Runner executa:
   - Checkout do código
   - Deploy do backend (docker-compose)
   - Build do admin panel (npm)
   - Restart nginx
5. GitHub mostra resultado no Actions

**Tudo sem SSH! Tudo local no servidor!**

---

## 🔧 Comandos úteis

```bash
# Ver status
sudo /opt/github-runner/svc.sh status

# Parar runner
sudo /opt/github-runner/svc.sh stop

# Iniciar runner
sudo /opt/github-runner/svc.sh start

# Reiniciar runner
sudo /opt/github-runner/svc.sh restart

# Ver logs
sudo journalctl -u actions.runner.gladiussistemas-devocionaldiario.devocional-server -f
```

---

## 🆚 Comparação: Azure DevOps vs GitHub Actions

| Aspecto | Azure DevOps | GitHub Actions |
|---------|--------------|----------------|
| Agent/Runner no servidor | ✅ Agent | ✅ Self-hosted Runner |
| Auto-conecta ao serviço | ✅ | ✅ |
| Executa jobs localmente | ✅ | ✅ |
| Configuração | YAML Pipeline | YAML Workflow |
| Instalação como serviço | ✅ systemd | ✅ systemd |
| Precisa expor SSH? | ❌ | ❌ |

**São praticamente idênticos!**

---

## 🔒 Segurança

**Vantagens do self-hosted runner:**

1. ✅ **Sem SSH exposto** - Runner se conecta AO GitHub (não o contrário)
2. ✅ **Sem chaves SSH** - Usa token OAuth do GitHub
3. ✅ **Firewall friendly** - Apenas saída HTTPS (443)
4. ✅ **Revogável** - Pode remover o runner a qualquer momento no GitHub
5. ✅ **Auditável** - Todos os logs ficam no servidor

---

## 🔄 Atualizar runner

Quando sair nova versão:

```bash
cd /opt/github-runner

# Parar serviço
sudo ./svc.sh stop

# Baixar nova versão
curl -o actions-runner-linux-x64-NEW_VERSION.tar.gz -L \
  https://github.com/actions/runner/releases/download/vNEW_VERSION/actions-runner-linux-x64-NEW_VERSION.tar.gz

# Extrair (sobrescrever)
tar xzf ./actions-runner-linux-x64-NEW_VERSION.tar.gz

# Reiniciar
sudo ./svc.sh start
```

---

## ❌ Remover runner

Se quiser remover:

```bash
# Parar e desinstalar serviço
cd /opt/github-runner
sudo ./svc.sh stop
sudo ./svc.sh uninstall

# Remover do GitHub
./config.sh remove --token SEU_TOKEN

# Deletar pasta
cd ..
rm -rf /opt/github-runner
```

---

## 📝 Notas

- Runner roda com usuário `root` (cuidado com segurança!)
- Para produção, considere criar usuário dedicado
- Runner pode executar múltiplos jobs em paralelo (configurável)
- Logs ficam em `/opt/github-runner/_diag/`

---

**Pronto! Agora você tem deploy automático igual ao Azure DevOps!** 🚀
