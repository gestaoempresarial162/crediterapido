/**
 * APPS SCRIPT - Ache Crédito
 * ============================================================
 * Este script faz 2 coisas:
 *
 * 1) doPost(e) — recebe dados do formulário do site (via fetch)
 *    e grava em 3 abas: "Leads", "Abandonos", "Cliques".
 *    Também atualiza/cria a aba consolidada "CRM" (1 linha por CPF).
 *
 * 2) runEmailAutomation() — roda a cada 6 horas (trigger de tempo),
 *    verifica a aba "CRM" e envia e-mails automaticamente:
 *      - Lead que converteu E clicou numa oferta -> e-mail imediato com o link
 *      - Lead que converteu SEM clicar -> e-mail genérico em até 24h
 *      - Abandono (30h depois) -> Email 1 (recuperação)
 *      - Email 1 enviado, sem virar lead, 48h depois -> Email 2 (follow-up)
 *
 * Por padrão (USAR_IA = false), os e-mails usam TEMPLATES FIXOS revisados
 * (em HTML), sem depender de IA. Para usar o Gemini no lugar dos templates,
 * mude USAR_IA para true e configure GEMINI_API_KEY em Propriedades do Script.
 *
 * CONFIGURAÇÃO NECESSÁRIA (primeira vez):
 *  1. Cole este código no Apps Script da planilha (substitua tudo)
 *  2. Salve e faça o Deploy (New version) — veja INSTRUCOES.md
 *  3. Configure o trigger de tempo: rode a função setupTrigger() UMA VEZ
 *     manualmente (selecione no dropdown ao lado de "Run" e clique Run)
 *  4. (Opcional) Para usar IA: mude USAR_IA para true e adicione
 *     GEMINI_API_KEY em "Configurações do projeto" -> "Propriedades do script"
 * ============================================================
 */

// ---------- CONFIGURAÇÃO ----------
var REMETENTE_NOME = "Ache Crédito";
var SITE_URL = "https://www.achecredito.com.br";
var USAR_IA = false; // true = usa Gemini para gerar o corpo do e-mail; false = usa templates fixos revisados

var HORAS_ABANDONO_EMAIL1 = 30;
var HORAS_EMAIL1_EMAIL2 = 48;
var HORAS_LEAD_SEM_CLIQUE = 24;

// ============================================================
// PARTE 1 — RECEBIMENTO DE DADOS DO SITE
// ============================================================

