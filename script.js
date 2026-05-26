'use strict';

const state = {
  protocol: 'TCP',
  mode: 'encap',
  step: -1,
  animating: false,
  timer: null,
};

const LAYERS = [
  { id:'app', number:5, name:'Aplicação', color:'var(--c-app)', protocols:'HTTP, DNS, DHCP, SMTP, FTP', pdu:'Dados / Mensagem', example:'DNS resolve google.com; HTTP solicita páginas web.', desc:'É a camada dos programas. Navegador, servidor web, DNS e DHCP trabalham aqui com dados legíveis para humanos e aplicações.' },
  { id:'trans', number:4, name:'Transporte', color:'var(--c-trans)', protocols:'TCP, UDP', pdu:'Segmento (TCP) / Datagrama (UDP)', example:'TCP usa handshake e portas; UDP é usado em DNS e DHCP.', desc:'Controla a comunicação fim a fim. TCP confirma entrega e ordem; UDP é mais simples e rápido.' },
  { id:'net', number:3, name:'Internet / Rede', color:'var(--c-net)', protocols:'IP, ICMP, ARP', pdu:'Pacote', example:'Roteador lê IP de destino e escolhe o próximo caminho.', desc:'Adiciona endereços IP e permite comunicação entre redes diferentes. Roteadores trabalham principalmente nesta camada.' },
  { id:'link', number:2, name:'Enlace', color:'var(--c-link)', protocols:'Ethernet, MAC, FCS', pdu:'Quadro', example:'Switch lê MAC de destino e encaminha pela porta correta.', desc:'Cuida da entrega na rede local. Usa endereços MAC e quadros Ethernet.' },
  { id:'phys', number:1, name:'Física', color:'var(--c-phys)', protocols:'Bits, Sinais elétricos, luz, rádio', pdu:'Bits', example:'Cabos e Wi-Fi transformam quadros em sinais.', desc:'Transforma os quadros em bits e sinais no meio físico: cabo, fibra ou rádio.' },
];

function generateBits(len = 64) {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += Math.round(Math.random());
    if ((i + 1) % 8 === 0 && i < len - 1) s += ' ';
  }
  return s;
}

function transHeader() {
  return state.protocol === 'TCP'
    ? 'Porta origem: 49152 | Porta destino: 443 | Seq: 1 | Ack: 0 | Flags: SYN/ACK'
    : 'Porta origem: 49152 | Porta destino: 53 | Tamanho: 28 | Checksum';
}

