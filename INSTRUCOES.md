# 📘 Guia de Publicação — Ache Crédito

Este guia te leva do zero até o site no ar em **www.achecredito.com.br**, mesmo sem experiência técnica. Siga na ordem.

---

## 1. Conectar o formulário à planilha do Google (Apps Script)

Isso faz com que cada envio do formulário crie uma nova linha automaticamente na sua planilha.

1. Abra sua planilha: https://docs.google.com/spreadsheets/d/1vlSCTbZxUChfTx8vbwOxvAV1PMpldEQBh4un04LEvNI/edit
2. No menu, clique em **Extensões → Apps Script**.
3. Apague qualquer código que esteja lá e **cole todo o conteúdo do arquivo `google-apps-script.gs`** (está na pasta do site).
4. Clique no ícone de **disquete (salvar)**.
5. Clique em **Implantar → Nova implantação**.
6. Em "Selecionar tipo", clique no ícone de engrenagem e escolha **App da Web**.
7. Configure:
   - **Executar como:** Eu (seu e-mail)
   - **Quem pode acessar:** Qualquer pessoa
8. Clique em **Implantar**.
9. O Google vai pedir autorização — clique em **Autorizar acesso**, escolha sua conta e confirme (pode aparecer um aviso de "app não verificado": clique em **Avançado → Acessar [seu projeto] (não seguro)**, é normal para scripts pessoais).
10. Copie a **URL do app da Web** gerada (algo como `https://script.google.com/macros/s/AKfycb.../exec`).

11. Abra o arquivo `assets/js/main.js` no GitHub e localize a linha:
    ```js
    const GOOGLE_SHEETS_ENDPOINT = "COLE_AQUI_A_URL_DO_SEU_APPS_SCRIPT";
    ```
12. Substitua o texto entre aspas pela URL que você copiou. Salve o arquivo.

✅ Pronto — toda vez que alguém enviar o formulário, uma nova linha será criada na aba "Leads" da sua planilha.

---

## 2. Criar conta no GA4 (Google Analytics 4)

1. Acesse https://analytics.google.com/
2. Crie uma conta e uma propriedade para "Ache Crédito" (site: www.achecredito.com.br).
3. Ao final, o Google vai te dar um **ID de medição**, no formato `G-XXXXXXXXXX`.
4. Em **todas as páginas HTML do site**, substitua as duas ocorrências de `G-XXXXXXXXXX` por esse ID.
   - Dica: use a função de "Buscar e substituir em todos os arquivos" do editor do GitHub ou VS Code.

---

## 3. Criar conta no Google Tag Manager (GTM)

1. Acesse https://tagmanager.google.com/
2. Crie uma conta e um contêiner do tipo "Web" para www.achecredito.com.br.
3. Você vai receber um ID no formato `GTM-XXXXXXX`.
4. Substitua **todas as ocorrências** de `GTM-XXXXXXX` (são 2 por página: uma no `<head>` e uma no `<body>`) pelo seu ID real.

---

## 4. Publicar o site (recomendado: Netlify — grátis e fácil)

### Opção A — Netlify (mais simples para quem não é dev)

1. Acesse https://app.netlify.com/ e crie uma conta gratuita (pode usar login do GitHub).
2. Na tela inicial, clique em **"Add new site" → "Deploy manually"**.
3. Baixe a pasta completa do site (todos os arquivos que eu gerei) para o seu computador.
4. Arraste a pasta inteira para a área indicada no Netlify.
5. Em poucos segundos, o site estará no ar em um endereço temporário (algo como `nome-aleatorio.netlify.app`).
6. Para usar seu domínio:
   - No painel do Netlify, vá em **Site settings → Domain management → Add a domain** e digite `www.achecredito.com.br`.
   - O Netlify vai te dar registros DNS (geralmente um registro `CNAME` ou `A`).
   - Acesse o painel do seu registrador de domínio (onde você comprou o achecredito.com.br) e configure esses registros conforme indicado pelo Netlify.
   - A propagação pode levar algumas horas.

