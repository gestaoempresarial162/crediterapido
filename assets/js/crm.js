// ═══════════════════════════════════════════════════════
// CréditoRápido — CRM
// Envia leads para Google Sheets via Apps Script
// ═══════════════════════════════════════════════════════

const CRM = (() => {

  // ✅ Substitua pela URL do seu Google Apps Script (Passo 5)
  const APPS_SCRIPT_URL = 'COLE_SUA_URL_AQUI';

  // ── Envia lead para o Google Sheets ─────────────────
  async function capturar(dados, origem = 'desconhecida') {
    const payload = {
      ...dados,
      origem,
      pagina: location.pathname,
      data: new Date().toISOString(),
    };

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('CRM: erro ao enviar lead', err);
    }

    return payload;
  }

  // ── Roteamento pós-simulação ─────────────────────────
  // Taxa >= 5% a.m. | Valor <= 3000 | INSS/autônomo → Artigo 1
  // Demais perfis → Artigo 2
  function rotearArtigo(valor, taxa, renda) {
    const rendaNegativado = /aposentado|inss|aut|mei/i.test(renda || '');
    const negativadoProvavel = taxa >= 5 || valor <= 3000 || rendaNegativado;
    if (negativadoProvavel) {
      return { url: '/blog/emprestimo-com-nome-sujo/', label: 'Empréstimo com nome sujo' };
    }
    return { url: '/blog/como-aumentar-score/', label: 'Como aumentar seu score' };
  }

  return { capturar, rotearArtigo };
})();