const MODES = {
  encap: {
    title: 'Encapsulamento de Dados',
    lesson: 'No envio, cada camada adiciona seu cabeçalho. Dados viram segmento, pacote, quadro e finalmente bits.',
    autoDelay: 1700,
    steps: () => [
      { layer:'app', indicator:'1/5 Aplicação: dados criados', progress:20, packet:'HTTP', packetType:'', pos:'client', text:'O navegador cria a mensagem HTTP. Ainda são apenas dados.', blocks:[{cls:'data-block', tag:'DADOS', content:'GET / HTTP/1.1', detail:'Host: google.com'}] },
      { layer:'trans', indicator:'2/5 Transporte: + cabeçalho', progress:40, packet:state.protocol, packetType:'', pos:'client', text:'A camada de transporte adiciona portas e controle. Com TCP, temos segmento.', blocks:[{cls:'header-trans', tag:`HDR ${state.protocol}`, content:transHeader(), detail:'Identifica aplicações usando portas.'},{cls:'data-block', tag:'DADOS', content:'GET / HTTP/1.1', detail:'Mensagem da aplicação'}] },
      { layer:'net', indicator:'3/5 Rede: + IP', progress:60, packet:'IP', packetType:'ip', pos:'router', text:'O IP adiciona origem e destino. O roteador usará esse endereço para encaminhar.', blocks:[{cls:'header-net', tag:'HDR IP', content:'Src: 192.168.1.10 | Dst: 142.250.219.14', detail:'Endereço lógico usado por roteadores.'},{cls:'header-trans', tag:`HDR ${state.protocol}`, content:transHeader(), detail:'Portas e controle'},{cls:'data-block', tag:'DADOS', content:'GET / HTTP/1.1', detail:'Conteúdo'}] },
      { layer:'link', indicator:'4/5 Enlace: + Ethernet + FCS', progress:80, packet:'ETH', packetType:'dhcp', pos:'switch', text:'O quadro Ethernet usa MAC para entrega local. O switch aprende MAC e encaminha o quadro.', blocks:[{cls:'header-link', tag:'ETH HDR', content:'Src MAC: AA:BB:CC | Dst MAC: 11:22:33', detail:'Endereço físico na LAN.'},{cls:'header-net', tag:'HDR IP', content:'Src: 192.168.1.10 | Dst: 142.250.219.14', detail:'Pacote IP'},{cls:'header-trans', tag:`HDR ${state.protocol}`, content:transHeader(), detail:'Segmento'},{cls:'data-block', tag:'DADOS', content:'GET / HTTP/1.1', detail:'Mensagem'},{cls:'trailer-block', tag:'FCS', content:'Verificação de erro', detail:'Trailer Ethernet'}], mac:[['AA:BB:CC','Porta Fa0/1'],['11:22:33','Porta Fa0/2']] },
      { layer:'phys', indicator:'5/5 Física: bits transmitidos', progress:100, packet:'BITS', packetType:'', pos:'server', text:'A camada física envia 0 e 1 por cabo, fibra ou Wi-Fi até o destino.', blocks:[{cls:'header-phys', tag:'BITS', content:generateBits(72), detail:'Sinais elétricos, ópticos ou rádio'}] },
    ]
  },
  decap: {
    title: 'Desencapsulamento no Destino',
    lesson: 'No recebimento acontece o caminho inverso: o destino remove os cabeçalhos até recuperar os dados originais.',
    autoDelay: 1700,
    steps: () => [
      { layer:'phys', indicator:'1/5 Destino recebe bits', progress:20, packet:'BITS', pos:'server', text:'O servidor recebe sinais físicos e interpreta como bits.', blocks:[{cls:'header-phys', tag:'BITS', content:generateBits(72), detail:'Sinais recebidos'}] },
      { layer:'link', indicator:'2/5 Bits viram quadro', progress:40, packet:'ETH', packetType:'dhcp', pos:'server', text:'A camada de enlace monta o quadro e verifica o FCS. Depois remove o cabeçalho Ethernet.', blocks:[{cls:'header-link remove', tag:'REMOVE ETH', content:'Dst MAC conferido | FCS OK', detail:'Cabeçalho Ethernet removido'},{cls:'header-net', tag:'HDR IP', content:'Src: 192.168.1.10 | Dst: 142.250.219.14', detail:'Sobra o pacote IP'},{cls:'header-trans', tag:`HDR ${state.protocol}`, content:transHeader(), detail:'Segmento'},{cls:'data-block', tag:'DADOS', content:'GET / HTTP/1.1', detail:'Mensagem'}] },
      { layer:'net', indicator:'3/5 Remove IP', progress:60, packet:'IP', packetType:'ip', pos:'server', text:'O IP de destino é conferido. O cabeçalho IP é removido e o segmento sobe para transporte.', blocks:[{cls:'header-net remove', tag:'REMOVE IP', content:'Destino 142.250.219.14 confirmado', detail:'Cabeçalho IP removido'},{cls:'header-trans', tag:`HDR ${state.protocol}`, content:transHeader(), detail:'Sobra o segmento'},{cls:'data-block', tag:'DADOS', content:'GET / HTTP/1.1', detail:'Mensagem'}] },
      { layer:'trans', indicator:'4/5 Remove transporte', progress:80, packet:state.protocol, pos:'server', text:'A porta 443 entrega a mensagem para a aplicação correta. O cabeçalho TCP/UDP é removido.', blocks:[{cls:'header-trans remove', tag:`REMOVE ${state.protocol}`, content:'Porta 443 identifica o servidor web', detail:'Cabeçalho de transporte removido'},{cls:'data-block', tag:'DADOS', content:'GET / HTTP/1.1', detail:'Pronto para a aplicação'}] },
      { layer:'app', indicator:'5/5 Aplicação lê dados', progress:100, packet:'HTTP', packetType:'dns', pos:'server', text:'A aplicação recebe a mensagem original e responde ao cliente.', blocks:[{cls:'data-block', tag:'DADOS', content:'GET / HTTP/1.1', detail:'Mensagem entregue ao servidor web'}] },
    ]
  },
  tcp: {
    title: 'TCP Three-Way Handshake',
    lesson: 'Antes de enviar dados com TCP, cliente e servidor combinam uma conexão usando SYN, SYN+ACK e ACK.',
    autoDelay: 1500,
    steps: () => [
      { layer:'trans', indicator:'1/3 Cliente envia SYN', progress:33, packet:'SYN', pos:'router', text:'SYN inicia a conexão TCP. É como dizer: posso começar?', blocks:[{cls:'header-trans', tag:'TCP SYN', content:'Seq: 100 | Ack: 0 | Flag: SYN', detail:'Pedido de abertura de conexão'}] },
      { layer:'trans', indicator:'2/3 Servidor responde SYN + ACK', progress:66, packet:'SYN+ACK', pos:'client', text:'O servidor aceita e confirma o SYN do cliente.', blocks:[{cls:'header-trans', tag:'TCP SYN+ACK', content:'Seq: 300 | Ack: 101 | Flags: SYN, ACK', detail:'Servidor aceitou a conexão'}] },
      { layer:'trans', indicator:'3/3 Cliente envia ACK', progress:100, packet:'ACK', pos:'server', text:'O cliente confirma. A conexão TCP está estabelecida para enviar dados.', blocks:[{cls:'header-trans', tag:'TCP ACK', content:'Seq: 101 | Ack: 301 | Flag: ACK', detail:'Conexão estabelecida'}] },
    ]
  },
  dns: {
    title: 'DNS: Nome vira IP',
    lesson: 'DNS funciona como uma lista telefônica da internet: transforma nomes como google.com em endereços IP.',
    autoDelay: 1600,
    steps: () => [
      { layer:'app', indicator:'1/4 Usuário digita domínio', progress:25, packet:'DNS?', packetType:'dns', pos:'client', text:'O navegador precisa descobrir qual IP pertence a google.com.', blocks:[{cls:'data-block', tag:'DOMÍNIO', content:'google.com', detail:'Nome fácil para humanos'}] },
      { layer:'app', indicator:'2/4 Consulta DNS', progress:50, packet:'DNS Query', packetType:'dns', pos:'router', text:'O cliente envia uma pergunta ao servidor DNS: qual é o IP desse domínio?', blocks:[{cls:'header-app', tag:'DNS QUERY', content:'Qual IP de google.com?', detail:'Normalmente usa UDP porta 53'},{cls:'header-trans', tag:'UDP', content:'Porta destino: 53', detail:'Consulta rápida'}] },
      { layer:'app', indicator:'3/4 Resposta DNS', progress:75, packet:'DNS Resp', packetType:'dns', pos:'client', text:'O DNS responde com um IP. Agora o navegador sabe para onde enviar o pacote.', blocks:[{cls:'header-app', tag:'DNS RESPONSE', content:'google.com → 142.250.219.14', detail:'Exemplo didático de resolução'}], net:[['google.com','142.250.219.14'],['Cache DNS','ativo por alguns minutos']] },
      { layer:'net', indicator:'4/4 HTTP usa o IP', progress:100, packet:'HTTP', packetType:'ip', pos:'server', text:'Depois do DNS, a comunicação HTTP usa o IP encontrado como destino.', blocks:[{cls:'header-net', tag:'HDR IP', content:'Dst: 142.250.219.14', detail:'Destino resolvido pelo DNS'},{cls:'data-block', tag:'HTTP', content:'GET /', detail:'Requisição web'}] },
    ]
  },
  dhcp: {
    title: 'DHCP DORA',
    lesson: 'DHCP entrega configuração automática: IP, máscara, gateway e DNS. O processo é Discover, Offer, Request e Acknowledge.',
    autoDelay: 1600,
    steps: () => [
      { layer:'app', indicator:'1/4 Discover', progress:25, packet:'DISCOVER', packetType:'dhcp', pos:'switch', text:'O cliente ainda não tem IP. Ele manda broadcast perguntando se existe servidor DHCP.', blocks:[{cls:'header-app', tag:'DISCOVER', content:'Existe algum servidor DHCP?', detail:'Broadcast: 255.255.255.255'}] },
      { layer:'app', indicator:'2/4 Offer', progress:50, packet:'OFFER', packetType:'dhcp', pos:'client', text:'O servidor oferece um endereço IP disponível para o cliente.', blocks:[{cls:'header-app', tag:'OFFER', content:'Oferta: 192.168.1.10', detail:'Gateway: 192.168.1.1 | DNS: 8.8.8.8'}] },
      { layer:'app', indicator:'3/4 Request', progress:75, packet:'REQUEST', packetType:'dhcp', pos:'server', text:'O cliente aceita a oferta e solicita oficialmente aquele IP.', blocks:[{cls:'header-app', tag:'REQUEST', content:'Quero usar 192.168.1.10', detail:'Confirma a escolha para o servidor DHCP'}] },
      { layer:'app', indicator:'4/4 Acknowledge', progress:100, packet:'ACK', packetType:'dhcp', pos:'client', text:'O servidor confirma. Agora o cliente já pode participar da rede.', blocks:[{cls:'header-app', tag:'ACK', content:'IP confirmado: 192.168.1.10', detail:'Máscara: 255.255.255.0 | Gateway: 192.168.1.1'}], net:[['IP do cliente','192.168.1.10'],['Gateway','192.168.1.1'],['DNS','8.8.8.8']] },
    ]
  },
  devices: {
    title: 'Dispositivos atuando por camada',
    lesson: 'Cada equipamento toma decisão olhando uma parte diferente do pacote: switch olha MAC, roteador olha IP e servidor lê a aplicação.',
    autoDelay: 1600,
    steps: () => [
      { layer:'link', indicator:'1/4 Cliente envia quadro', progress:25, packet:'ETH', packetType:'dhcp', pos:'switch', text:'O quadro sai do cliente e chega ao switch na rede local.', blocks:[{cls:'header-link', tag:'ETHERNET', content:'Dst MAC: 11:22:33 | Src MAC: AA:BB:CC', detail:'Switch analisa endereços MAC'}], mac:[['AA:BB:CC','aprendido na Fa0/1']] },
      { layer:'link', indicator:'2/4 Switch decide pela Camada 2', progress:50, packet:'MAC', packetType:'dhcp', pos:'switch', text:'Switch não usa IP para encaminhar dentro da LAN. Ele usa a tabela MAC.', blocks:[{cls:'header-link', tag:'SWITCH L2', content:'Procura Dst MAC 11:22:33', detail:'Encaminha para a porta correta'}], mac:[['AA:BB:CC','Fa0/1'],['11:22:33','Fa0/2']] },
      { layer:'net', indicator:'3/4 Roteador decide pela Camada 3', progress:75, packet:'IP', packetType:'ip', pos:'router', text:'Roteador remove/reescreve o quadro local e olha o IP para escolher a próxima rede.', blocks:[{cls:'header-net', tag:'ROTEADOR L3', content:'Dst IP: 142.250.219.14 | Próximo salto: Internet', detail:'Decisão por rota IP'}] },
      { layer:'app', indicator:'4/4 Servidor processa aplicação', progress:100, packet:'HTTP', packetType:'dns', pos:'server', text:'O servidor recebe os dados e responde pela aplicação correta.', blocks:[{cls:'data-block', tag:'SERVIDOR', content:'HTTP 200 OK', detail:'Aplicação respondeu a requisição'}] },
    ]
  }
};