### Opção B — Continuar usando o GitHub (GitHub Pages)

1. No seu repositório atual, **apague todos os arquivos antigos**.
2. Faça upload de todos os arquivos novos (mantendo a estrutura de pastas: `assets/`, `artigos/`, e os arquivos `.html` na raiz).
3. Vá em **Settings → Pages**.
4. Em "Source", selecione a branch principal (geralmente `main`) e a pasta raiz (`/`).
5. Salve. O GitHub vai gerar uma URL tipo `seuusuario.github.io/seurepo`.
6. Para usar seu domínio:
   - Crie um arquivo chamado `CNAME` (sem extensão) na raiz do repositório, contendo apenas: `www.achecredito.com.br`
   - No painel DNS do seu domínio, crie um registro `CNAME` apontando `www` para `seuusuario.github.io`.

---

## 5. Configurar Google AdSense

1. Acesse https://www.google.com/adsense/
2. Adicione o site `www.achecredito.com.br`.
3. O AdSense vai te dar um snippet de código (`<script ... data-ad-client="ca-pub-XXXX">`).
4. Cole esse snippet dentro da tag `<head>` de **todas as páginas HTML** (logo após a tag `<link rel="stylesheet"...>`).
5. Aguarde a revisão do Google (pode levar de alguns dias a algumas semanas).

**Importante para aprovação:**
- O site já está com conteúdo original, política de privacidade, termos de uso e páginas institucionais — itens exigidos pelo AdSense.
- Tenha tráfego orgânico real (não use bots ou cliques artificiais — isso causa banimento permanente).
- Após publicar, continue adicionando novos artigos periodicamente.

---

## 6. Personalizar links de ofertas

No arquivo `assets/js/main.js`, dentro do objeto `OFERTAS`, cada modalidade tem links `"#"` de exemplo. Substitua pelos links reais de afiliados/parceiros que você for utilizando (programas de afiliados de bancos, fintechs, etc.).

```js
const OFERTAS = {
  pessoal: [
    { nome: "Nome do Parceiro", desc: "Descrição da oferta", link: "https://link-do-afiliado.com" },
    ...
  ],
  ...
};
```

---

## 7. Checklist final antes de divulgar

- [ ] GA4 configurado (substituí `G-XXXXXXXXXX` em todas as páginas)
- [ ] GTM configurado (substituí `GTM-XXXXXXX` em todas as páginas, 2x cada)
- [ ] Apps Script conectado e testado (enviei um teste pelo formulário e verifiquei a planilha)
- [ ] Links de ofertas atualizados com parceiros reais
- [ ] Site publicado e domínio apontando corretamente
- [ ] robots.txt e sitemap.xml acessíveis em /robots.txt e /sitemap.xml
- [ ] Solicitação enviada ao Google AdSense

---

## Estrutura de arquivos entregue

```
achecredito/
├── index.html                 (Homepage com simulador)
├── ofertas.html                (Página do formulário de leads)
├── emprestimo-pessoal.html
├── cartao-de-credito.html
├── educacao-financeira.html
├── blog.html
├── sobre.html
├── contato.html
├── politica-de-privacidade.html
├── termos-de-uso.html
├── robots.txt
├── sitemap.xml
├── google-apps-script.gs       (cole no Apps Script da planilha)
├── INSTRUCOES.md               (este arquivo)
├── artigos/
│   ├── como-funciona-simulador-de-taxas.html
│   ├── quitar-dividas-vale-mais-a-pena.html
│   ├── educacao-financeira-nao-entrar-em-dividas.html
│   ├── credito-consignado-vale-a-pena.html
│   ├── score-credito-como-melhorar.html
│   └── cartao-credito-uso-consciente.html
└── assets/
    ├── css/style.css
    └── js/main.js
```
