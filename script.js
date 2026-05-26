/**
 * SIMULADOR DE ENCAPSULAMENTO DA INTERNET — script.js
 * 
 * Estrutura:
 *  - Estado global
 *  - Dados das camadas (conteúdo educativo)
 *  - Navegação entre telas
 *  - Lógica da simulação (steps / animação)
 *  - Interatividade (click em camada, detalhe, modal)
 *  - Utilitários
 */

'use strict';

/* ============================================================
   ESTADO GLOBAL
   ============================================================ */
const state = {
  protocol: 'TCP',    // 'TCP' ou 'UDP'
  step: -1,           // -1 = início, 0–4 = camadas
  animating: false,
  animTimer: null,
};

/* ============================================================
   DADOS EDUCATIVOS POR CAMADA
   ============================================================ */
const LAYERS = [
  {
    id: 'app',
    name: 'Aplicação',
    number: 5,
    color: 'var(--c-app)',
    protocols: 'HTTP, DNS, SMTP, FTP',
    pdu: 'Dados / Mensagem',
    example: 'Você digita um URL e o HTTP solicita a página ao servidor.',
    desc:
      'A camada de Aplicação é onde os programas que usamos (navegadores, clientes de e-mail, etc.) ' +
      'se comunicam com a rede. Ela define as regras (protocolos) para que aplicações diferentes possam ' +
      'trocar informações. Aqui os dados ainda são textos e arquivos legíveis.',
  },
  {
    id: 'trans',
    name: 'Transporte',
    number: 4,
    color: 'var(--c-trans)',
    protocols: 'TCP, UDP',
    pdu: 'Segmento (TCP) / Datagrama (UDP)',
    example: 'TCP garante entrega (download de arquivo). UDP é rápido mas sem garantia (videochamada).',
    desc:
      'A camada de Transporte divide os dados em pedaços menores e adiciona informações de controle. ' +
      'O TCP garante que todos os pedaços cheguem na ordem certa (ideal para e-mails e arquivos). ' +
      'O UDP é mais rápido e não verifica a entrega (ideal para streaming e jogos online).',
  },
  {
    id: 'net',
    name: 'Internet / Rede',
    number: 3,
    color: 'var(--c-net)',
    protocols: 'IP, ICMP, ARP',
    pdu: 'Pacote',
    example: 'O roteador usa o endereço IP para decidir o caminho dos pacotes.',
    desc:
      'A camada de Rede é responsável pelo endereçamento lógico e roteamento. O protocolo IP ' +
      'adiciona endereços de origem e destino (como CEP de remetente e destinatário). Os roteadores ' +
      'usam essas informações para encaminhar os pacotes pelo caminho mais eficiente até o destino.',
  },
  {
    id: 'link',
    name: 'Enlace',
    number: 2,
    color: 'var(--c-link)',
    protocols: 'Ethernet, MAC',
    pdu: 'Quadro (Frame)',
    example: 'O switch usa o endereço MAC para entregar o quadro na rede local.',
    desc:
      'A camada de Enlace cuida da comunicação entre dispositivos na mesma rede local. ' +
      'Ela usa endereços MAC (físicos, gravados no hardware) para identificar cada placa de rede. ' +
      'O Ethernet define o formato do quadro, que inclui dados, cabeçalho e um trailer de verificação (FCS).',
  },
  {
    id: 'phys',
    name: 'Física',
    number: 1,
    color: 'var(--c-phys)',
    protocols: 'Bits, Sinais Elétricos, Ópticos, Rádio',
    pdu: 'Bits (0 e 1)',
    example: 'O cabo UTP transmite pulsos elétricos; a fibra óptica transmite pulsos de luz.',
    desc:
      'A camada Física converte todos os dados em sinais brutos: pulsos elétricos (cabos de cobre), ' +
      'pulsos de luz (fibra óptica) ou ondas de rádio (Wi-Fi). Ela define as especificações do meio ' +
      'físico: tensão, frequência, tipo de conector e velocidade de transmissão.',
  },
];

