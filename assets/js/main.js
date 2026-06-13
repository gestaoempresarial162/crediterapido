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
  initObrigadoPage();
});

// ---------- VALIDAÇÕES ----------

// Valida formato de e-mail
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).trim());
}

// Valida CPF (formato + dígitos verificadores)
function isValidCPF(cpf) {
  cpf = String(cpf).replace(/[^\d]/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // todos os dígitos iguais

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10))) return false;

  return true;
}

// Valida telefone brasileiro (10 ou 11 dígitos, com DDD)
function isValidPhone(phone) {
  const digits = String(phone).replace(/[^\d]/g, '');
  return digits.length === 10 || digits.length === 11;
}

// Máscara de CPF: 000.000.000-00
function maskCPF(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Máscara de telefone: (00) 00000-0000
function maskPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

// Exibe mensagem de erro abaixo de um campo
function showFieldError(input, message) {
  clearFieldError(input);
  input.style.borderColor = 'var(--color-error)';
  const error = document.createElement('div');
  error.className = 'field-error';
  error.style.color = 'var(--color-error)';
  error.style.fontSize = '0.8rem';
  error.style.marginTop = '0.3rem';
  error.textContent = message;
  input.parentElement.appendChild(error);
}

function clearFieldError(input) {
  input.style.borderColor = '';
  const existing = input.parentElement.querySelector('.field-error');
  if (existing) existing.remove();
}

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
let formStartTracked = false;
let formSubmitted = false;
let currentFormData = {};

function initLeadForm() {
  const form = document.getElementById('lead-form');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const nomeInput = document.getElementById('lead-nome');
  const emailInput = document.getElementById('lead-email');
  const telefoneInput = document.getElementById('lead-telefone');
  const cpfInput = document.getElementById('lead-cpf');

  // Aplica máscaras em tempo real
  if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
      e.target.value = maskCPF(e.target.value);
    });
  }
  if (telefoneInput) {
    telefoneInput.addEventListener('input', (e) => {
      e.target.value = maskPhone(e.target.value);
    });
  }

  // ---------- EVENTO: form_start (primeira interação) ----------
  const trackFormStart = () => {
    if (formStartTracked) return;
    formStartTracked = true;

    if (typeof gtag === 'function') {
      gtag('event', 'form_start', {
        modalidade: document.getElementById('lead-modalidade')?.value || ''
      });
    }
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push({ event: 'form_start' });
    }
  };

  [nomeInput, emailInput, telefoneInput, cpfInput].forEach(input => {
    if (input) input.addEventListener('focus', trackFormStart, { once: false });
  });

  // ---------- TRACKING DE ABANDONO (ao saltar a aba/fechar) ----------
  window.addEventListener('beforeunload', () => {
    if (formStartTracked && !formSubmitted) {
      registrarAbandono();
    }
  });

  // Também registra abandono se o usuário ficar 30s inativo após iniciar
  let abandonTimer = null;
  const resetAbandonTimer = () => {
    if (abandonTimer) clearTimeout(abandonTimer);
    if (formStartTracked && !formSubmitted) {
      abandonTimer = setTimeout(() => {
        registrarAbandono();
      }, 45000); // 45 segundos de inatividade
    }
  };
  [nomeInput, emailInput, telefoneInput, cpfInput].forEach(input => {
    if (input) input.addEventListener('input', resetAbandonTimer);
  });

  function registrarAbandono() {
    const data = {
      tipo: 'abandono',
      nome: nomeInput?.value || '',
      email: emailInput?.value || '',
      telefone: telefoneInput?.value || '',
      cpf: cpfInput?.value || '',
      modalidade: document.getElementById('lead-modalidade')?.value || '',
      modalidadeLabel: MODALIDADE_LABELS[document.getElementById('lead-modalidade')?.value] || '',
      dataEnvio: new Date().toLocaleString('pt-BR'),
      origem: window.location.pathname
    };

    // Só registra se a pessoa preencheu pelo menos nome ou e-mail
    if (!data.nome && !data.email) return;

    sendToGoogleSheets(data, 'abandono').catch(() => {});
  }

  // ---------- SUBMIT ----------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Limpa erros anteriores
    [nomeInput, emailInput, telefoneInput, cpfInput].forEach(input => {
      if (input) clearFieldError(input);
    });

    const modalidade = document.getElementById('lead-modalidade').value;
    if (!modalidade) {
      alert('Por favor, selecione o tipo de crédito que você procura.');
      return;
    }

    let valid = true;

    // Validação de e-mail
    if (!emailInput.value || !isValidEmail(emailInput.value)) {
      showFieldError(emailInput, 'Digite um e-mail válido.');
      valid = false;
    }

    // Validação de CPF
    if (cpfInput) {
      if (!cpfInput.value || !isValidCPF(cpfInput.value)) {
        showFieldError(cpfInput, 'Digite um CPF válido.');
        valid = false;
      }
    }

    // Validação de telefone
    if (!telefoneInput.value || !isValidPhone(telefoneInput.value)) {
      showFieldError(telefoneInput, 'Digite um telefone válido com DDD.');
      valid = false;
    }

    // Validação de nome
    if (!nomeInput.value || nomeInput.value.trim().length < 3) {
      showFieldError(nomeInput, 'Digite seu nome completo.');
      valid = false;
    }

    if (!valid) {
      // Rola até o primeiro campo com erro
      const firstError = form.querySelector('.field-error');
      if (firstError) {
        firstError.closest('.form-group')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const data = {
      nome: nomeInput.value.trim(),
      email: emailInput.value.trim(),
      telefone: telefoneInput.value.trim(),
      cpf: cpfInput ? cpfInput.value.trim() : '',
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
      await sendToGoogleSheets(data, 'lead');
    } catch (err) {
      console.error('Erro ao enviar para a planilha:', err);
      // Continua o fluxo mesmo se o envio falhar, para não travar a experiência do usuário.
    }

    formSubmitted = true;

    // Salva os dados temporariamente para a página /obrigado renderizar as ofertas
    try {
      sessionStorage.setItem('acheCreditoLead', JSON.stringify(data));
    } catch (e) {
      // sessionStorage pode falhar em alguns navegadores/modos privados — segue com query string
    }

    // Redireciona para a página de obrigado com a modalidade na URL
    window.location.href = 'obrigado.html?modalidade=' + encodeURIComponent(modalidade);
  });
}