function el(id){ return document.getElementById(id); }
function showScreen(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); el(id).classList.add('active'); }
function startSimulation(){ showScreen('sim-screen'); updateProtocolLabel(); resetMode(); }
function goHome(){ clearTimeout(state.timer); state.animating=false; showScreen('home-screen'); }

function selectProtocol(proto){
  state.protocol = proto;
  el('btn-tcp').classList.toggle('active', proto === 'TCP');
  el('btn-udp').classList.toggle('active', proto === 'UDP');
  updateProtocolLabel();
  const pdu = proto === 'TCP' ? 'Segmento' : 'Datagrama';
  if (el('trans-pdu')) el('trans-pdu').textContent = pdu;
  if (el('trans-proto-label')) el('trans-proto-label').textContent = `TCP · UDP (usando ${proto})`;
  if (state.step >= 0) renderStep(state.step);
}
function updateProtocolLabel(){ if(el('protocol-label')) el('protocol-label').textContent = state.protocol; }

function setMode(mode){
  if(!MODES[mode]) return;
  state.mode = mode;
  document.querySelectorAll('.mode-tab').forEach(btn=>btn.classList.toggle('active', btn.dataset.mode === mode));
  resetMode();
}

function resetAll(){ setMode('encap'); clearTables(); }
function resetMode(){
  clearTimeout(state.timer); state.animating=false; state.step=-1;
  const mode = MODES[state.mode];
  el('mode-title').textContent = mode.title;
  el('lesson-text').textContent = mode.lesson;
  el('step-indicator').textContent = 'Aguardando…';
  el('progress-bar').style.width = '0%';
  el('encap-box').innerHTML = '<div class="encap-placeholder"><span>▶ Clique em Animar ou Próximo</span></div>';
  el('btn-next').textContent = 'Próximo →';
  resetHighlights();
  movePacket(null);
}
function clearTables(){
  el('mac-table').innerHTML = '<tr><td>Vazia</td><td>Aguardando quadros</td></tr>';
  el('net-table').innerHTML = '<tr><td>google.com</td><td>aguardando consulta</td></tr>';
}
function resetHighlights(){
  document.querySelectorAll('.layer-card,.device').forEach(x=>x.classList.remove('active','done','pulse'));
}