/* Passos da animação de encapsulamento */
const STEPS = [
  {
    layerId: 'app',
    label: 'Camada de Aplicação — Dados',
    indicator: 'Passo 1 / 5 — Aplicação',
    progress: 20,
    /* Blocos renderizados de baixo para cima (o primeiro item é o mais externo) */
    blocks: [
      { cls: 'data-block', tag: 'DADOS', content: 'GET / HTTP/1.1  Host: exemplo.com' },
    ],
  },
  {
    layerId: 'trans',
    label: 'Camada de Transporte — Segmento',
    indicator: 'Passo 2 / 5 — Transporte',
    progress: 40,
    blocks: [
      { cls: 'header-trans', tag: 'HDR TCP', content: '' }, // conteúdo dinâmico via JS
      { cls: 'data-block',   tag: 'DADOS',   content: 'GET / HTTP/1.1  Host: exemplo.com' },
    ],
  },
  {
    layerId: 'net',
    label: 'Camada de Rede — Pacote IP',
    indicator: 'Passo 3 / 5 — Rede',
    progress: 60,
    blocks: [
      { cls: 'header-net',   tag: 'HDR IP',  content: 'Src: 192.168.1.10  Dst: 93.184.216.34' },
      { cls: 'header-trans', tag: 'HDR TCP', content: '' },
      { cls: 'data-block',   tag: 'DADOS',   content: 'GET / HTTP/1.1  Host: exemplo.com' },
    ],
  },
  {
    layerId: 'link',
    label: 'Camada de Enlace — Quadro Ethernet',
    indicator: 'Passo 4 / 5 — Enlace',
    progress: 80,
    blocks: [
      { cls: 'header-link',  tag: 'ETH HDR', content: 'Src MAC: AA:BB:CC  Dst MAC: 11:22:33' },
      { cls: 'header-net',   tag: 'HDR IP',  content: 'Src: 192.168.1.10  Dst: 93.184.216.34' },
      { cls: 'header-trans', tag: 'HDR TCP', content: '' },
      { cls: 'data-block',   tag: 'DADOS',   content: 'GET / HTTP/1.1  Host: exemplo.com' },
      { cls: 'trailer-block', tag: 'FCS',    content: '(verificação de erros)' },
    ],
  },
  {
    layerId: 'phys',
    label: 'Camada Física — Bits transmitidos',
    indicator: 'Passo 5 / 5 — Física',
    progress: 100,
    blocks: [
      { cls: 'header-phys', tag: 'BITS', content: generateBits(64) },
    ],
  },
];

/* ============================================================
   UTILITÁRIOS
   ============================================================ */
/** Gera uma string aleatória de 0s e 1s */
function generateBits(len) {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += Math.round(Math.random());
    if ((i + 1) % 8 === 0 && i < len - 1) s += ' ';
  }
  return s;
}

/** Injeta conteúdo dinâmico (protocolo TCP/UDP) nos blocos */
function resolveDynamicBlocks(blocks) {
  return blocks.map(b => {
    const copy = { ...b };
    if (copy.tag === 'HDR TCP') {
      const proto = state.protocol;
      copy.tag = `HDR ${proto}`;
      copy.content = proto === 'TCP'
        ? 'Porta src: 49152  Porta dst: 80  Seq: 1  Ack: 0'
        : 'Porta src: 49152  Porta dst: 53  Len: 28  Checksum';
    }
    return copy;
  });
}

/* ============================================================
   NAVEGAÇÃO ENTRE TELAS
   ============================================================ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function startSimulation() {
  showScreen('sim-screen');
  updateProtocolLabel();
  resetSimulation();
}

function goHome() {
  clearTimeout(state.animTimer);
  state.animating = false;
  showScreen('home-screen');
}

/* ============================================================
   SELEÇÃO DE PROTOCOLO
   ============================================================ */
function selectProtocol(proto) {
  state.protocol = proto;
  document.getElementById('btn-tcp').classList.toggle('active', proto === 'TCP');
  document.getElementById('btn-udp').classList.toggle('active', proto === 'UDP');
  updateProtocolLabel();
  // Atualiza PDU da camada de transporte
  document.getElementById('trans-pdu').textContent       = proto === 'TCP' ? 'Segmento' : 'Datagrama';
  document.getElementById('trans-proto-label').textContent = `TCP · UDP (usando ${proto})`;
  // Re-renderiza passo atual se já tiver começado
  if (state.step >= 0) renderStep(state.step);
}

function updateProtocolLabel() {
  const el = document.getElementById('protocol-label');
  if (el) el.textContent = state.protocol;
}

/* ============================================================
   SIMULAÇÃO — STEPS
   ============================================================ */
function resetSimulation() {
  clearTimeout(state.animTimer);
  state.animating = false;
  state.step = -1;

  // Remove destaques das camadas
  document.querySelectorAll('.layer-card').forEach(c => {
    c.classList.remove('active', 'done', 'animating');
  });

  // Limpa a caixa de encapsulamento
  const box = document.getElementById('encap-box');
  box.innerHTML = '<div class="encap-placeholder"><span>▶ Clique em "Próximo" ou "Animar" para começar</span></div>';

  // Reinicia indicadores
  document.getElementById('step-indicator').textContent = 'Aguardando…';
  document.getElementById('progress-bar').style.width   = '0%';

  // Fecha detalhe se aberto
  closeDetail();

  // Atualiza botões
  document.getElementById('btn-play').disabled = false;
  document.getElementById('btn-next').disabled = false;

  updateProtocolLabel();
}

/** Avança para o próximo step manualmente */
function nextStep() {
  if (state.step >= STEPS.length - 1) {
    resetSimulation();
    return;
  }
  state.step++;
  renderStep(state.step);
}

