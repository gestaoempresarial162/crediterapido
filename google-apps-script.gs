/**
 * APPS SCRIPT - Ache Crédito
 * Recebe dados do formulário do site e grava como nova linha na planilha.
 * Suporta dois tipos de registro:
 *  - "lead": formulário completo e enviado (aba "Leads")
 *  - "abandono": pessoa começou a preencher mas não enviou (aba "Abandonos")
 *
 * COMO USAR: veja o passo a passo completo em INSTRUCOES.md
 */

function doPost(e) {
  var params = e.parameter;
  var tipo = params.tipoRegistro || 'lead';

  var sheetName = 'Leads';
  if (tipo === 'abandono') sheetName = 'Abandonos';
  if (tipo === 'click_offer') sheetName = 'Cliques';

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  // Se a aba não existir, cria
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Se a aba estiver vazia, cria o cabeçalho
  if (sheet.getLastRow() === 0) {
    if (tipo === 'abandono') {
      sheet.appendRow([
        "Data/Hora",
        "Nome",
        "E-mail",
        "Telefone",
        "CPF",
        "Modalidade",
        "Origem (página)"
      ]);
    } else if (tipo === 'click_offer') {
      sheet.appendRow([
        "Data/Hora",
        "Nome",
        "E-mail",
        "CPF",
        "Telefone",
        "Modalidade",
        "Parceiro Clicado",
        "Origem (página)"
      ]);
    } else {
      sheet.appendRow([
        "Data de Envio",
        "Nome",
        "E-mail",
        "Telefone",
        "CPF",
        "Cidade",
        "Valor Desejado",
        "Modalidade",
        "Origem (página)"
      ]);
    }
  }

  if (tipo === 'abandono') {
    sheet.appendRow([
      params.dataEnvio || new Date().toLocaleString('pt-BR'),
      params.nome || "",
      params.email || "",
      params.telefone || "",
      params.cpf || "",
      params.modalidadeLabel || params.modalidade || "",
      params.origem || ""
    ]);
  } else if (tipo === 'click_offer') {
    sheet.appendRow([
      params.dataEnvio || new Date().toLocaleString('pt-BR'),
      params.nome || "",
      params.email || "",
      params.cpf || "",
      params.telefone || "",
      params.modalidadeLabel || params.modalidade || "",
      params.parceiro || "",
      params.origem || ""
    ]);
  } else {
    sheet.appendRow([
      params.dataEnvio || new Date().toLocaleString('pt-BR'),
      params.nome || "",
      params.email || "",
      params.telefone || "",
      params.cpf || "",
      params.cidade || "",
      params.valorDesejado || "",
      params.modalidadeLabel || params.modalidade || "",
      params.origem || ""
    ]);
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