function doPost(e) {
  var params = e.parameter;
  var tipo = params.tipoRegistro || 'lead';

  var sheetName = 'Leads';
  if (tipo === 'abandono') sheetName = 'Abandonos';
  if (tipo === 'click_offer') sheetName = 'Cliques';

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    if (tipo === 'abandono') {
      sheet.appendRow(["Data/Hora", "Nome", "E-mail", "Telefone", "CPF", "Modalidade", "Origem (página)"]);
    } else if (tipo === 'click_offer') {
      sheet.appendRow(["Data/Hora", "Nome", "E-mail", "CPF", "Telefone", "Modalidade", "Parceiro Clicado", "Origem (página)"]);
    } else {
      sheet.appendRow(["Data de Envio", "Nome", "E-mail", "Telefone", "CPF", "Cidade", "Valor Desejado", "Modalidade", "Origem (página)"]);
    }
  }

  var agora = new Date();

  if (tipo === 'abandono') {
    sheet.appendRow([
      params.dataEnvio || agora.toLocaleString('pt-BR'),
      params.nome || "", params.email || "", params.telefone || "",
      params.cpf || "", params.modalidadeLabel || params.modalidade || "", params.origem || ""
    ]);
  } else if (tipo === 'click_offer') {
    sheet.appendRow([
      params.dataEnvio || agora.toLocaleString('pt-BR'),
      params.nome || "", params.email || "", params.cpf || "", params.telefone || "",
      params.modalidadeLabel || params.modalidade || "", params.parceiro || "", params.origem || ""
    ]);
  } else {
    sheet.appendRow([
      params.dataEnvio || agora.toLocaleString('pt-BR'),
      params.nome || "", params.email || "", params.telefone || "",
      params.cpf || "", params.cidade || "", params.valorDesejado || "",
      params.modalidadeLabel || params.modalidade || "", params.origem || ""
    ]);
  }

  try {
    atualizarCRM(tipo, params, agora);
  } catch (err) {
    console.error('Erro ao atualizar CRM: ' + err);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success", tipo: tipo }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "API Ache Crédito ativa" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// PARTE 2 — ABA "CRM" CONSOLIDADA (1 linha por CPF)
// ============================================================

var CRM_COLS = {
  DATA_CADASTRO: 1, CPF: 2, NOME: 3, EMAIL: 4, TELEFONE: 5, MODALIDADE: 6,
  VIROU_LEAD: 7, EMPRESAS_INTERESSE: 8, STATUS_FUNIL: 9, DATA_ABANDONO: 10,
  EMAIL1_ENVIADO_EM: 11, EMAIL2_ENVIADO_EM: 12, OPTOUT: 13, DATA_OPTOUT: 14,
  EMAIL_BOUNCED: 15, OBSERVACOES: 16
};

var CRM_HEADERS = [
  "Data Cadastro", "CPF", "Nome", "E-mail", "Telefone", "Modalidade",
  "Virou Lead?", "Empresas de Interesse", "Status Funil", "Data Abandono",
  "Email 1 Enviado em", "Email 2 Enviado em", "Opt-out?", "Data Opt-out",
  "E-mail Bounced?", "Observações"
];

function getCRMSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('CRM');
  if (!sheet) {
    sheet = ss.insertSheet('CRM');
    sheet.appendRow(CRM_HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function encontrarLinhaPorCPF(sheet, cpf) {
  if (!cpf) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var cpfs = sheet.getRange(2, CRM_COLS.CPF, lastRow - 1, 1).getValues();
  for (var i = 0; i < cpfs.length; i++) {
    if (String(cpfs[i][0]).trim() === String(cpf).trim()) {
      return i + 2;
    }
  }
  return -1;
}

function atualizarCRM(tipo, params, agora) {
  var sheet = getCRMSheet();
  var cpf = params.cpf || "";
  var dataStr = agora.toLocaleString('pt-BR');

  if (!cpf) return;

  var linha = encontrarLinhaPorCPF(sheet, cpf);

  if (tipo === 'lead') {
    if (linha === -1) {
      var row = new Array(CRM_HEADERS.length).fill("");
      row[CRM_COLS.DATA_CADASTRO - 1] = dataStr;
      row[CRM_COLS.CPF - 1] = cpf;
      row[CRM_COLS.NOME - 1] = params.nome || "";
      row[CRM_COLS.EMAIL - 1] = params.email || "";
      row[CRM_COLS.TELEFONE - 1] = params.telefone || "";
      row[CRM_COLS.MODALIDADE - 1] = params.modalidadeLabel || params.modalidade || "";
      row[CRM_COLS.VIROU_LEAD - 1] = "Sim";
      row[CRM_COLS.STATUS_FUNIL - 1] = "Novo";
      sheet.appendRow(row);
    } else {
      sheet.getRange(linha, CRM_COLS.VIROU_LEAD).setValue("Sim");
      sheet.getRange(linha, CRM_COLS.NOME).setValue(params.nome || "");
      sheet.getRange(linha, CRM_COLS.EMAIL).setValue(params.email || "");
      sheet.getRange(linha, CRM_COLS.TELEFONE).setValue(params.telefone || "");
      sheet.getRange(linha, CRM_COLS.MODALIDADE).setValue(params.modalidadeLabel || params.modalidade || "");
      var statusAtual = sheet.getRange(linha, CRM_COLS.STATUS_FUNIL).getValue();
      if (!statusAtual || statusAtual === "Novo (Abandono)") {
        sheet.getRange(linha, CRM_COLS.STATUS_FUNIL).setValue("Novo");
      }
    }
  } else if (tipo === 'abandono') {
    if (linha === -1) {
      var rowA = new Array(CRM_HEADERS.length).fill("");
      rowA[CRM_COLS.DATA_CADASTRO - 1] = dataStr;
      rowA[CRM_COLS.CPF - 1] = cpf;
      rowA[CRM_COLS.NOME - 1] = params.nome || "";
      rowA[CRM_COLS.EMAIL - 1] = params.email || "";
      rowA[CRM_COLS.TELEFONE - 1] = params.telefone || "";
      rowA[CRM_COLS.MODALIDADE - 1] = params.modalidadeLabel || params.modalidade || "";
      rowA[CRM_COLS.VIROU_LEAD - 1] = "Não";
      rowA[CRM_COLS.STATUS_FUNIL - 1] = "Novo (Abandono)";
      rowA[CRM_COLS.DATA_ABANDONO - 1] = dataStr;
      sheet.appendRow(rowA);
    } else {
      var virouLead = sheet.getRange(linha, CRM_COLS.VIROU_LEAD).getValue();
      if (virouLead !== "Sim") {
        sheet.getRange(linha, CRM_COLS.DATA_ABANDONO).setValue(dataStr);
      }
    }
  } else if (tipo === 'click_offer') {
    if (linha === -1) {
      var rowC = new Array(CRM_HEADERS.length).fill("");
      rowC[CRM_COLS.DATA_CADASTRO - 1] = dataStr;
      rowC[CRM_COLS.CPF - 1] = cpf;
      rowC[CRM_COLS.NOME - 1] = params.nome || "";
      rowC[CRM_COLS.EMAIL - 1] = params.email || "";
      rowC[CRM_COLS.TELEFONE - 1] = params.telefone || "";
      rowC[CRM_COLS.MODALIDADE - 1] = params.modalidadeLabel || params.modalidade || "";
      rowC[CRM_COLS.VIROU_LEAD - 1] = "Sim";
      rowC[CRM_COLS.EMPRESAS_INTERESSE - 1] = params.parceiro || "";
      rowC[CRM_COLS.STATUS_FUNIL - 1] = "Novo";
      sheet.appendRow(rowC);
    } else {
      var atuais = String(sheet.getRange(linha, CRM_COLS.EMPRESAS_INTERESSE).getValue() || "");
      var novaEmpresa = params.parceiro || "";
      if (novaEmpresa && atuais.indexOf(novaEmpresa) === -1) {
        var atualizado = atuais ? (atuais + ", " + novaEmpresa) : novaEmpresa;
        sheet.getRange(linha, CRM_COLS.EMPRESAS_INTERESSE).setValue(atualizado);
      }
    }
  }
}

// ============================================================
// PARTE 3 — AUTOMAÇÃO DE E-MAILS (trigger de tempo, a cada 6h)
// ============================================================

function setupTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'runEmailAutomation') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('runEmailAutomation')
    .timeBased()
    .everyHours(6)
    .create();

  console.log('Trigger configurado: runEmailAutomation a cada 6 horas.');
}

function runEmailAutomation() {
  var sheet = getCRMSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var data = sheet.getRange(2, 1, lastRow - 1, CRM_HEADERS.length).getValues();
  var agora = new Date();

  for (var i = 0; i < data.length; i++) {
    var linha = i + 2;
    var row = data[i];

    var optout = row[CRM_COLS.OPTOUT - 1];
    if (optout === "Sim") continue;

    var cpf = row[CRM_COLS.CPF - 1];
    var nome = row[CRM_COLS.NOME - 1];
    var email = row[CRM_COLS.EMAIL - 1];
    var modalidade = row[CRM_COLS.MODALIDADE - 1];
    var virouLead = row[CRM_COLS.VIROU_LEAD - 1];
    var empresas = row[CRM_COLS.EMPRESAS_INTERESSE - 1];
    var dataAbandono = row[CRM_COLS.DATA_ABANDONO - 1];
    var email1Enviado = row[CRM_COLS.EMAIL1_ENVIADO_EM - 1];
    var email2Enviado = row[CRM_COLS.EMAIL2_ENVIADO_EM - 1];
    var dataCadastro = row[CRM_COLS.DATA_CADASTRO - 1];

    if (!email || !cpf) continue;

    try {
      if (virouLead === "Sim" && empresas && !email1Enviado) {
        var corpo = gerarEmailComIA('lead_com_interesse', { nome: nome, modalidade: modalidade, empresas: empresas });
        enviarEmail(email, 'Suas opções de crédito - Ache Crédito', corpo);
        sheet.getRange(linha, CRM_COLS.EMAIL1_ENVIADO_EM).setValue(agora.toLocaleString('pt-BR'));
        sheet.getRange(linha, CRM_COLS.STATUS_FUNIL).setValue('Email 1 Enviado');
        continue;
      }

      if (virouLead === "Sim" && !empresas && !email1Enviado) {
        var horasDesdeCadastro = horasEntre(parseDataBR(dataCadastro), agora);
        if (horasDesdeCadastro >= HORAS_LEAD_SEM_CLIQUE) {
          var corpoGenerico = gerarEmailComIA('lead_sem_interesse', { nome: nome, modalidade: modalidade });
          enviarEmail(email, 'Opções de crédito selecionadas para você - Ache Crédito', corpoGenerico);
          sheet.getRange(linha, CRM_COLS.EMAIL1_ENVIADO_EM).setValue(agora.toLocaleString('pt-BR'));
          sheet.getRange(linha, CRM_COLS.STATUS_FUNIL).setValue('Email 1 Enviado');
        }
        continue;
      }

      if (virouLead !== "Sim" && dataAbandono && !email1Enviado) {
        var horasDesdeAbandono = horasEntre(parseDataBR(dataAbandono), agora);
        if (horasDesdeAbandono >= HORAS_ABANDONO_EMAIL1) {
          var corpoRecuperacao = gerarEmailComIA('abandono_email1', { nome: nome, modalidade: modalidade });
          enviarEmail(email, 'Faltou pouco! Finalize sua simulação - Ache Crédito', corpoRecuperacao);
          sheet.getRange(linha, CRM_COLS.EMAIL1_ENVIADO_EM).setValue(agora.toLocaleString('pt-BR'));
          sheet.getRange(linha, CRM_COLS.STATUS_FUNIL).setValue('Email 1 Enviado');
        }
        continue;
      }

      if (virouLead !== "Sim" && email1Enviado && !email2Enviado) {
        var horasDesdeEmail1 = horasEntre(parseDataBR(email1Enviado), agora);
        if (horasDesdeEmail1 >= HORAS_EMAIL1_EMAIL2) {
          var corpoFollowup = gerarEmailComIA('followup_email2', { nome: nome, modalidade: modalidade });
          enviarEmail(email, 'Ainda dá tempo de simular seu crédito - Ache Crédito', corpoFollowup);
          sheet.getRange(linha, CRM_COLS.EMAIL2_ENVIADO_EM).setValue(agora.toLocaleString('pt-BR'));
          sheet.getRange(linha, CRM_COLS.STATUS_FUNIL).setValue('Email 2 Enviado');
        }
        continue;
      }

    } catch (err) {
      console.error('Erro ao processar linha ' + linha + ': ' + err);
    }
  }
}

function parseDataBR(str) {
  if (!str) return null;
  if (Object.prototype.toString.call(str) === '[object Date]') return str;
  var partes = String(str).replace(',', '').trim().split(' ');
  var dataParte = partes[0].split('/');
  var horaParte = (partes[1] || '00:00:00').split(':');
  return new Date(
    parseInt(dataParte[2], 10),
    parseInt(dataParte[1], 10) - 1,
    parseInt(dataParte[0], 10),
    parseInt(horaParte[0] || 0, 10),
    parseInt(horaParte[1] || 0, 10),
    parseInt(horaParte[2] || 0, 10)
  );
}

function horasEntre(dataInicio, dataFim) {
  if (!dataInicio) return 0;
  var diffMs = dataFim.getTime() - dataInicio.getTime();
  return diffMs / (1000 * 60 * 60);
}

// ============================================================
// PARTE 4 — GERAÇÃO DO CORPO DO E-MAIL (templates HTML ou IA)
// ============================================================

/**
 * Retorna o corpo do e-mail em HTML.
 * Se USAR_IA = true e a chave do Gemini estiver configurada, tenta gerar via IA
 * (o resultado da IA é envolvido no mesmo layout HTML/rodapé).
 * Caso contrário (ou se a IA falhar), usa o template fixo revisado.
 */
function gerarEmailComIA(cenario, dadosLead) {
  if (USAR_IA) {
    var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    if (apiKey) {
      try {
        var prompt = montarPrompt(cenario, dadosLead);
        var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;
        var payload = { contents: [{ parts: [{ text: prompt }] }] };
        var options = {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        };
        var response = UrlFetchApp.fetch(url, options);
        var json = JSON.parse(response.getContentText());

        if (json.candidates && json.candidates[0] && json.candidates[0].content) {
          var textoIA = json.candidates[0].content.parts[0].text.trim();
          // Envolve o texto gerado pela IA no mesmo layout HTML padrão (com blog + rodapé)
          return montarHTML(textoIA.replace(/\n/g, '<br>'));
        } else {
          console.error('Resposta inesperada do Gemini: ' + response.getContentText());
        }
      } catch (err) {
        console.error('Erro ao chamar Gemini: ' + err);
      }
    }
  }

  // Padrão: template fixo revisado
  return templateHTML(cenario, dadosLead);
}

function montarPrompt(cenario, d) {
  var base = "Você é o assistente de e-mail marketing do site Ache Crédito (achecredito.com.br), " +
    "um portal brasileiro de comparação de crédito. Escreva em português do Brasil, tom amigável, " +
    "direto e confiável, sem ser apelativo. Não invente taxas ou valores. " +
    "Não use saudações genéricas tipo 'Caro cliente' - use o nome da pessoa. " +
    "Não inclua despedida/assinatura nem aviso de cancelamento — isso é adicionado automaticamente depois. " +
    "Retorne APENAS o corpo principal do e-mail em texto simples (sem HTML, sem markdown).\n\n";

  if (cenario === 'lead_com_interesse') {
    return base + "Contexto: " + d.nome + " preencheu nosso formulário de " + d.modalidade +
      " e demonstrou interesse específico nas seguintes opções: " + d.empresas + ". " +
      "Escreva um e-mail curto confirmando o recebimento, reforçando essas opções específicas, " +
      "e incentivando a pessoa a continuar o processo diretamente com essas instituições.";
  }
  if (cenario === 'lead_sem_interesse') {
    return base + "Contexto: " + d.nome + " preencheu nosso formulário de " + d.modalidade +
      " mas ainda não escolheu uma oferta específica. " +
      "Escreva um e-mail curto e acolhedor, incentivando a pessoa a voltar ao site (" + SITE_URL + "/obrigado.html) " +
      "para ver as opções selecionadas para o perfil dela.";
  }
  if (cenario === 'abandono_email1') {
    return base + "Contexto: " + d.nome + " começou a simular " + d.modalidade + " no nosso site, " +
      "mas não terminou o cadastro. Escreva um e-mail curto, sem pressão, perguntando se ficou " +
      "alguma dúvida e convidando a pessoa a finalizar a simulação em " + SITE_URL + "/ofertas.html.";
  }
  if (cenario === 'followup_email2') {
    return base + "Contexto: " + d.nome + " demonstrou interesse em " + d.modalidade + " mas ainda não " +
      "finalizou o cadastro, mesmo após um primeiro contato nosso. Escreva um e-mail de follow-up final, " +
      "breve, oferecendo ajuda e o link " + SITE_URL + "/ofertas.html, sem ser insistente.";
  }
  return base + "Escreva um e-mail genérico de boas-vindas para " + d.nome + ".";
}

/**
 * Templates fixos revisados, em HTML. Este é o caminho usado por padrão (USAR_IA = false).
 */
function templateHTML(cenario, d) {
  var corpo = '';

  if (cenario === 'lead_com_interesse') {
    corpo =
      '<p>Olá ' + d.nome + ',</p>' +
      '<p>Recebemos sua solicitação de <strong>' + d.modalidade + '</strong> e vimos que você se interessou pelas seguintes opções: <strong>' + d.empresas + '</strong>.</p>' +
      '<p>Essas instituições foram selecionadas com base no perfil que você nos enviou. Para dar continuidade, é só acessar diretamente o site de cada uma e seguir com a proposta.</p>' +
      '<p>Enquanto isso, aproveite para conferir nosso blog — lá você encontra artigos sobre crédito, educação financeira e economia que podem te ajudar a tomar a melhor decisão: ' +
      '<a href="' + SITE_URL + '/blog.html">' + SITE_URL + '/blog.html</a></p>' +
      '<p>Qualquer dúvida, estamos à disposição.</p>';
  } else if (cenario === 'lead_sem_interesse') {
    corpo =
      '<p>Olá ' + d.nome + ',</p>' +
      '<p>Recebemos sua solicitação de <strong>' + d.modalidade + '</strong> no Ache Crédito. Preparamos algumas opções que podem fazer sentido para o seu perfil.</p>' +
      '<p>Acesse o link abaixo para conferir as ofertas disponíveis:<br>' +
      '<a href="' + SITE_URL + '/obrigado.html">' + SITE_URL + '/obrigado.html</a></p>' +
      '<p>Aproveite também para visitar nosso blog, com artigos sobre crédito, educação financeira e economia: ' +
      '<a href="' + SITE_URL + '/blog.html">' + SITE_URL + '/blog.html</a></p>';
  } else if (cenario === 'abandono_email1') {
    corpo =
      '<p>Olá ' + d.nome + ',</p>' +
      '<p>Notamos que você começou a simular <strong>' + d.modalidade + '</strong> no Ache Crédito, mas não finalizou o cadastro.</p>' +
      '<p>Ficou alguma dúvida? Sua simulação é gratuita e leva menos de 2 minutos. Você pode concluir aqui:<br>' +
      '<a href="' + SITE_URL + '/ofertas.html">' + SITE_URL + '/ofertas.html</a></p>' +
      '<p>Enquanto decide, dá uma olhada no nosso blog — temos conteúdos sobre crédito, educação financeira e economia que podem ser úteis: ' +
      '<a href="' + SITE_URL + '/blog.html">' + SITE_URL + '/blog.html</a></p>';
  } else if (cenario === 'followup_email2') {
    corpo =
      '<p>Olá ' + d.nome + ',</p>' +
      '<p>Ainda dá tempo de simular seu <strong>' + d.modalidade + '</strong> gratuitamente e sem compromisso. Acesse:<br>' +
      '<a href="' + SITE_URL + '/ofertas.html">' + SITE_URL + '/ofertas.html</a></p>' +
      '<p>E não deixe de visitar nosso blog, com artigos sobre crédito, educação financeira e economia: ' +
      '<a href="' + SITE_URL + '/blog.html">' + SITE_URL + '/blog.html</a></p>';
  } else {
    corpo = '<p>Olá ' + d.nome + ',</p><p>Obrigado por visitar o Ache Crédito.</p>';
  }

  return montarHTML(corpo);
}

/**
 * Monta o HTML final do e-mail: corpo + assinatura + (~10 linhas em branco) + aviso discreto de opt-out.
 */
function montarHTML(corpoHtml) {
  var espacador = '';
  for (var i = 0; i < 10; i++) {
    espacador += '<br>';
  }

  return '<div style="font-family: Arial, sans-serif; font-size: 15px; color: #1F2933; line-height: 1.6;">' +
    corpoHtml +
    '<p>Equipe Ache Crédito</p>' +
    espacador +
    '<p style="font-size: 11px; color: #999999;">Se não quiser mais receber nossos e-mails, basta responder esta mensagem com a palavra "sair".</p>' +
    '</div>';
}

// ============================================================
// PARTE 5 — ENVIO DE E-MAIL (com tratamento de erro/bounce)
// ============================================================

function enviarEmail(destinatario, assunto, corpoHtml) {
  try {
    GmailApp.sendEmail(destinatario, assunto, '', {
      name: REMETENTE_NOME,
      htmlBody: corpoHtml
    });
  } catch (err) {
    console.error('Erro ao enviar e-mail para ' + destinatario + ': ' + err);
    marcarEmailBounced(destinatario);
    throw err;
  }
}

function marcarEmailBounced(email) {
  var sheet = getCRMSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var emails = sheet.getRange(2, CRM_COLS.EMAIL, lastRow - 1, 1).getValues();
  for (var i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).trim().toLowerCase() === String(email).trim().toLowerCase()) {
      sheet.getRange(i + 2, CRM_COLS.EMAIL_BOUNCED).setValue("Sim");
      break;
    }
  }
}
