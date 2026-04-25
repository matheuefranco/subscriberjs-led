const BROKER_URL = "wss://broker.hivemq.com:8884/mqtt";
let currentTopic = "ifsuldeminas/matheusfranco/ledstatus";

const statusBadge = document.getElementById("statusBadge");
const connectBtn = document.getElementById("connectBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const lastMessage = document.getElementById("lastMessage");
const historyList = document.getElementById("historyList");
const topicText = document.getElementById("topicText");
const topicInput = document.getElementById("topicInput");
const applyTopicBtn = document.getElementById("applyTopicBtn");
const ledCircle = document.getElementById("ledCircle");
const ledStateText = document.getElementById("ledStateText");
const ledCard = document.getElementById("ledCard");

let client = null;
const messages = [];

function setStatus(text, colorClass) {
  statusBadge.textContent = text;
  statusBadge.className = `badge ${colorClass}`;
}

function addMessageToHistory(payload) {
  const now = new Date();
  const timestamp = now.toLocaleTimeString("pt-BR");

  messages.unshift(`${timestamp} - ${payload}`);
  if (messages.length > 10) {
    messages.pop();
  }

  historyList.innerHTML = "";
  messages.forEach((item) => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = item;
    historyList.appendChild(li);
  });
}

function updateLedState(payload) {
  const normalized = payload.trim().toLowerCase();

  if (normalized === "on") {
    ledCircle.classList.add("led-on");
    ledStateText.textContent = "ON";
    return;
  }

  if (normalized === "off") {
    ledCircle.classList.remove("led-on");
    ledStateText.textContent = "OFF";
  }
}

function subscribeToTopic(topic) {
  client.subscribe(topic, (error) => {
    if (error) {
      setStatus("Erro no subscribe", "text-bg-danger");
      lastMessage.textContent = `Erro ao assinar o tópico: ${error.message}`;
      return;
    }

    topicText.textContent = topic;
    lastMessage.textContent = `Inscrito no tópico: ${topic}`;
  });
}

function connect() {
  if (client && client.connected) return;

  setStatus("Conectando...", "text-bg-warning");

  client = mqtt.connect(BROKER_URL, {
    clientId: `subscriber_${Math.random().toString(16).slice(2, 10)}`,
    clean: true,
    reconnectPeriod: 2000
  });

  client.on("connect", () => {
    setStatus("Conectado", "text-bg-success");
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;

    subscribeToTopic(currentTopic);
  });

  client.on("message", (topic, payloadBuffer) => {
    const payload = payloadBuffer.toString();
    lastMessage.innerHTML = `<strong>Mensagem recebida:</strong> ${payload} <br><small>Tópico: ${topic}</small>`;
    addMessageToHistory(payload);
    updateLedState(payload);
    ledCard.classList.remove("d-none");
  });

  client.on("reconnect", () => {
    setStatus("Reconectando...", "text-bg-warning");
  });

  client.on("error", (error) => {
    setStatus("Erro", "text-bg-danger");
    lastMessage.textContent = `Erro: ${error.message}`;
  });

  client.on("close", () => {
    setStatus("Desconectado", "text-bg-secondary");
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
  });
}

function disconnect() {
  if (!client) return;
  client.end(true);
}

function applyTopic() {
  const newTopic = topicInput.value.trim();

  if (!newTopic) {
    lastMessage.textContent = "Informe um tópico válido.";
    return;
  }

  const previousTopic = currentTopic;
  currentTopic = newTopic;
  topicText.textContent = currentTopic;

  if (!client || !client.connected) {
    lastMessage.textContent = `Tópico atualizado para: ${currentTopic}`;
    return;
  }

  client.unsubscribe(previousTopic, () => {
    subscribeToTopic(currentTopic);
  });
}

topicText.textContent = currentTopic;
topicInput.value = currentTopic;

connectBtn.addEventListener("click", connect);
disconnectBtn.addEventListener("click", disconnect);
applyTopicBtn.addEventListener("click", applyTopic);