function renderOffers(modalidade, container, leadInfo) {
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
      <a href="${oferta.link}" class="btn offer-link" target="_blank" rel="noopener sponsored" data-oferta="${oferta.nome}" data-modalidade="${modalidade}">Ver oferta</a>
    `;
    container.appendChild(div);
  });

  // Evento de clique em oferta (para remarketing/segmentação por parceiro)
  container.querySelectorAll('.offer-link').forEach(link => {
    link.addEventListener('click', () => {
      const oferta = link.dataset.oferta;
      const mod = link.dataset.modalidade;

      if (typeof gtag === 'function') {
        gtag('event', 'click_offer', {
          modalidade: mod,
          parceiro: oferta
        });
      }
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({ event: 'click_offer', modalidade: mod, parceiro: oferta });
      }

      // Registra o clique na planilha (aba "Cliques"), associando ao e-mail/CPF do lead
      if (leadInfo && (leadInfo.email || leadInfo.cpf)) {
        sendToGoogleSheets({
          nome: leadInfo.nome || '',
          email: leadInfo.email || '',
          cpf: leadInfo.cpf || '',
          telefone: leadInfo.telefone || '',
          modalidade: mod,
          modalidadeLabel: MODALIDADE_LABELS[mod] || mod,
          parceiro: oferta,
          dataEnvio: new Date().toLocaleString('pt-BR'),
          origem: window.location.pathname
        }, 'click_offer').catch(() => {});
      }
    });
  });
}

// ---------- PÁGINA /obrigado ----------
function initObrigadoPage() {
  const container = document.getElementById('obrigado-offers');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  let modalidade = params.get('modalidade') || '';
  let leadData = null;

  try {
    const stored = sessionStorage.getItem('acheCreditoLead');
    if (stored) leadData = JSON.parse(stored);
  } catch (e) {}

  if (leadData && leadData.modalidade) {
    modalidade = leadData.modalidade;
  }

  const modalidadeLabelEl = document.getElementById('obrigado-modalidade');
  if (modalidadeLabelEl) {
    modalidadeLabelEl.textContent = MODALIDADE_LABELS[modalidade] || 'crédito';
  }

  renderOffers(modalidade, container, leadData);

  // Evento de conversão principal (GA4 + GTM) na página de obrigado
  if (typeof gtag === 'function') {
    gtag('event', 'generate_lead', {
      modalidade: modalidade,
      valor_estimado: leadData?.valorDesejado || ''
    });
  }
  if (typeof dataLayer !== 'undefined') {
    dataLayer.push({ event: 'lead_conversion', modalidade: modalidade });
  }

  // Mantém o sessionStorage durante a sessão na página /obrigado,
  // para que cliques em ofertas possam ser associados ao e-mail/CPF do lead.
  // É removido automaticamente quando a aba/sessão é fechada (sessionStorage nativo).
}

// ---------- ENVIO PARA GOOGLE SHEETS ----------
async function sendToGoogleSheets(data, tipo) {
  if (!GOOGLE_SHEETS_ENDPOINT || GOOGLE_SHEETS_ENDPOINT.startsWith('COLE_AQUI')) {
    console.warn('GOOGLE_SHEETS_ENDPOINT não configurado. Veja INSTRUCOES.md');
    return;
  }

  const payload = Object.assign({}, data, { tipoRegistro: tipo || 'lead' });

  // Usamos no-cors + form-encoded porque Apps Script Web Apps
  // costumam ter problemas com preflight CORS em JSON.
  const formBody = new URLSearchParams(payload).toString();

  await fetch(GOOGLE_SHEETS_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody
  });
}
