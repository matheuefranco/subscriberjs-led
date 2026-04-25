const URL_BROKER = "wss://broker.hivemq.com:8884/mqtt";
let topicoAtual = "ifsuldeminas/matheusfranco/ledstatus";

const emblemaStatus = document.getElementById("emblemaStatus");
const botaoConectar = document.getElementById("botaoConectar");
const botaoDesconectar = document.getElementById("botaoDesconectar");
const ultimaMensagem = document.getElementById("ultimaMensagem");
const listaHistorico = document.getElementById("listaHistorico");
const textoTopico = document.getElementById("textoTopico");
const entradaTopico = document.getElementById("entradaTopico");
const botaoAplicarTopico = document.getElementById("botaoAplicarTopico");
const circuloLed = document.getElementById("circuloLed");
const textoEstadoLed = document.getElementById("textoEstadoLed");
const cartaoLed = document.getElementById("cartaoLed");

let cliente = null;
const mensagens = [];

function definirStatus(texto, classeCor) {
  emblemaStatus.textContent = texto;
  emblemaStatus.className = `badge ${classeCor}`;
}

function adicionarMensagemNoHistorico(mensagem) {
  const agora = new Date();
  const horario = agora.toLocaleTimeString("pt-BR");

  mensagens.unshift(`${horario} - ${mensagem}`);
  if (mensagens.length > 10) {
    mensagens.pop();
  }

  listaHistorico.innerHTML = "";
  mensagens.forEach((item) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = item;
    listaHistorico.appendChild(li);
  });
}

function atualizarEstadoLed(mensagem) {
  const normalizado = mensagem.trim().toLowerCase();

  if (normalizado === "on") {
    circuloLed.classList.add("led-on");
    textoEstadoLed.textContent = "ON";
    return;
  }

  if (normalizado === "off") {
    circuloLed.classList.remove("led-on");
    textoEstadoLed.textContent = "OFF";
  }
}

function assinarTopico(topico) {
  cliente.subscribe(topico, (erro) => {
    if (erro) {
      definirStatus("Erro no subscribe", "text-bg-danger");
      ultimaMensagem.textContent = `Erro ao assinar o tópico: ${erro.message}`;
      return;
    }

    textoTopico.textContent = topico;
    ultimaMensagem.textContent = `Inscrito no tópico: ${topico}`;
  });
}

function conectar() {
  if (cliente && cliente.connected) return;

  definirStatus("Conectando...", "text-bg-warning");

  cliente = mqtt.connect(URL_BROKER, {
    clientId: `subscriber_${Math.random().toString(16).slice(2, 10)}`,
    clean: true,
    reconnectPeriod: 2000
  });

  cliente.on("connect", () => {
    definirStatus("Conectado", "text-bg-success");
    botaoConectar.disabled = true;
    botaoDesconectar.disabled = false;

    assinarTopico(topicoAtual);
  });

  cliente.on("message", (topico, bufferMensagem) => {
    const mensagem = bufferMensagem.toString();
    ultimaMensagem.innerHTML = `<strong>Mensagem recebida:</strong> ${mensagem} <br><small>Tópico: ${topico}</small>`;
    adicionarMensagemNoHistorico(mensagem);
    atualizarEstadoLed(mensagem);
    cartaoLed.classList.remove("d-none");
  });

  cliente.on("reconnect", () => {
    definirStatus("Reconectando...", "text-bg-warning");
  });

  cliente.on("error", (erro) => {
    definirStatus("Erro", "text-bg-danger");
    ultimaMensagem.textContent = `Erro: ${erro.message}`;
  });

  cliente.on("close", () => {
    definirStatus("Desconectado", "text-bg-secondary");
    botaoConectar.disabled = false;
    botaoDesconectar.disabled = true;
  });
}

function desconectar() {
  if (!cliente) return;
  cliente.end(true);
}

function aplicarTopico() {
  const novoTopico = entradaTopico.value.trim();

  if (!novoTopico) {
    ultimaMensagem.textContent = "Informe um tópico válido.";
    return;
  }

  const topicoAnterior = topicoAtual;
  topicoAtual = novoTopico;
  textoTopico.textContent = topicoAtual;

  if (!cliente || !cliente.connected) {
    ultimaMensagem.textContent = `Tópico atualizado para: ${topicoAtual}`;
    return;
  }

  cliente.unsubscribe(topicoAnterior, () => {
    assinarTopico(topicoAtual);
  });
}

textoTopico.textContent = topicoAtual;
entradaTopico.value = topicoAtual;

botaoConectar.addEventListener("click", conectar);
botaoDesconectar.addEventListener("click", desconectar);
botaoAplicarTopico.addEventListener("click", aplicarTopico);
