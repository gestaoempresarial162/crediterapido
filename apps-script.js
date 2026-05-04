// ═══════════════════════════════════════════════════════════════════
// GOOGLE APPS SCRIPT — CréditoRápido CRM
// Cole este código em: script.google.com → Novo projeto
//
// INSTRUÇÕES:
// 1. Abra script.google.com
// 2. Apague o código padrão e cole TUDO abaixo
// 3. Clique "Implantar" → "Nova implantação"
// 4. Tipo: "App da Web"
// 5. Executar como: "Eu (sua conta)"
// 6. Quem tem acesso: "Qualquer pessoa"
// 7. Clique "Implantar" e copie a URL gerada
// 8. Cole essa URL em assets/js/crm.js onde diz COLE_SUA_URL_AQUI
// ═══════════════════════════════════════════════════════════════════

const SPREADSHEET_ID  = 'COLE_O_ID_DA_SUA_PLANILHA_AQUI';
const SHEET_LEADS     = 'Leads';
const SHEET_SIM       = 'Simulações';

const HEADERS_LEADS = [
  'ID','Data','Nome','CPF','Celular',
  'Valor Desejado','Tipo de Renda','Origem','Página','Status'
];
const HEADERS_SIM = [
  'ID','Data','Nome','CPF','Celular',
  'Valor Simulado','Prazo (meses)','Taxa (% a.m.)','1ª Parcela','Total a Pagar','Origem'
];

function inicializarPlanilha() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  let ls = ss.getSheetByName(SHEET_LEADS);
  if (!ls) {
    ls = ss.insertSheet(SHEET_LEADS);
    ls.getRange(1,1,1,HEADERS_LEADS.length).setValues([HEADERS_LEADS])
      .setBackground('#0A1628').setFontColor('#00C875').setFontWeight('bold');
    ls.setFrozenRows(1);
  }

  let ss2 = ss.getSheetByName(SHEET_SIM);
  if (!ss2) {
    ss2 = ss.insertSheet(SHEET_SIM);
    ss2.getRange(1,1,1,HEADERS_SIM.length).setValues([HEADERS_SIM])
      .setBackground('#0A1628').setFontColor('#00C875').setFontWeight('bold');
    ss2.setFrozenRows(1);
  }
}

function gerarId() {
  return 'lead_' + new Date().getTime();
}

function doPost(e) {
  try {
    inicializarPlanilha();
    const dados = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const id = gerarId();
    const ehSim = dados.origem === 'simulador' && dados.valorSimulado;

    if (ehSim) {
      ss.getSheetByName(SHEET_SIM).appendRow([
        id, agora,
        dados.nome||'', mascararCPF(dados.cpf||''), dados.celular||'',
        dados.valorSimulado||'', dados.prazo||'', dados.taxa||'',
        dados.parcela||'', dados.total||'', dados.origem||''
      ]);
    } else {
      const leadsSheet = ss.getSheetByName(SHEET_LEADS);
      const cpfLimpo = (dados.cpf||'').replace(/\D/g,'');
      if (cpfLimpo && cpfJaExiste(leadsSheet, cpfLimpo)) {
        atualizarUltimaInteracao(leadsSheet, cpfLimpo, agora);
        return resposta('atualizado');
      }
      leadsSheet.appendRow([
        id, agora,
        dados.nome||'', mascararCPF(dados.cpf||''), dados.celular||'',
        dados.valor||'', dados.renda||'', dados.origem||'',
        dados.pagina||'', 'Novo'
      ]);
    }
    return resposta('ok');
  } catch(err) {
    return resposta('erro: ' + err.message);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ status: 'ok', ts: new Date().toISOString() })
  ).setMimeType(ContentService.MimeType.JSON);
}

function resposta(msg) {
  return ContentService.createTextOutput(JSON.stringify({ resultado: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function mascararCPF(cpf) {
  const l = cpf.replace(/\D/g,'');
  if (l.length !== 11) return cpf;
  return l.slice(0,3) + '.***.***-' + l.slice(9);
}

function cpfJaExiste(sheet, cpfLimpo) {
  const dados = sheet.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][3]).replace(/\D/g,'') === cpfLimpo) return true;
  }
  return false;
}

function atualizarUltimaInteracao(sheet, cpfLimpo, agora) {
  const dados = sheet.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][3]).replace(/\D/g,'') === cpfLimpo) {
      sheet.getRange(i+1, 2).setValue(agora);
      return;
    }
  }
}
