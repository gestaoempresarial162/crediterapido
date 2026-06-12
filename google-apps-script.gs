/**
 * APPS SCRIPT - Ache Crédito
 * Recebe dados do formulário do site e grava como nova linha na planilha.
 *
 * COMO USAR: veja o passo a passo completo em INSTRUCOES.md
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Leads") 
              || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Se a planilha estiver vazia, cria o cabeçalho
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Data de Envio",
      "Nome",
      "E-mail",
      "Telefone",
      "Cidade",
      "Valor Desejado",
      "Modalidade",
      "Origem (página)"
    ]);
  }

  var params = e.parameter;

  sheet.appendRow([
    params.dataEnvio || new Date().toLocaleString('pt-BR'),
    params.nome || "",
    params.email || "",
    params.telefone || "",
    params.cidade || "",
    params.valorDesejado || "",
    params.modalidadeLabel || params.modalidade || "",
    params.origem || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "API Ache Crédito ativa" }))
    .setMimeType(ContentService.MimeType.JSON);
}