function steps(){ return MODES[state.mode].steps(); }
function nextStep(){
  const current = steps();
  if(state.step >= current.length - 1){ resetMode(); return; }
  state.step++;
  renderStep(state.step);
}
function playCurrentMode(){
  if(state.animating) return;
  state.animating = true;
  state.step = -1;
  nextAuto();
}
function nextAuto(){
  if(!state.animating) return;
  const current = steps();
  if(state.step >= current.length - 1){ state.animating=false; el('btn-next').textContent='↺ Reiniciar'; return; }
  state.step++;
  renderStep(state.step);
  state.timer = setTimeout(nextAuto, MODES[state.mode].autoDelay);
}

function renderStep(index){
  const data = steps()[index];
  el('step-indicator').textContent = data.indicator;
  el('progress-bar').style.width = data.progress + '%';
  el('lesson-text').textContent = data.text;
  renderBlocks(data.blocks);
  highlightLayer(data.layer, index);
  highlightDevice(data.pos);
  movePacket(data.pos, data.packet, data.packetType);
  if(data.mac) renderTable('mac-table', data.mac);
  if(data.net) renderTable('net-table', data.net);
  el('btn-next').textContent = index >= steps().length - 1 ? '↺ Reiniciar' : 'Próximo →';
}

function renderBlocks(blocks){
  const box = el('encap-box');
  box.innerHTML = '';
  blocks.forEach((b, i)=>{
    const div = document.createElement('div');
    div.className = `encap-block ${b.cls}`;
    div.style.animationDelay = `${i * 0.06}s`;
    const tag = document.createElement('span'); tag.className = 'block-tag'; tag.textContent = b.tag;
    const content = document.createElement('span'); content.className = 'block-content'; content.textContent = b.content || '';
    if(b.detail){ const small = document.createElement('small'); small.textContent = b.detail; content.appendChild(small); }
    div.appendChild(tag); div.appendChild(content); box.appendChild(div);
  });
}
function highlightLayer(layerId, index){
  document.querySelectorAll('.layer-card').forEach(card=>{
    const cardLayer = card.dataset.layer;
    const stepIndex = ['app','trans','net','link','phys'].indexOf(cardLayer);
    card.classList.remove('active','done','pulse');
    if(cardLayer === layerId){ card.classList.add('active','pulse'); setTimeout(()=>card.classList.remove('pulse'),650); }
    if(state.mode === 'encap' && stepIndex >= 0 && stepIndex < ['app','trans','net','link','phys'].indexOf(layerId)) card.classList.add('done');
  });
}
function highlightDevice(pos){
  document.querySelectorAll('.device').forEach(d=>d.classList.remove('active'));
  const map = {client:'dev-client', switch:'dev-switch', router:'dev-router', server:'dev-server'};
  if(map[pos]) el(map[pos]).classList.add('active');
}
function movePacket(pos, label='', type=''){
  const p = el('packet');
  p.className = 'packet hidden';
  if(!pos) return;
  p.textContent = label || 'PKT';
  p.classList.remove('hidden');
  p.classList.add(`pos-${pos}`);
  if(type) p.classList.add(type);
}
function renderTable(id, rows){ el(id).innerHTML = rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join(''); }

