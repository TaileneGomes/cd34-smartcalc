/* ============================================================
   CD34+ Calculadora
   Script principal: validações, cálculo e exibição de resultados.
   Comentado em português para facilitar o aprendizado.
   ============================================================ */

// --- Referências aos elementos da tela ---
const volumeInicialInput = document.getElementById('volumeInicial');
const concInicialInput = document.getElementById('concInicial');
const concDesejadaInput = document.getElementById('concDesejada');
const calcularBtn = document.getElementById('calcularBtn');
const errorBox = document.getElementById('errorBox');

const resultSection = document.getElementById('resultSection');
const alertBox = document.getElementById('alertBox');
const resVolumeFinal = document.getElementById('resVolumeFinal');
const resVolumeRetirar = document.getElementById('resVolumeRetirar');
const resConcFinal = document.getElementById('resConcFinal');

const detailsSection = document.getElementById('detailsSection');
const calcSteps = document.getElementById('calcSteps');

const conferenceSection = document.getElementById('conferenceSection');
const conferenceBody = document.getElementById('conferenceBody');

/* ------------------------------------------------------------
   1. FORMATAÇÃO DE NÚMEROS (padrão brasileiro: ponto de milhar,
      vírgula decimal). Usado para exibir valores e também para
      formatar automaticamente o campo de concentração enquanto
      a pessoa digita.
   ------------------------------------------------------------ */

