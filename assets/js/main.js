// ============================================
// ACHE CRÉDITO — Main JS
// ============================================

/* ---------- CONFIG ----------
   Cole aqui a URL do seu Google Apps Script (Web App)
   depois de seguir o tutorial em /INSTRUCOES.md
-------------------------------------------------- */
const GOOGLE_SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbzzAdn_kKOr8eLchbZAX8300JWpaWSeFd5NDAiYLj86b_sCVbS1P1x8vF4dsR0-TeP3NA/exec";

// ---------- MENU MOBILE ----------
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  initSimulator();
  initLeadForm();
  initFAQ();
  initModalitySelector();
});

// ---------- FAQ ACCORDION ----------
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-question');
    if (!q) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

// ---------- SIMULADOR DE TAXAS ----------
function initSimulator() {
  const valorInput = document.getElementById('sim-valor');
  const valorDisplay = document.getElementById('sim-valor-display');
  const prazoInput = document.getElementById('sim-prazo');
  const prazoDisplay = document.getElementById('sim-prazo-display');
  const tipoSelect = document.getElementById('sim-tipo');
  const form = document.getElementById('simulator-form');
  const result = document.getElementById('sim-result');

  if (!form) return;

  // Taxas mensais médias de referência por modalidade (apenas ilustrativo)
  const taxas = {
    cartao: 0.1245,
    pessoal: 0.0399,
    consignado: 0.0179,
    fgts: 0.0149,
    imobiliario: 0.0089,
    refinanciamento: 0.0249,
    empresarial: 0.0299
  };
   
  function updateDisplays() {
    if (valorDisplay) {
      valorDisplay.textContent = Number(valorInput.value).toLocaleString('pt-BR', {
        style: 'currency', currency: 'BRL', minimumFractionDigits: 0
      });
    }
    if (prazoDisplay) {
      prazoDisplay.textContent = prazoInput.value + 'x';
    }
  }

  if (valorInput) valorInput.addEventListener('input', updateDisplays);
  if (prazoInput) prazoInput.addEventListener('input', updateDisplays);
  updateDisplays();

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const valor = parseFloat(valorInput.value);
    const prazo = parseInt(prazoInput.value, 10);
    const tipo = tipoSelect.value;
    const taxaMensal = taxas[tipo] || 0.035;

    // Cálculo de parcela fixa (tabela price simplificada)
    const parcela = (valor * taxaMensal) / (1 - Math.pow(1 + taxaMensal, -prazo));
    const total = parcela * prazo;
    const cet = ((total / valor) - 1) * 100;

    document.getElementById('sim-parcela').textContent = parcela.toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL'
    });
    document.getElementById('sim-total').textContent = total.toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL'
    });
    document.getElementById('sim-taxa').textContent = (taxaMensal * 100).toFixed(2).replace('.', ',') + '% a.m.';

    // Score estimado (ilustrativo, baseado em valor x prazo)
    let score = 95 - (prazo / 96) * 35 - (valor / 50000) * 15;
    score = Math.max(40, Math.min(98, Math.round(score)));

    document.getElementById('sim-score-value').textContent = score + '%';
    const scoreFill = document.getElementById('sim-score-fill');
    setTimeout(() => { scoreFill.style.width = score + '%'; }, 100);

    result.classList.add('active');
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

// ---------- SELETOR DE MODALIDADE (página de ofertas) ----------
function initModalitySelector() {
  const cards = document.querySelectorAll('.modality-card');
  const hiddenInput = document.getElementById('lead-modalidade');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      if (hiddenInput) hiddenInput.value = card.dataset.modalidade;
    });
  });
}

