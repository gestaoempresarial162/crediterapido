#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════
CréditoRápido — Publicador Automático de Artigos
═══════════════════════════════════════════════════════════════
Como usar:
  1. Instale: pip install requests
  2. Preencha GITHUB_TOKEN e REPO abaixo
  3. Rode: python3 publicar_artigo.py

O script:
  - Recebe o HTML do artigo (gerado pelo Claude)
  - Sobe direto no repositório GitHub
  - Netlify detecta e publica em ~30 segundos
  - Sem precisar abrir o computador ou fazer FTP
═══════════════════════════════════════════════════════════════
"""

import requests
import base64
import json
import re
import sys
from datetime import datetime

# ── CONFIGURAÇÕES (preencha uma vez) ────────────────────────────
GITHUB_TOKEN = 'COLE_SEU_TOKEN_AQUI'   # github.com/settings/tokens → New token → repo
REPO         = 'gestaoempresarial162/crediterapido'
BRANCH       = 'main'
# ────────────────────────────────────────────────────────────────

HEADERS = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept': 'application/vnd.github.v3+json',
}

def slugify(titulo):
    """Converte título em slug URL-friendly."""
    slug = titulo.lower()
    slug = re.sub(r'[áàãâä]', 'a', slug)
    slug = re.sub(r'[éèêë]', 'e', slug)
    slug = re.sub(r'[íìîï]', 'i', slug)
    slug = re.sub(r'[óòõôö]', 'o', slug)
    slug = re.sub(r'[úùûü]', 'u', slug)
    slug = re.sub(r'[ç]', 'c', slug)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'\s+', '-', slug.strip())
    return slug[:80]

def publicar_artigo(titulo, html_conteudo, descricao=''):
    """
    Publica um artigo no GitHub → Netlify publica automaticamente.

    Args:
        titulo: Título do artigo (ex: "Como aumentar seu score em 2025")
        html_conteudo: HTML completo do artigo
        descricao: Meta description para SEO
    """
    slug = slugify(titulo)
    caminho = f'blog/{slug}.html'
    data_hoje = datetime.now().strftime('%d/%m/%Y')

    # Wrap em template completo se não tiver DOCTYPE
    if '<!DOCTYPE' not in html_conteudo:
        html_conteudo = gerar_template(titulo, descricao, html_conteudo, data_hoje)

    # Verifica se arquivo já existe (para fazer update em vez de create)
    url_check = f'https://api.github.com/repos/{REPO}/contents/{caminho}'
    r = requests.get(url_check, headers=HEADERS)
    sha = r.json().get('sha') if r.status_code == 200 else None

    # Codifica conteúdo em base64
    conteudo_b64 = base64.b64encode(html_conteudo.encode('utf-8')).decode('utf-8')

    payload = {
        'message': f'artigo: {titulo[:60]} [{data_hoje}]',
        'content': conteudo_b64,
        'branch': BRANCH,
    }
    if sha:
        payload['sha'] = sha  # necessário para update

    r = requests.put(url_check, headers=HEADERS, data=json.dumps(payload))

    if r.status_code in (200, 201):
        acao = 'atualizado' if sha else 'publicado'
        url_final = f'https://crediterapido.netlify.app/blog/{slug}'
        print(f'\n✅ Artigo {acao} com sucesso!')
        print(f'   URL: {url_final}')
        print(f'   GitHub: https://github.com/{REPO}/blob/{BRANCH}/{caminho}')
        print(f'   O Netlify publica em ~30 segundos.\n')
        return url_final
    else:
        print(f'\n❌ Erro ao publicar: {r.status_code}')
        print(r.json().get('message', ''))
        return None

def gerar_template(titulo, descricao, conteudo_html, data_hoje):
    """Envolve o conteúdo do artigo em um template HTML completo."""
    return f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{titulo} | CréditoRápido</title>
<meta name="description" content="{descricao or titulo}">
<link rel="canonical" href="https://www.crediterapido.com.br/blog/{slugify(titulo)}/">
<meta property="og:title" content="{titulo}">
<meta property="og:description" content="{descricao or titulo}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
<style>
  :root {{ --verde:#00C875; --azul:#0A1628; --cinza:#8A9BB0; }}
  *{{ box-sizing:border-box; margin:0; padding:0; }}
  body{{ font-family:'DM Sans',sans-serif; background:#fff; color:#1a1a2e; line-height:1.75; }}
  nav{{ display:flex; justify-content:space-between; align-items:center; padding:16px 40px; background:var(--azul); position:sticky; top:0; z-index:100; }}
  .logo{{ font-family:'Syne',sans-serif; font-weight:800; font-size:20px; color:#F4F8FF; text-decoration:none; }}
  .logo span{{ color:var(--verde); }}
  .nav-cta{{ background:var(--verde); color:var(--azul); padding:8px 20px; border-radius:8px; font-weight:700; font-size:13px; text-decoration:none; }}
  .article-wrap{{ max-width:780px; margin:0 auto; padding:48px 24px 80px; }}
  h1{{ font-family:'Syne',sans-serif; font-size:clamp(26px,4vw,38px); font-weight:800; letter-spacing:-.02em; line-height:1.15; margin-bottom:20px; color:#0A1628; }}
  h2{{ font-family:'Syne',sans-serif; font-size:clamp(20px,3vw,26px); font-weight:700; margin:36px 0 14px; color:#0A1628; }}
  h3{{ font-family:'Syne',sans-serif; font-size:18px; font-weight:700; margin:24px 0 10px; color:#0A1628; }}
  p{{ margin-bottom:16px; font-size:16px; color:#2d2d4e; }}
  ul,ol{{ margin:0 0 16px 24px; }}
  li{{ margin-bottom:8px; font-size:15px; color:#2d2d4e; }}
  a{{ color:var(--verde); }}
  strong{{ color:#0A1628; }}
  footer{{ background:var(--azul); color:#7A8FA8; text-align:center; padding:32px; font-size:13px; margin-top:60px; }}
  footer a{{ color:var(--cinza); text-decoration:none; margin:0 12px; }}
</style>
</head>
<body>
<nav>
  <a href="/" class="logo">crédito<span>rápido</span></a>
  <a href="/simulador-emprestimo/" class="nav-cta">Simular grátis →</a>
</nav>
<div class="article-wrap">
  <p style="font-size:13px;color:#888;margin-bottom:24px;">
    <a href="/" style="color:#888;">Início</a> &rsaquo;
    <a href="/blog/" style="color:#888;">Blog</a> &rsaquo;
    <span>{titulo[:50]}</span>
  </p>
  <p style="font-size:13px;color:#666;margin-bottom:16px;">📅 Publicado em {data_hoje} · ⏱️ Leitura: ~8 minutos</p>
  {conteudo_html}
</div>
<footer>
  <a href="/">Início</a>
  <a href="/simulador-emprestimo/">Simulador</a>
  <a href="/blog/">Blog</a>
  <a href="/privacidade.html">Privacidade</a>
  <p style="margin-top:16px;">© 2025 CréditoRápido · Conteúdo informativo · Não somos instituição financeira</p>
</footer>
<script src="/assets/js/crm.js"></script>
<script>
// Registra visita ao artigo como touchpoint
CRM.capturar({}, 'artigo_blog');
</script>
</body>
</html>'''

# ── EXEMPLO DE USO ───────────────────────────────────────────────
if __name__ == '__main__':

    # Exemplo: publicar artigo gerado pelo Claude
    TITULO = 'Empréstimo Consignado: Guia Completo 2025'
    DESCRICAO = 'Tudo sobre empréstimo consignado: taxas, limites, como simular e contratar. Guia completo atualizado para 2025.'

    CONTEUDO_HTML = '''
    <!-- Cole aqui o HTML do artigo gerado pelo Claude -->
    <!-- Exemplo mínimo: -->
    <h1>Empréstimo Consignado: Guia Completo 2025</h1>
    <p>O empréstimo consignado é a modalidade com as menores taxas do mercado...</p>
    '''

    if GITHUB_TOKEN == 'COLE_SEU_TOKEN_AQUI':
        print('⚠️  Configure o GITHUB_TOKEN antes de usar.')
        print('   Acesse: github.com/settings/tokens → New token → marque "repo"')
        sys.exit(1)

    publicar_artigo(TITULO, CONTEUDO_HTML, DESCRICAO)