/** Anima automaticamente todos os steps */
function playAnimation() {
  if (state.animating) return;
  state.animating = true;
  state.step = -1;

  document.querySelectorAll('.layer-card').forEach(c => c.classList.remove('active', 'done', 'animating'));
  document.getElementById('encap-box').innerHTML =
    '<div class="encap-placeholder"><span>Iniciando animação…</span></div>';

  animateNextStep();
}

function animateNextStep() {
  if (!state.animating) return;

  if (state.step >= STEPS.length - 1) {
    state.animating = false;
    document.getElementById('btn-next').textContent = '↺ Reiniciar';
    return;
  }

  state.step++;
  renderStep(state.step);

  // Destaque animado no card da camada
  const layerId = STEPS[state.step].layerId;
  const card = document.getElementById('layer-' + layerId);
  if (card) {
    card.classList.add('animating');
    setTimeout(() => card.classList.remove('animating'), 700);
  }

  // Próximo step após 1.8 s
  state.animTimer = setTimeout(animateNextStep, 1800);
}

/** Renderiza um step específico */
function renderStep(index) {
  const stepData  = STEPS[index];
  const blocks    = resolveDynamicBlocks(stepData.blocks);
  const box       = document.getElementById('encap-box');
  const indicator = document.getElementById('step-indicator');
  const progress  = document.getElementById('progress-bar');

  // Atualiza indicador e progresso
  indicator.textContent      = stepData.indicator;
  progress.style.width       = stepData.progress + '%';

  // Destaca camada atual e marca anteriores como done
  document.querySelectorAll('.layer-card').forEach((card, i) => {
    const layerIndex = LAYERS.length - 1 - i; // cards estão em ordem decrescente de número
    // Mapeia o data-layer ao índice do step
    const cardLayer = card.getAttribute('data-layer');
    const stepLayer = STEPS[index].layerId;

    // Calcula se esta camada é "antes" do step atual
    const cardStepIndex = STEPS.findIndex(s => s.layerId === cardLayer);

    card.classList.remove('active', 'done');
    if (cardStepIndex < index)  card.classList.add('done');
    if (cardLayer === stepLayer) card.classList.add('active');
  });

  // Monta os blocos
  box.innerHTML = '';
  blocks.forEach((b, i) => {
    const div = document.createElement('div');
    div.className = `encap-block ${b.cls}`;
    div.style.animationDelay = (i * 0.07) + 's';

    const tagEl = document.createElement('span');
    tagEl.className = 'block-tag';
    tagEl.textContent = b.tag;

    const contentEl = document.createElement('span');
    contentEl.className = 'block-content';
    contentEl.textContent = b.content || '';

    div.appendChild(tagEl);
    if (b.content) div.appendChild(contentEl);
    box.appendChild(div);
  });

  // Atualiza botão Next no último step
  const btnNext = document.getElementById('btn-next');
  btnNext.textContent = index >= STEPS.length - 1 ? '↺ Reiniciar' : 'Próximo →';
}

/* ============================================================
   INTERATIVIDADE — CLIQUE NA CAMADA
   ============================================================ */
function clickLayer(layerId) {
  const layerData = LAYERS.find(l => l.id === layerId);
  if (!layerData) return;

  // Vai até o step correspondente (mas sem disparar animação automática)
  const stepIndex = STEPS.findIndex(s => s.layerId === layerId);
  if (stepIndex !== -1 && !state.animating) {
    state.step = stepIndex;
    renderStep(stepIndex);
  }

  // Exibe painel de detalhes
  showDetail(layerData);
}

function showDetail(layer) {
  const panel = document.getElementById('detail-panel');

  document.getElementById('detail-title').textContent     = `Camada ${layer.number} — ${layer.name}`;
  document.getElementById('detail-desc').textContent      = layer.desc;
  document.getElementById('detail-protocols').textContent = layer.protocols;
  document.getElementById('detail-pdu').textContent       = layer.pdu;
  document.getElementById('detail-example').textContent   = layer.example;

  // Cor do título de acordo com a camada
  document.getElementById('detail-title').style.color = layer.color;

  panel.style.display = 'block';
}

function closeDetail() {
  const panel = document.getElementById('detail-panel');
  if (panel) panel.style.display = 'none';
}

/* ============================================================
   MODAL — MODO EDUCATIVO
   ============================================================ */
function showTable() {
  document.getElementById('table-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTable(event) {
  // Fecha ao clicar no overlay (fora do modal-box) ou no botão de fechar
  if (!event || event.target === document.getElementById('table-modal')) {
    document.getElementById('table-modal').classList.remove('open');
    document.body.style.overflow = '';
  }
}

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Garante que a home está visível no início
  showScreen('home-screen');

  // Fecha modal com Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeTable();
  });
});