// ---------- OFERTAS POR MODALIDADE ----------
const OFERTAS = {
  cartao: [
    { nome: "Cartão de Crédito Caixa Simples", desc: "Sem anuidade, aprovação facilitada.", link: "#" },
    { nome: "Cartão Pan Atmosfera", desc: "Renda mínima não exigida.", link: "#" },
    { nome: "Nubank Ultravioleta", desc: "Cashback e benefícios exclusivos.", link: "#" }
  ],
  pessoal: [
    { nome: "Crefisa Empréstimo Pessoal", desc: "Pré-aprovação em minutos, sem burocracia.", link: "#" },
    { nome: "Banco PAN - Crédito Pessoal", desc: "Parcelas fixas e simulação 100% online.", link: "#" },
    { nome: "BV Financeira", desc: "Liberação rápida para diversos perfis.", link: "#" }
  ],
  consignado: [
    { nome: "INSS Crédito Consignado", desc: "Para aposentados e pensionistas.", link: "#" },
    { nome: "Consignado Banco do Brasil", desc: "Para servidores públicos e privados.", link: "#" },
    { nome: "Crédito Consignado Caixa", desc: "Desconto direto na folha, taxas baixas.", link: "#" }
  ],
  fgts: [
    { nome: "Crefisa Antecipação FGTS", desc: "Antecipe até 10 parcelas do saque-aniversário.", link: "#" },
    { nome: "Banco PAN FGTS", desc: "Contratação 100% digital, sem consulta a SPC/Serasa.", link: "#" },
    { nome: "C6 Bank Saque-Aniversário", desc: "Use seu FGTS como garantia com taxas reduzidas.", link: "#" }
  ],
  imobiliario: [
    { nome: "Itaú Crédito Imobiliário", desc: "Financiamento com taxas a partir de 0,89% a.m.", link: "#" },
    { nome: "Caixa Habitação", desc: "Condições especiais para o primeiro imóvel.", link: "#" },
    { nome: "Inter Home Equity", desc: "Use seu imóvel como garantia para crédito.", link: "#" }
  ],
  refinanciamento: [
    { nome: "Refin Itaú", desc: "Refinancie dívidas com taxas reduzidas.", link: "#" },
    { nome: "Creditas Refinanciamento", desc: "Use seu imóvel ou veículo como garantia.", link: "#" },
    { nome: "Santander Refin Total", desc: "Consolide todas as suas dívidas em uma só.", link: "#" }
  ],
  negativados: [
    { nome: "Crédito para Negativados - Lendico", desc: "Análise de crédito alternativa.", link: "#" },
    { nome: "Geru Empréstimo", desc: "Opções para quem tem restrição no nome.", link: "#" },
    { nome: "Money Plus", desc: "Avaliação personalizada do seu perfil.", link: "#" }
  ],
  empresarial: [
    { nome: "Capital de Giro Sicredi", desc: "Crédito para fluxo de caixa do seu negócio.", link: "#" },
    { nome: "BNDES Crédito PME", desc: "Linhas especiais para pequenas empresas.", link: "#" },
    { nome: "Stone Crédito Empresarial", desc: "Antecipação de recebíveis e capital de giro.", link: "#" }
  ]
};
const MODALIDADE_LABELS = {
  cartao: "Cartão de Crédito",
  pessoal: "Empréstimo Pessoal",
  consignado: "Crédito Consignado",
  fgts: "Empréstimo com Garantia do FGTS",
  imobiliario: "Financiamento Imobiliário",
  refinanciamento: "Refinanciamento de Dívidas",
  negativados: "Crédito para Negativados",
  empresarial: "Crédito Empresarial"
};
// ---------- FORMULÁRIO DE LEAD ----------
function initLeadForm() {
  const form = document.getElementById('lead-form');
  if (!form) return;

  const successBox = document.getElementById('form-success');
  const offersList = document.getElementById('offers-list');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const modalidade = document.getElementById('lead-modalidade').value;
    if (!modalidade) {
      alert('Por favor, selecione o tipo de crédito que você procura.');
      return;
    }

    const data = {
      nome: document.getElementById('lead-nome').value,
      email: document.getElementById('lead-email').value,
      telefone: document.getElementById('lead-telefone').value,
      cidade: document.getElementById('lead-cidade')?.value || '',
      valorDesejado: document.getElementById('lead-valor')?.value || '',
      modalidade: modalidade,
      modalidadeLabel: MODALIDADE_LABELS[modalidade] || modalidade,
      dataEnvio: new Date().toLocaleString('pt-BR'),
      origem: window.location.pathname
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
      await sendToGoogleSheets(data);
    } catch (err) {
      console.error('Erro ao enviar para a planilha:', err);
      // Continua o fluxo mesmo se o envio falhar, para não travar a experiência do usuário.
    }

    // Disparo de evento para GA4 / GTM (conversão de lead)
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', {
        modalidade: data.modalidade,
        valor_estimado: data.valorDesejado
      });
    }
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push({ event: 'lead_form_submit', modalidade: data.modalidade });
    }

    // Mostrar ofertas correspondentes
    renderOffers(modalidade, offersList);

    form.style.display = 'none';
    successBox.classList.add('active');

    submitBtn.disabled = false;
    submitBtn.textContent = 'Ver minhas ofertas';
  });
}

function renderOffers(modalidade, container) {
  const ofertas = OFERTAS[modalidade] || [];
  container.innerHTML = '';
  ofertas.forEach(oferta => {
    const div = document.createElement('div');
    div.className = 'offer-item';
    div.innerHTML = `
      <div>
        <div class="offer-name">${oferta.nome}</div>
        <div class="offer-desc">${oferta.desc}</div>
      </div>
      <a href="${oferta.link}" class="btn" target="_blank" rel="noopener sponsored">Ver oferta</a>
    `;
    container.appendChild(div);
  });
}

// ---------- ENVIO PARA GOOGLE SHEETS ----------
async function sendToGoogleSheets(data) {
  if (!GOOGLE_SHEETS_ENDPOINT || GOOGLE_SHEETS_ENDPOINT.startsWith('COLE_AQUI')) {
    console.warn('GOOGLE_SHEETS_ENDPOINT não configurado. Veja INSTRUCOES.md');
    return;
  }

  // Usamos no-cors + form-encoded porque Apps Script Web Apps
  // costumam ter problemas com preflight CORS em JSON.
  const formBody = new URLSearchParams(data).toString();

  await fetch(GOOGLE_SHEETS_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody
  });
}