// Converte um número em texto no padrão brasileiro.
// decimals = quantas casas decimais mostrar no máximo.
function formatBR(num, decimals = 0) {
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

// Enquanto o usuário digita nos campos de concentração,
// deixamos só dígitos e formatamos com pontos de milhar.
// Ex.: digitar "200000" vira "200.000" na tela.
function attachThousandsFormatting(inputEl) {
  inputEl.addEventListener('input', () => {
    const digitsOnly = inputEl.value.replace(/\D/g, ''); // remove tudo que não é número
    if (digitsOnly === '') {
      inputEl.value = '';
      return;
    }
    inputEl.value = formatBR(Number(digitsOnly), 0);
  });
}

attachThousandsFormatting(concInicialInput);
attachThousandsFormatting(concDesejadaInput);

// Lê o valor "cru" (número puro) de um campo formatado com pontos de milhar.
function parseFormattedInt(inputEl) {
  const digitsOnly = inputEl.value.replace(/\D/g, '');
  if (digitsOnly === '') return NaN;
  return Number(digitsOnly);
}

// O campo de volume aceita números decimais (ex.: 100 ou 87,5),
// então tratamos vírgula como separador decimal.
function parseVolume(inputEl) {
  const raw = inputEl.value.trim().replace(',', '.');
  if (raw === '') return NaN;
  return Number(raw);
}

/* ------------------------------------------------------------
   2. ARREDONDAMENTO COM AVISO
      A regra do projeto é: nunca arredondar um valor importante
      sem informar isso claramente na tela.
   ------------------------------------------------------------ */
function roundWithNote(value, decimals = 2) {
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  const wasRounded = Math.abs(rounded - value) > 1e-9;
  return { rounded, wasRounded };
}

/* ------------------------------------------------------------
   3. VALIDAÇÃO DOS CAMPOS
      Retorna uma lista de mensagens de erro. Se a lista estiver
      vazia, os dados estão prontos para o cálculo.
   ------------------------------------------------------------ */
function validar(v1, c1, c2) {
  const erros = [];

  if (Number.isNaN(v1)) erros.push('Informe o volume inicial.');
  else if (v1 < 0) erros.push('O volume inicial não pode ser negativo.');
  else if (v1 === 0) erros.push('O volume inicial deve ser maior que zero.');

  if (Number.isNaN(c1)) erros.push('Informe a concentração inicial de CD34+.');
  else if (c1 < 0) erros.push('A concentração inicial não pode ser negativa.');
  else if (c1 === 0) erros.push('A concentração inicial não pode ser igual a zero.');

  if (Number.isNaN(c2)) erros.push('Informe a concentração desejada.');
  else if (c2 < 0) erros.push('A concentração desejada não pode ser negativa.');
  else if (c2 === 0) erros.push('A concentração desejada não pode ser igual a zero.');

  return erros;
}

/* ------------------------------------------------------------
   4. CÁLCULO PRINCIPAL
      Fórmula: V1 × C1 = V2 × C2  →  V2 = (V1 × C1) ÷ C2
      Volume a retirar = V1 − V2
   ------------------------------------------------------------ */
function calcular(v1, c1, c2) {
  const v2 = (v1 * c1) / c2;
  const volumeARetirar = v1 - v2;
  return { v2, volumeARetirar };
}

/* ------------------------------------------------------------
   5. EXIBIÇÃO DOS RESULTADOS NA TELA
   ------------------------------------------------------------ */
function mostrarErro(mensagens) {
  errorBox.hidden = false;
  errorBox.innerHTML = mensagens.map(m => `• ${m}`).join('<br>');
  resultSection.hidden = true;
  detailsSection.hidden = true;
  conferenceSection.hidden = true;
}

function limparErro() {
  errorBox.hidden = true;
  errorBox.innerHTML = '';
}

function mostrarAlerta(texto, tipo) {
  // tipo: 'info' (verde), 'neutral' (neutro) ou 'warning' (amarelo)
  alertBox.hidden = false;
  alertBox.className = `alert-box ${tipo}`;
  alertBox.textContent = texto;
}

function esconderAlerta() {
  alertBox.hidden = true;
  alertBox.textContent = '';
}

function mostrarResultados(v1, c1, c2, v2, volumeARetirar) {
  const v2Info = roundWithNote(v2, 2);
  const retirarInfo = roundWithNote(volumeARetirar, 2);

  // --- Cartão de resultado ---
  resVolumeFinal.textContent = `${formatBR(v2Info.rounded, 2)} mL`;
  resVolumeRetirar.textContent = `${formatBR(Math.abs(retirarInfo.rounded), 2)} mL`;
  resConcFinal.textContent = `${formatBR(c2, 0)} células/µL`;
  resultSection.hidden = false;

  // --- Alerta de acordo com a comparação entre C1 e C2 ---
  esconderAlerta();
  if (c1 < c2) {
    mostrarAlerta(
      'O cálculo indica redução de volume para atingir a concentração desejada.',
      'info'
    );
  } else if (c1 === c2) {
    mostrarAlerta(
      'Não é necessária redução teórica de volume para atingir a concentração informada.',
      'neutral'
    );
  } else {
    mostrarAlerta(
      'A concentração inicial é maior que a desejada: o cálculo resulta em um volume final maior que o volume inicial. Isso não representa retirada de plasma para concentração — reavalie os valores informados.',
      'warning'
    );
  }

  // --- Detalhes do cálculo, passo a passo ---
  const passos = [];
  passos.push(
    `V2 = (V1 × C1) ÷ C2 = (${formatBR(v1, 2)} × ${formatBR(c1, 0)}) ÷ ${formatBR(c2, 0)}`
  );
  passos.push(
    `V2 = ${formatBR(v2Info.rounded, 2)} mL` +
    (v2Info.wasRounded ? ` <span class="note">Valor arredondado para 2 casas decimais. Valor exato: ${v2}</span>` : '')
  );
  passos.push(
    `Volume a retirar = V1 − V2 = ${formatBR(v1, 2)} − ${formatBR(v2Info.rounded, 2)}`
  );
  passos.push(
    `Volume a retirar = ${formatBR(retirarInfo.rounded, 2)} mL` +
    (retirarInfo.wasRounded ? ` <span class="note">Valor arredondado para 2 casas decimais. Valor exato: ${volumeARetirar}</span>` : '') +
    (volumeARetirar < 0 ? ' <span class="note">Valor negativo: indica aumento de volume, não retirada.</span>' : '')
  );

  calcSteps.innerHTML = passos.map(p => `<div class="calc-step">${p}</div>`).join('');
  detailsSection.hidden = false;

  // --- Conferência matemática: V1×C1 deve ser igual a V2×C2 ---
  const ladoEsquerdo = v1 * c1;
  const ladoDireito = v2Info.rounded * c2;
  const diferenca = Math.abs(ladoEsquerdo - ladoDireito);
  // Pequena tolerância porque V2 foi arredondado para exibição.
  const consistente = diferenca < Math.max(1, ladoEsquerdo * 0.001);

  conferenceBody.innerHTML = `
    <div>${formatBR(v1, 2)} mL × ${formatBR(c1, 0)} células/µL</div>
    <div>=</div>
    <div>${formatBR(v2Info.rounded, 2)} mL × ${formatBR(c2, 0)} células/µL</div>
    <div class="check ${consistente ? 'ok' : ''}">
      ${consistente ? '✓ Cálculo matematicamente consistente' : '⚠ Diferença encontrada por causa do arredondamento exibido acima'}
    </div>
  `;
  conferenceSection.hidden = false;
}

/* ------------------------------------------------------------
   6. AÇÃO DO BOTÃO "CALCULAR"
   ------------------------------------------------------------ */
calcularBtn.addEventListener('click', () => {
  const v1 = parseVolume(volumeInicialInput);
  const c1 = parseFormattedInt(concInicialInput);
  const c2 = parseFormattedInt(concDesejadaInput);

  const erros = validar(v1, c1, c2);

  if (erros.length > 0) {
    mostrarErro(erros);
    return;
  }

  limparErro();
  const { v2, volumeARetirar } = calcular(v1, c1, c2);
  mostrarResultados(v1, c1, c2, v2, volumeARetirar);
});

/* ------------------------------------------------------------
   7. REGISTRO DO SERVICE WORKER (para funcionar como PWA/offline)
   ------------------------------------------------------------ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {
      // Se falhar (ex.: rodando fora de um servidor), o app
      // continua funcionando normalmente, só sem cache offline.
    });
  });
}
