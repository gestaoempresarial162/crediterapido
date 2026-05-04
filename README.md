# CréditoRápido — Guia de Setup Completo

## Arquitetura

```
Formulário / Simulador
    → Google Apps Script (API privada)
        → Google Sheets (sua planilha, só você acessa)

Claude gera artigo
    → publicar_artigo.py
        → GitHub API
            → Netlify (publica em ~30s automaticamente)
```

---

## PASSO 5 — Configurar Google Apps Script (CRM → Sheets)

### 5.1 Criar a planilha
1. Acesse [sheets.google.com](https://sheets.google.com)
2. Crie uma nova planilha → nomeie `CRM CréditoRápido`
3. Copie o **ID** da URL:
   ```
   https://docs.google.com/spreadsheets/d/ESTE_E_O_ID/edit
   ```

### 5.2 Criar o script
1. Acesse [script.google.com](https://script.google.com)
2. Clique em **Novo projeto**
3. Apague o código padrão
4. Copie TODO o conteúdo de `apps-script.js` e cole aqui
5. Na linha 1, substitua `COLE_O_ID_DA_SUA_PLANILHA_AQUI` pelo ID copiado acima
6. Clique em **Salvar** (ícone de disquete)

### 5.3 Implantar como Web App
1. Clique em **Implantar** → **Nova implantação**
2. Clique no ícone de engrenagem → **App da Web**
3. Configure:
   - **Executar como:** Eu (`seu@gmail.com`)
   - **Quem tem acesso:** Qualquer pessoa
4. Clique **Implantar**
5. Autorize as permissões quando solicitado
6. **Copie a URL gerada** (parece com: `https://script.google.com/macros/s/AKfy.../exec`)

### 5.4 Conectar ao site
Abra `assets/js/crm.js` e substitua:
```js
const APPS_SCRIPT_URL = 'COLE_SUA_URL_AQUI';
```
pela URL copiada no passo anterior.

---

## PASSO 6 — Subir arquivos no GitHub

### 6.1 Criar token de acesso
1. Acesse [github.com/settings/tokens](https://github.com/settings/tokens)
2. Clique **Generate new token (classic)**
3. Nome: `crediterapido-deploy`
4. Marque a opção **repo** (acesso completo ao repositório)
5. Clique **Generate token**
6. **Copie o token** — ele só aparece uma vez!

### 6.2 Subir os arquivos
Você pode fazer isso de duas formas:

**Opção A — Interface do GitHub (mais simples):**
1. Acesse `github.com/gestaoempresarial162/crediterapido`
2. Clique em **Add file → Upload files**
3. Arraste todos os arquivos desta pasta
4. Clique **Commit changes**

**Opção B — GitHub CLI (para automação):**
```bash
git clone https://github.com/gestaoempresarial162/crediterapido.git
cd crediterapido
# copie os arquivos para esta pasta
git add .
git commit -m "deploy inicial"
git push
```

---

## PASSO 7 — Publicar artigos automaticamente

### 7.1 Configurar o script
Abra `publicar_artigo.py` e preencha:
```python
GITHUB_TOKEN = 'seu_token_copiado_no_passo_6.1'
```

### 7.2 Instalar dependência
```bash
pip install requests
```

### 7.3 Publicar um artigo
```python
# Edite as variáveis no final do script:
TITULO = 'Título do artigo'
DESCRICAO = 'Meta description para o Google'
CONTEUDO_HTML = '''
  <h1>...</h1>
  <p>Conteúdo gerado pelo Claude...</p>
'''

# Rode:
python3 publicar_artigo.py
```

O artigo aparece em `https://crediterapido.netlify.app/blog/titulo-do-artigo/` em ~30 segundos.

---

## Segurança dos dados

| Camada | O que protege |
|--------|--------------|
| HTTPS (Netlify automático) | Dados em trânsito criptografados |
| Google Apps Script | Nenhuma chave de API exposta no site |
| CPF mascarado no Sheets | `123.***.***-00` — não armazena o número completo |
| Sem localStorage | Dados NÃO ficam no navegador do usuário |
| Planilha privada no Drive | Só você acessa com sua conta Google |
| `netlify.toml` | Bloqueia acesso ao painel CRM por URL direta |

---

## Checklist final antes do deploy

- [ ] ID da planilha em `apps-script.js`
- [ ] URL do Apps Script em `assets/js/crm.js`
- [ ] Publisher ID do AdSense em `index.html` e `simulador-emprestimo.html`
- [ ] Token do GitHub em `publicar_artigo.py`
- [ ] Domínio customizado configurado no Netlify (opcional)
- [ ] Submeter URL no Google Search Console após deploy