function clickLayer(layerId){
  const layer = LAYERS.find(l=>l.id === layerId); if(!layer) return;
  showDetail(layer);
  const encapIndex = MODES.encap.steps().findIndex(s=>s.layer === layerId);
  if(state.mode === 'encap' && encapIndex !== -1){ state.step = encapIndex; renderStep(encapIndex); }
}
function showDetail(layer){
  el('detail-title').textContent = `Camada ${layer.number} — ${layer.name}`;
  el('detail-title').style.color = layer.color;
  el('detail-desc').textContent = layer.desc;
  el('detail-protocols').textContent = layer.protocols;
  el('detail-pdu').textContent = layer.pdu;
  el('detail-example').textContent = layer.example;
  el('detail-panel').style.display = 'block';
}
function closeDetail(){ el('detail-panel').style.display = 'none'; }

function explainDevice(device){
  setMode('devices');
  const map = { switch:1, router:2, server:3 };
  state.step = map[device] ?? 0;
  renderStep(state.step);
}
function showTable(){ el('table-modal').classList.add('open'); document.body.style.overflow='hidden'; }
function closeTable(event){ if(!event || event.target === el('table-modal') || event.target.classList.contains('modal-close')){ el('table-modal').classList.remove('open'); document.body.style.overflow=''; } }

document.addEventListener('DOMContentLoaded',()=>{
  showScreen('home-screen');
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape') closeTable(); });
});
