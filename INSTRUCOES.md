# 📘 Guia — Ache Crédito (atualizado)

Este pacote já vem com **GA4, GTM e Apps Script configurados**. Abaixo está o que já está pronto, o que mudou nesta versão, e o que ainda falta fazer.

---

## ✅ Já configurado neste pacote

- **GA4**: ID `G-67699H2YEN` em todas as 17 páginas
- **GTM**: ID `GTM-KDW5CXD6` em todas as 17 páginas
- **Apps Script (planilha)**: URL já preenchida em `assets/js/main.js`

Se você precisar trocar qualquer um desses IDs no futuro, use "Find and replace" no editor do GitHub.

---

## 🆕 Novidades desta versão

### 1. Validação de formulário
O formulário (home e `/ofertas`) agora valida:
- **E-mail**: formato válido (precisa ter `@` e domínio)
- **CPF**: formato e dígitos verificadores (CPFs inválidos/fake são rejeitados)
- **Telefone**: precisa ter DDD + número (10 ou 11 dígitos)
- **Nome**: mínimo de 3 caracteres

Os campos de **CPF** e **Telefone** recebem máscara automática enquanto a pessoa digita.

Se algum campo estiver inválido, o formulário **não é enviado** e mostra uma mensagem de erro em vermelho abaixo do campo.

### 2. Nova página `/obrigado.html`
Depois que o formulário é enviado com sucesso:
1. Os dados são gravados na planilha (aba "Leads")
2. A pessoa é **redirecionada automaticamente** para `obrigado.html`
3. Nessa página: mensagem de confirmação, aviso sobre e-mail/opt-out, e as ofertas da modalidade escolhida
4. Essa página dispara o evento `generate_lead` no GA4/GTM — **é a página de conversão para configurar no Google Ads**

### 3. Eventos de rastreamento (GA4 / GTM / dataLayer)

| Evento | Quando dispara | Para que serve |
|---|---|---|
| `form_start` | Pessoa clica em qualquer campo do formulário (primeira vez) | Público de remarketing "iniciou mas não converteu" |
| `generate_lead` | Página `/obrigado` carrega (conversão concluída) | Conversão principal — configurar no Google Ads |
| `click_offer` | Pessoa clica em "Ver oferta" de um parceiro específico | Segmentação por produto/parceiro de interesse |

### 4. Aba "Abandonos" na planilha
Se a pessoa começar a preencher o formulário (nome ou e-mail) mas **fechar a aba ou ficar inativa por 45 segundos** sem enviar, os dados parciais são gravados automaticamente na aba **"Abandonos"** da planilha (criada automaticamente no primeiro registro).

Use essa lista para campanhas de remarketing/recuperação (ex: e-mail "ficou alguma dúvida no seu pedido de crédito?").

### 4b. Aba "Cliques" na planilha
Quando a pessoa, já na página `/obrigado`, clica em "Ver oferta" de algum parceiro, é criada uma linha na aba **"Cliques"** com: nome, e-mail, CPF, telefone, modalidade, nome do parceiro clicado e data/hora.

Use essa aba para saber em qual produto cada lead demonstrou interesse — ótimo para e-mail marketing segmentado (ex: "vimos que você se interessou pelo Banco PAN FGTS...").

Para cruzar com a aba "Leads", filtre/procure pelo mesmo e-mail ou CPF em ambas as abas (ex: usando `QUERY` ou `FILTER` no Google Sheets).

### 5. Campo CPF no formulário
Adicionado em ambos os formulários (home e `/ofertas`). É enviado para a planilha junto com os demais dados.

---

## ⚠️ Ação necessária: recolar o Apps Script

Como o `google-apps-script.gs` foi atualizado (agora suporta 2 abas: Leads e Abandonos, e o campo CPF), você precisa **atualizar o script na sua planilha**:

1. Abra sua planilha → **Extensões → Apps Script**
2. **Apague todo o conteúdo** do arquivo `Código.gs`
3. **Cole o novo conteúdo** do arquivo `google-apps-script.gs` (deste pacote)
4. Salve (ícone de disquete)
5. Clique em **Deploy → Manage deployments**
6. Clique no ícone de lápis (editar) na implantação existente
7. Em "Version", selecione **"New version"**
8. Clique em **Deploy**

Você não precisa gerar uma nova URL — a mesma URL continua funcionando, só o código por trás é atualizado.

---

## Configurar o Google Ads para remarketing e conversão (depois de publicar)

Isso é feito direto na plataforma do Google Ads, sem precisar editar código:

### A) Marcar /obrigado.html como conversão
1. No Google Ads, vá em Ferramentas → Conversões
2. Crie uma conversão "Importar do Google Analytics" e selecione o evento generate_lead
3. Associe ao GA4 (que já está conectado via G-67699H2YEN)

### B) Criar público de remarketing "abandonou formulário"
1. No GA4, vá em Configurar → Públicos
2. Crie um público com a condição: evento form_start ACONTECEU e evento generate_lead NÃO ACONTECEU
3. Em Admin → Vínculos do produto → Google Ads, conecte sua conta do Google Ads
4. O público criado no GA4 fica disponível para campanhas no Google Ads

### C) Segmentar por produto de interesse (click_offer)
Use o parâmetro parceiro do evento click_offer para criar públicos específicos (ex: "interessados em FGTS") e campanhas direcionadas.

---

## Personalizar links de ofertas (afiliados)

No arquivo assets/js/main.js, dentro do objeto OFERTAS, cada modalidade tem links "#" de exemplo. Substitua pelos links reais de afiliados conforme for sendo aprovado nos programas (veja mapeamento-afiliados.md).

```js
const OFERTAS = {
  fgts: [
    { nome: "Banco PAN FGTS", desc: "...", link: "https://seu-link-de-afiliado.com" }
  ]
};
```

---

## Checklist final antes de divulgar

- [x] GA4 configurado (G-67699H2YEN)
- [x] GTM configurado (GTM-KDW5CXD6)
- [x] Apps Script — URL conectada
- [ ] Apps Script — código atualizado (ver seção "Ação necessária" acima)
- [ ] Testar envio do formulário (verificar aba "Leads" na planilha)
- [ ] Testar abandono (preencher nome/e-mail, fechar aba, verificar aba "Abandonos")
- [ ] Links de ofertas atualizados com parceiros reais/afiliados
- [ ] Configurar conversão generate_lead no Google Ads
- [ ] Configurar público de remarketing no GA4
- [ ] Solicitação enviada ao Google AdSense

---

## Estrutura de arquivos entregue

```
achecredito-v2/
├── index.html
├── ofertas.html
├── obrigado.html               (NOVO - pagina de conversao)
├── emprestimo-pessoal.html
├── cartao-de-credito.html
├── educacao-financeira.html
├── blog.html
├── sobre.html
├── contato.html
├── politica-de-privacidade.html (atualizada: CPF, opt-out, remarketing)
├── termos-de-uso.html
├── robots.txt
├── sitemap.xml
├── google-apps-script.gs        (ATUALIZADO - 2 abas: Leads e Abandonos)
├── INSTRUCOES.md
├── artigos/
│   ├── como-funciona-simulador-de-taxas.html
│   ├── quitar-dividas-vale-mais-a-pena.html
│   ├── educacao-financeira-nao-entrar-em-dividas.html
│   ├── credito-consignado-vale-a-pena.html
│   ├── score-credito-como-melhorar.html
│   └── cartao-credito-uso-consciente.html
└── assets/
    ├── css/style.css
    └── js/main.js                (ATUALIZADO - validacoes, eventos, redirect)
```
