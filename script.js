// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyAkNVdAudSyAnNYDCuw6fkZYCNU6fQvL08",
  authDomain: "rf24-pro.firebaseapp.com",
  databaseURL: "https://rf24-pro-default-rtdb.firebaseio.com",
  projectId: "rf24-pro",
  storageBucket: "rf24-pro.firebasestorage.app",
  messagingSenderId: "110975129959",
  appId: "1:110975129959:web:7433f886e225477fd237c2"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ================= ADMINS =================
const ADMINS = [
  {user:"willian1506", pass:"willian123", nome:"Willian"},
  {user:"stormy", pass:"183524", nome:"Stormy"},
  {user:"Mkz", pass:"12456453", nome:"Mkz"}
];

let isAdmin = localStorage.getItem("admin") === "true";
let currentUser = localStorage.getItem("currentUser") || null;

function loginAdmin() {
  let user = prompt("👤 Usuário:");
  if (!user) return false;
  let pass = prompt("🔐 Senha:");
  if (!pass) return false;
  let autorizado = ADMINS.find(a => a.user === user && a.pass === pass);
  if (autorizado) {
    isAdmin = true;
    currentUser = autorizado.nome;
    localStorage.setItem("admin", "true");
    localStorage.setItem("currentUser", autorizado.nome);
    Toast.show(`✅ Login como ${autorizado.nome}!`);
    return true;
  } else {
    Toast.show("❌ Acesso negado!");
    return false;
  }
}

function logoutAdmin() {
  isAdmin = false;
  currentUser = null;
  localStorage.removeItem("admin");
  localStorage.removeItem("currentUser");
  Toast.show("👋 Saiu do admin!");
  location.reload();
}

function openAdmin(el) {
  if (isAdmin) {
    UI.go('admin', el);
    return;
  }
  if (loginAdmin()) UI.go('admin', el);
}

// ================= TOAST =================
const Toast = {
  show(msg) {
    let toastEl = document.getElementById("toast");
    if (toastEl) {
      toastEl.innerText = msg;
      toastEl.style.opacity = "1";
      setTimeout(() => toastEl.style.opacity = "0", 2500);
    }
  }
};

// ================= UI =================
const UI = {
  go(id, el) {
    let screens = document.querySelectorAll(".screen");
    for (let i = 0; i < screens.length; i++) {
      screens[i].classList.remove("active");
    }
    let target = document.getElementById(id);
    if (target) target.classList.add("active");
    let menus = document.querySelectorAll(".menu div");
    for (let i = 0; i < menus.length; i++) {
      menus[i].classList.remove("active");
    }
    if (el) el.classList.add("active");
    if (id === "admin" && isAdmin && Logger.render) Logger.render();
    if (id === "scorers" && Stats.render) Stats.render();
  }
};

// ================= LOADER =================
setTimeout(function() {
  let loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}, 1000);

// ================= DATABASE REF =================
const playersRef = db.ref("players");
const matchesRef = db.ref("matches");
const lineupRef = db.ref("lineup");
const newsRef = db.ref("news");
const standingsRef = db.ref("standings");

let jogadoresLista = [];

playersRef.on("value", (snap) => {
  let dados = snap.val();
  if (dados) {
    jogadoresLista = [];
    for (let id in dados) {
      jogadoresLista.push({
        id: id,
        nome: dados[id].nome,
        nomeLower: dados[id].nome.toLowerCase(),
        img: dados[id].img || "https://via.placeholder.com/40?text=Jogador"
      });
    }
  }
});

function encontrarJogador(nomeDigitado) {
  if (!nomeDigitado) return null;
  let nomeBusca = nomeDigitado.toLowerCase().trim();
  for (let i = 0; i < jogadoresLista.length; i++) {
    if (jogadoresLista[i].nomeLower === nomeBusca || jogadoresLista[i].nomeLower.includes(nomeBusca)) {
      return jogadoresLista[i];
    }
  }
  return null;
}

// ================= ESTATÍSTICAS =================
const Stats = {
  data: {},
  
  processMatches(matches) {
    this.data = {};
    if (!matches) return;
    for (let key in matches) {
      let m = matches[key];
      if (m.gols) {
        m.gols.split("\n").forEach(line => {
          let nomeMatch = line.match(/([a-zA-ZÀ-ÿ]+(?:[0-9]*))/);
          if (nomeMatch) {
            let jogador = encontrarJogador(nomeMatch[1]);
            let nome = jogador ? jogador.nome : nomeMatch[1];
            this.addStat(nome, "gols", 1, jogador?.img);
          }
        });
      }
      if (m.assistencias) {
        m.assistencias.split("\n").forEach(line => {
          let nomeMatch = line.match(/([a-zA-ZÀ-ÿ]+(?:[0-9]*))/);
          if (nomeMatch) {
            let jogador = encontrarJogador(nomeMatch[1]);
            let nome = jogador ? jogador.nome : nomeMatch[1];
            this.addStat(nome, "assistencias", 1, jogador?.img);
          }
        });
      }
      if (m.defesas) {
        m.defesas.split("\n").forEach(line => {
          let nomeMatch = line.match(/([a-zA-ZÀ-ÿ]+(?:[0-9]*))/);
          let qtdMatch = line.match(/(\d+)\s*defesas/);
          if (nomeMatch) {
            let jogador = encontrarJogador(nomeMatch[1]);
            let nome = jogador ? jogador.nome : nomeMatch[1];
            let qtd = qtdMatch ? parseInt(qtdMatch[1]) : 1;
            this.addStat(nome, "defesas", qtd, jogador?.img);
          }
        });
      }
      if (m.mvp) {
        let jogador = encontrarJogador(m.mvp);
        let nome = jogador ? jogador.nome : m.mvp;
        this.addStat(nome, "mvps", 1, jogador?.img);
      }
      [m.menc1, m.menc2, m.menc3].forEach(men => {
        if (men) {
          let jogador = encontrarJogador(men);
          let nome = jogador ? jogador.nome : men;
          this.addStat(nome, "mensoes", 1, jogador?.img);
        }
      });
    }
  },
  
  addStat(nome, tipo, valor, imagem) {
    if (!this.data[nome]) {
      this.data[nome] = {
        gols: 0, assistencias: 0, defesas: 0, mvps: 0, mensoes: 0,
        total: 0, img: imagem || "https://via.placeholder.com/60?text=Jogador"
      };
    }
    this.data[nome][tipo] += valor;
    this.data[nome].total = this.data[nome].gols + this.data[nome].assistencias + this.data[nome].defesas;
  },
  
  render() {
    let container = document.getElementById("statsList");
    if (!container) return;
    matchesRef.once("value", snap => {
      this.processMatches(snap.val());
      let keys = Object.keys(this.data);
      if (keys.length === 0) {
        container.innerHTML = '<div class="no-stats">📊 Nenhuma estatística disponível</div>';
        return;
      }
      let sorted = [];
      for (let nome in this.data) {
        sorted.push({ nome: nome, gols: this.data[nome].gols, stats: this.data[nome] });
      }
      sorted.sort((a, b) => b.gols - a.gols);
      container.innerHTML = "";
      for (let i = 0; i < sorted.length; i++) {
        let s = sorted[i].stats;
        container.innerHTML += `
        <div class="stats-card">
          <div class="stats-rank">${i + 1}º</div>
          <div class="stats-player-img"><img src="${s.img}" class="stats-img" onerror="this.src='https://via.placeholder.com/60?text=Jogador'"></div>
          <div class="stats-player-info"><div class="stats-player-name">${sorted[i].nome}</div></div>
          <div class="stats-numbers">
            <div class="stat-item"><span class="stat-icon">⚽</span><span class="stat-value">${s.gols}</span><span class="stat-label">Gols</span></div>
            <div class="stat-item"><span class="stat-icon">👟</span><span class="stat-value">${s.assistencias}</span><span class="stat-label">Assist.</span></div>
            <div class="stat-item"><span class="stat-icon">🧤</span><span class="stat-value">${s.defesas}</span><span class="stat-label">Defesas</span></div>
            <div class="stat-item"><span class="stat-icon">🏆</span><span class="stat-value">${s.mvps}</span><span class="stat-label">MVP</span></div>
            <div class="stat-item"><span class="stat-icon">📋</span><span class="stat-value">${s.mensoes}</span><span class="stat-label">Menções</span></div>
          </div>
          <div class="stats-total"><span>🎯 Total: ${s.total}</span></div>
        </div>`;
      }
    });
  }
};

// ================= PLAYERS =================
const Player = {
  add() {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); return; }
    let nomeInp = document.getElementById("nome");
    if (!nomeInp.value.trim()) { Toast.show("Digite o nome!"); return; }
    playersRef.push({
      nome: nomeInp.value,
      img: document.getElementById("img").value || "https://via.placeholder.com/150?text=Jogador",
      ovr: parseInt(document.getElementById("ovr").value) || 0,
      pac: document.getElementById("pac").value || "0",
      sho: document.getElementById("sho").value || "0",
      pas: document.getElementById("pas").value || "0",
      dri: document.getElementById("dri").value || "0",
      def: document.getElementById("def").value || "0",
      phy: document.getElementById("phy").value || "0"
    }).then(() => {
      Logger.add("➕ Adicionou Jogador", "Nome: " + nomeInp.value);
      Toast.show("Jogador salvo!");
    });
    document.getElementById("nome").value = "";
    document.getElementById("img").value = "";
    document.getElementById("ovr").value = "";
    document.getElementById("pac").value = "";
    document.getElementById("sho").value = "";
    document.getElementById("pas").value = "";
    document.getElementById("dri").value = "";
    document.getElementById("def").value = "";
    document.getElementById("phy").value = "";
  },
  
  edit(id, jogador) {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); return; }
    document.getElementById("editId").value = id;
    document.getElementById("editNome").value = jogador.nome || "";
    document.getElementById("editImg").value = jogador.img || "";
    document.getElementById("editOvr").value = jogador.ovr || 0;
    document.getElementById("editPac").value = jogador.pac || "0";
    document.getElementById("editSho").value = jogador.sho || "0";
    document.getElementById("editPas").value = jogador.pas || "0";
    document.getElementById("editDri").value = jogador.dri || "0";
    document.getElementById("editDef").value = jogador.def || "0";
    document.getElementById("editPhy").value = jogador.phy || "0";
    document.getElementById("editModal").style.display = "flex";
  },
  
  update() {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); this.closeModal(); return; }
    let id = document.getElementById("editId").value;
    if (!id) return;
    playersRef.child(id).update({
      nome: document.getElementById("editNome").value,
      img: document.getElementById("editImg").value || "https://via.placeholder.com/150?text=Jogador",
      ovr: parseInt(document.getElementById("editOvr").value) || 0,
      pac: document.getElementById("editPac").value || "0",
      sho: document.getElementById("editSho").value || "0",
      pas: document.getElementById("editPas").value || "0",
      dri: document.getElementById("editDri").value || "0",
      def: document.getElementById("editDef").value || "0",
      phy: document.getElementById("editPhy").value || "0"
    }).then(() => {
      Logger.add("✏️ Editou Jogador", "Nome: " + document.getElementById("editNome").value);
      Toast.show("Jogador atualizado!");
      this.closeModal();
    });
  },
  
  delete() {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); this.closeModal(); return; }
    let id = document.getElementById("editId").value;
    if (!id) return;
    if (confirm("⚠️ Excluir este jogador?")) {
      playersRef.child(id).remove().then(() => {
        Logger.add("🗑️ Excluiu Jogador", "ID: " + id);
        Toast.show("Jogador excluído!");
        this.closeModal();
      });
    }
  },
  
  closeModal() {
    document.getElementById("editModal").style.display = "none";
  },
  
  render(data) {
    let container = document.getElementById("playersList");
    if (!container) return;
    container.innerHTML = "";
    if (!data) return;
    
    let jogadores = [];
    for (let id in data) {
      jogadores.push({ id: id, dados: data[id] });
    }
    jogadores.sort((a, b) => b.dados.ovr - a.dados.ovr);
    
    if (!isAdmin) {
      for (let i = 0; i < jogadores.length; i++) {
        let p = jogadores[i].dados;
        container.innerHTML += `
        <div class="player-card-full">
          <img src="${p.img}" onerror="this.src='https://via.placeholder.com/150?text=Jogador'">
          <h3>${p.nome}</h3>
          <div class="player-ovr">OVR ${p.ovr}</div>
          <div class="player-attrs-grid">
            <div class="attr-item"><span>⚡</span> ${p.pac}</div>
            <div class="attr-item"><span>🎯</span> ${p.sho}</div>
            <div class="attr-item"><span>🎯</span> ${p.pas}</div>
            <div class="attr-item"><span>💫</span> ${p.dri}</div>
            <div class="attr-item"><span>🛡️</span> ${p.def}</div>
            <div class="attr-item"><span>💪</span> ${p.phy}</div>
          </div>
          <div class="view-only-badge">👀 Visualização</div>
        </div>`;
      }
      return;
    }
    
    for (let i = 0; i < jogadores.length; i++) {
      let p = jogadores[i].dados;
      let id = jogadores[i].id;
      let jogadorJSON = JSON.stringify(p).replace(/"/g, '&quot;');
      container.innerHTML += `
      <div class="player-card-full admin-card" onclick="Player.edit('${id}', ${jogadorJSON})">
        <img src="${p.img}" onerror="this.src='https://via.placeholder.com/150?text=Jogador'">
        <h3>${p.nome}</h3>
        <div class="player-ovr">OVR ${p.ovr}</div>
        <div class="player-attrs-grid">
          <div class="attr-item"><span>⚡</span> ${p.pac}</div>
          <div class="attr-item"><span>🎯</span> ${p.sho}</div>
          <div class="attr-item"><span>🎯</span> ${p.pas}</div>
          <div class="attr-item"><span>💫</span> ${p.dri}</div>
          <div class="attr-item"><span>🛡️</span> ${p.def}</div>
          <div class="attr-item"><span>💪</span> ${p.phy}</div>
        </div>
        <div class="edit-badge">✏️ Clique para editar</div>
      </div>`;
    }
  }
};

// ================= MATCHES =================
const Match = {
  formatGols(input) {
    if (!input || !input.trim()) return "";
    return input.split("\n").map(line => {
      let parts = line.trim().split(/\s+/);
      return parts.length >= 2 ? `${parts[0]}⚽ ${parts[1]}'` : `${parts[0]}⚽`;
    }).join("\n");
  },
  formatAssists(input) {
    if (!input || !input.trim()) return "";
    return input.split("\n").map(line => {
      let parts = line.trim().split(/\s+/);
      return parts.length >= 2 ? `${parts[0]}👟 ${parts[1]}'` : `${parts[0]}👟`;
    }).join("\n");
  },
  formatDefesas(input) {
    if (!input || !input.trim()) return "";
    return input.split("\n").map(line => {
      let parts = line.trim().split(/\s+/);
      return parts.length >= 2 ? `${parts[0]}🧤 ${parts[1]} defesas` : `${parts[0]}🧤`;
    }).join("\n");
  },
  formatCartoes(input) {
    if (!input || !input.trim()) return "";
    return input.split("\n").map(line => {
      let parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        let emoji = parts[2].toLowerCase().includes("vermelho") ? "🟥" : "🟨";
        return `${parts[0]}${emoji} ${parts[1]}'`;
      }
      return parts.length >= 2 ? `${parts[0]}🟨 ${parts[1]}'` : `${parts[0]}🟨`;
    }).join("\n");
  },
  
  add() {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); return; }
    let timeA = document.getElementById("timeA");
    let timeB = document.getElementById("timeB");
    if (!timeA.value || !timeB.value) { Toast.show("Preencha os times!"); return; }
    
    let dataPartida = "";
    let partidaData = document.getElementById("partidaData");
    let partidaHora = document.getElementById("partidaHora");
    if (partidaData && partidaData.value) {
      let d = new Date(partidaData.value);
      dataPartida = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      if (partidaHora && partidaHora.value) dataPartida += ` - ${partidaHora.value}`;
    } else {
      let a = new Date();
      dataPartida = `${a.getDate().toString().padStart(2, '0')}/${(a.getMonth() + 1).toString().padStart(2, '0')}/${a.getFullYear()} - ${a.getHours().toString().padStart(2, '0')}:${a.getMinutes().toString().padStart(2, '0')}`;
    }
    
    matchesRef.push({
      timeA: timeA.value, timeB: timeB.value,
      timeALogo: document.getElementById("timeALogo").value || null,
      timeBLogo: document.getElementById("timeBLogo").value || null,
      ligaLogo: document.getElementById("ligaLogo").value || null,
      tipoPartida: document.getElementById("tipoPartida").value,
      placar: document.getElementById("placar").value || "0x0",
      gols: this.formatGols(document.getElementById("golsList").value),
      assistencias: this.formatAssists(document.getElementById("assistsList").value),
      defesas: this.formatDefesas(document.getElementById("defesasList").value),
      cartoes: this.formatCartoes(document.getElementById("cartoesList").value),
      mvp: document.getElementById("mvp").value,
      menc1: document.getElementById("men1").value,
      menc2: document.getElementById("men2").value,
      menc3: document.getElementById("men3").value,
      observacoes: document.getElementById("obsPartida").value,
      dataPartida: dataPartida,
      timestamp: Date.now()
    }).then(() => {
      Logger.add("⚽ Adicionou Partida", `${timeA.value} ${document.getElementById("placar").value} ${timeB.value}`);
      Toast.show("Partida salva!");
    });
    
    timeA.value = timeB.value = "";
    document.getElementById("timeALogo").value = "";
    document.getElementById("timeBLogo").value = "";
    document.getElementById("ligaLogo").value = "";
    document.getElementById("placar").value = "";
    document.getElementById("golsList").value = "";
    document.getElementById("assistsList").value = "";
    document.getElementById("defesasList").value = "";
    document.getElementById("cartoesList").value = "";
    document.getElementById("mvp").value = "";
    document.getElementById("men1").value = "";
    document.getElementById("men2").value = "";
    document.getElementById("men3").value = "";
    document.getElementById("obsPartida").value = "";
    if (partidaData) partidaData.value = "";
    if (partidaHora) partidaHora.value = "";
  },
  
  edit(id, match) {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); return; }
    document.getElementById("editMatchId").value = id;
    document.getElementById("editMatchTimeA").value = match.timeA || "";
    document.getElementById("editMatchTimeB").value = match.timeB || "";
    document.getElementById("editMatchPlacar").value = match.placar || "";
    document.getElementById("editMatchGols").value = this.parseStats(match.gols);
    document.getElementById("editMatchAssists").value = this.parseStats(match.assistencias);
    document.getElementById("editMatchDefesas").value = this.parseStats(match.defesas);
    document.getElementById("editMatchCartoes").value = this.parseStats(match.cartoes);
    document.getElementById("editMatchMvp").value = match.mvp || "";
    document.getElementById("editMatchModal").style.display = "flex";
  },
  
  parseStats(input) {
    if (!input) return "";
    return input.split("\n").map(line => {
      return line.replace(/[⚽👟🧤🟨🟥]/g, '').replace(/\s*'\s*/g, '').replace(/defesas/g, '').trim();
    }).join("\n");
  },
  
  update() {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); this.closeModal(); return; }
    let id = document.getElementById("editMatchId").value;
    if (!id) return;
    
    let gols = document.getElementById("editMatchGols").value;
    let assists = document.getElementById("editMatchAssists").value;
    let defesas = document.getElementById("editMatchDefesas").value;
    let cartoes = document.getElementById("editMatchCartoes").value;
    
    matchesRef.child(id).update({
      timeA: document.getElementById("editMatchTimeA").value,
      timeB: document.getElementById("editMatchTimeB").value,
      placar: document.getElementById("editMatchPlacar").value,
      gols: this.formatGols(gols),
      assistencias: this.formatAssists(assists),
      defesas: this.formatDefesas(defesas),
      cartoes: this.formatCartoes(cartoes),
      mvp: document.getElementById("editMatchMvp").value
    }).then(() => {
      Logger.add("✏️ Editou Partida", `ID: ${id}`);
      Toast.show("Partida atualizada!");
      this.closeModal();
    });
  },
  
  deleteMatch() {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); this.closeModal(); return; }
    let id = document.getElementById("editMatchId").value;
    if (!id) return;
    if (confirm("⚠️ Excluir esta partida?")) {
      matchesRef.child(id).remove().then(() => {
        Logger.add("🗑️ Excluiu Partida", `ID: ${id}`);
        Toast.show("Partida excluída!");
        this.closeModal();
      });
    }
  },
  
  closeModal() {
    document.getElementById("editMatchModal").style.display = "none";
  },
  
  renderLineupPlayers(players) {
    if (!players || players.length === 0) return '<div class="no-players">Nenhum jogador definido</div>';
    return players.map(p => `
      <div class="lineup-player">
        <img src="${p.img || 'https://via.placeholder.com/30?text=Jogador'}" onerror="this.src='https://via.placeholder.com/30?text=Jogador'">
        <span>${p.nome}</span>
      </div>
    `).join('');
  },
  
  render(data) {
    let matchesContainer = document.getElementById("matchesList");
    let tableContainer = document.getElementById("tableList");
    if (!matchesContainer || !tableContainer) return;
    matchesContainer.innerHTML = "";
    tableContainer.innerHTML = "";
    let tabela = {};
    
    if (!data) return;
    for (let key in data) {
      let m = data[key];
      const editButton = isAdmin ? `<button class="match-edit-btn" onclick="Match.edit('${key}', ${JSON.stringify(m).replace(/"/g, '&quot;')})">✏️ Editar</button>` : '';
      const lineupButton = isAdmin ? `<button class="match-lineup-btn" onclick="openMatchLineupModal('${key}')">📋 Escalação</button>` : '';
      
      matchesContainer.innerHTML += `
      <div class="match-full-card">
        <div class="match-header">
          <div class="match-liga-info">${m.ligaLogo ? '<img src="' + m.ligaLogo + '" class="liga-logo">' : '<div class="liga-logo-placeholder">🏆</div>'}<span class="match-type">${m.tipoPartida === 'liga' ? '🏆 LIGA' : m.tipoPartida === 'copa' ? '🏅 COPA' : '🤝 AMISTOSO'}</span></div>
          <div class="match-date-time">📅 ${m.dataPartida || "Data não informada"} ${editButton} ${lineupButton}</div>
        </div>
        <div class="match-teams-container">
          <div class="match-team-box"><div class="team-logo-wrapper">${m.timeALogo ? '<img src="' + m.timeALogo + '" class="team-logo-big">' : '<div class="team-logo-placeholder">⚽</div>'}</div><h3>${m.timeA}</h3></div>
          <div class="match-score-big">${m.placar}</div>
          <div class="match-team-box"><div class="team-logo-wrapper">${m.timeBLogo ? '<img src="' + m.timeBLogo + '" class="team-logo-big">' : '<div class="team-logo-placeholder">⚽</div>'}</div><h3>${m.timeB}</h3></div>
        </div>
        <div class="match-stats-grid">
          ${m.gols ? '<div class="stat-section"><div class="stat-title">⚽ GOLS</div><div class="stat-content">' + m.gols.replace(/\n/g, '<br>') + '</div></div>' : ''}
          ${m.assistencias ? '<div class="stat-section"><div class="stat-title">👟 ASSISTÊNCIAS</div><div class="stat-content">' + m.assistencias.replace(/\n/g, '<br>') + '</div></div>' : ''}
          ${m.defesas ? '<div class="stat-section"><div class="stat-title">🧤 DEFESAS</div><div class="stat-content">' + m.defesas.replace(/\n/g, '<br>') + '</div></div>' : ''}
          ${m.cartoes ? '<div class="stat-section"><div class="stat-title">🟨🟥 CARTÕES</div><div class="stat-content">' + m.cartoes.replace(/\n/g, '<br>') + '</div></div>' : ''}
        </div>
        <div class="match-awards">
          ${m.mvp ? '<div class="mvp-section"><div class="mvp-title">🏆 MVP</div><div class="mvp-name">⭐ ' + m.mvp + '</div></div>' : ''}
          ${(m.menc1 || m.menc2 || m.menc3) ? '<div class="mentions-section"><div class="mentions-title">📋 MENÇÕES</div><div class="mentions-list">' + (m.menc1 ? '<div>🥇 ' + m.menc1 + '</div>' : '') + (m.menc2 ? '<div>🥈 ' + m.menc2 + '</div>' : '') + (m.menc3 ? '<div>🥉 ' + m.menc3 + '</div>' : '') + '</div></div>' : ''}
        </div>
        ${m.observacoes ? '<div class="match-observations"><div class="obs-title">📝 OBSERVAÇÕES</div><div class="obs-content">' + m.observacoes + '</div></div>' : ''}
        
        ${m.lineup ? `
        <div class="match-lineup-section">
          <div class="match-lineup-header" onclick="toggleMatchLineup(this)">
            <span>📋 Escalação da Partida</span>
            <span class="toggle-icon">▼</span>
          </div>
          <div class="match-lineup-content" style="display: block;">
            <div class="match-lineup-starters">
              <h4>⚽ Titulares</h4>
              <div class="match-lineup-players">${this.renderLineupPlayers(m.lineup.starters)}</div>
            </div>
            <div class="match-lineup-subs">
              <h4>🔄 Reservas</h4>
              <div class="match-lineup-players">${this.renderLineupPlayers(m.lineup.subs)}</div>
            </div>
            ${m.lineup.coach && m.lineup.coach.length ? `
            <div class="match-lineup-coach">
              <h4>📋 Técnico</h4>
              <div class="match-lineup-players">${this.renderLineupPlayers(m.lineup.coach)}</div>
            </div>` : ''}
          </div>
        </div>` : ''}
      </div>`;
      
      let placarParts = (m.placar || "0x0").split("x");
      let g1 = parseInt(placarParts[0]) || 0;
      let g2 = parseInt(placarParts[1]) || 0;
      
      if (!tabela[m.timeA]) tabela[m.timeA] = { p: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 };
      if (!tabela[m.timeB]) tabela[m.timeB] = { p: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 };
      tabela[m.timeA].gp += g1;
      tabela[m.timeA].gc += g2;
      tabela[m.timeB].gp += g2;
      tabela[m.timeB].gc += g1;
      if (g1 > g2) {
        tabela[m.timeA].p += 3;
        tabela[m.timeA].v++;
        tabela[m.timeB].d++;
      } else if (g2 > g1) {
        tabela[m.timeB].p += 3;
        tabela[m.timeB].v++;
        tabela[m.timeA].d++;
      } else {
        tabela[m.timeA].p++;
        tabela[m.timeB].p++;
        tabela[m.timeA].e++;
        tabela[m.timeB].e++;
      }
    }
    
    let timesOrdenados = [];
    for (let time in tabela) {
      timesOrdenados.push({ nome: time, pontos: tabela[time].p, stats: tabela[time] });
    }
    timesOrdenados.sort((a, b) => b.pontos - a.pontos);
    for (let i = 0; i < timesOrdenados.length; i++) {
      let s = timesOrdenados[i].stats;
      tableContainer.innerHTML += `<div class="table-card"><div class="table-position">${i + 1}º</div><div class="table-team">${timesOrdenados[i].nome}</div><div class="table-stats">${s.v}V/${s.e}E/${s.d}D</div><div class="table-goals">${s.gp}:${s.gc}</div><div class="table-points">${s.p} pts</div></div>`;
    }
  }
};

// ================= LINEUP =================
const Lineup = {
  add() {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); return; }
    let pNome = document.getElementById("pNome");
    if (!pNome.value.trim()) { Toast.show("Digite o nome!"); return; }
    let jogador = encontrarJogador(pNome.value);
    lineupRef.push({ nome: pNome.value, x: 50, y: 50, img: jogador?.img || null }).then(() => {
      Logger.add("📋 Adicionou à Escalação", "Jogador: " + pNome.value);
      Toast.show("Jogador adicionado!");
    });
    pNome.value = "";
  },
  render(data) {
    let field = document.getElementById("field");
    if (!field) return;
    field.innerHTML = "";
    if (!data) return;
    
    for (let id in data) {
      let p = data[id];
      let el = document.createElement("div");
      el.className = "player";
      el.innerHTML = p.img ? `<img src="${p.img}" class="player-img" onerror="this.style.display='none'"><span>${p.nome}</span>` : `<span>${p.nome}</span>`;
      el.style.left = p.x + "%";
      el.style.top = p.y + "%";
      
      let dragging = false;
      let startX, startY, startLeft, startTop;
      
      el.onmousedown = (function(id, el) {
        return function(e) {
          e.preventDefault();
          dragging = true;
          startX = e.clientX;
          startY = e.clientY;
          startLeft = parseFloat(el.style.left);
          startTop = parseFloat(el.style.top);
          el.style.cursor = "grabbing";
          
          document.onmousemove = function(e) {
            if (!dragging) return;
            let rect = field.getBoundingClientRect();
            let newX = startLeft + ((e.clientX - startX) / rect.width) * 100;
            let newY = startTop + ((e.clientY - startY) / rect.height) * 100;
            newX = Math.min(Math.max(newX, 0), 100);
            newY = Math.min(Math.max(newY, 0), 100);
            el.style.left = newX + "%";
            el.style.top = newY + "%";
            lineupRef.child(id).update({ x: newX, y: newY });
          };
          
          document.onmouseup = function() {
            dragging = false;
            el.style.cursor = "grab";
            document.onmousemove = null;
            document.onmouseup = null;
          };
        };
      })(id, el);
      
      field.appendChild(el);
    }
  }
};

// ================= NOTÍCIAS =================
const News = {
  add() {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores podem adicionar notícias!"); return; }
    
    let title = document.getElementById("newsTitle").value.trim();
    let image = document.getElementById("newsImage").value.trim();
    let desc = document.getElementById("newsDesc").value.trim();
    
    if (!title) { Toast.show("Digite o título da notícia!"); return; }
    if (!desc) { Toast.show("Digite a descrição da notícia!"); return; }
    
    newsRef.push({
      titulo: title,
      imagem: image || "https://via.placeholder.com/400x200?text=Sem+Imagem",
      descricao: desc,
      data: new Date().toLocaleString(),
      timestamp: Date.now()
    }).then(() => {
      Logger.add("📰 Adicionou Notícia", `Título: ${title}`);
      Toast.show("Notícia publicada!");
    });
    
    document.getElementById("newsTitle").value = "";
    document.getElementById("newsImage").value = "";
    document.getElementById("newsDesc").value = "";
  },
  
  edit(id, noticia) {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); return; }
    document.getElementById("editNewsId").value = id;
    document.getElementById("editNewsTitle").value = noticia.titulo || "";
    document.getElementById("editNewsImage").value = noticia.imagem || "";
    document.getElementById("editNewsDesc").value = noticia.descricao || "";
    document.getElementById("editNewsModal").style.display = "flex";
  },
  
  update() {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); this.closeModal(); return; }
    let id = document.getElementById("editNewsId").value;
    if (!id) return;
    
    newsRef.child(id).update({
      titulo: document.getElementById("editNewsTitle").value,
      imagem: document.getElementById("editNewsImage").value || "https://via.placeholder.com/400x200?text=Sem+Imagem",
      descricao: document.getElementById("editNewsDesc").value
    }).then(() => {
      Logger.add("✏️ Editou Notícia", `ID: ${id}`);
      Toast.show("Notícia atualizada!");
      this.closeModal();
    });
  },
  
  deleteNews() {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); this.closeModal(); return; }
    let id = document.getElementById("editNewsId").value;
    if (!id) return;
    if (confirm("⚠️ Excluir esta notícia?")) {
      newsRef.child(id).remove().then(() => {
        Logger.add("🗑️ Excluiu Notícia", `ID: ${id}`);
        Toast.show("Notícia excluída!");
        this.closeModal();
      });
    }
  },
  
  closeModal() {
    document.getElementById("editNewsModal").style.display = "none";
  },
  
  render(data) {
    let container = document.getElementById("newsList");
    if (!container) return;
    container.innerHTML = "";
    
    if (!data) {
      container.innerHTML = '<div class="no-news">📭 Nenhuma notícia publicada ainda</div>';
      return;
    }
    
    let noticias = [];
    for (let id in data) {
      noticias.push({ id: id, dados: data[id] });
    }
    noticias.sort((a, b) => (b.dados.timestamp || 0) - (a.dados.timestamp || 0));
    
    for (let i = 0; i < noticias.length; i++) {
      let n = noticias[i].dados;
      let id = noticias[i].id;
      
      const editButton = isAdmin ? `<button class="news-edit-btn" onclick="News.edit('${id}', ${JSON.stringify(n).replace(/"/g, '&quot;')})">✏️ Editar</button>` : '';
      const deleteButton = isAdmin ? `<button class="news-delete-btn" onclick="News.deleteNewsById('${id}', '${n.titulo.replace(/'/g, "\\'")}')">🗑️ Deletar</button>` : '';
      
      container.innerHTML += `
      <div class="news-card">
        <div class="news-image">
          <img src="${n.imagem}" onerror="this.src='https://via.placeholder.com/400x200?text=Imagem+não+disponível'">
          <div class="news-actions">${editButton} ${deleteButton}</div>
        </div>
        <div class="news-content">
          <div class="news-header">
            <h3 class="news-title">${n.titulo}</h3>
            <span class="news-date">📅 ${n.data || "Data não informada"}</span>
          </div>
          <p class="news-description">${n.descricao}</p>
        </div>
      </div>`;
    }
  },
  
  deleteNewsById(id, titulo) {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores podem deletar notícias!"); return; }
    if (confirm(`⚠️ Tem certeza que deseja deletar a notícia "${titulo}"?`)) {
      newsRef.child(id).remove().then(() => {
        Logger.add("🗑️ Deletou Notícia", `Título: ${titulo}`);
        Toast.show("Notícia deletada!");
      });
    }
  }
};

// ================= TABELA MANUAL =================
const Standings = {
  addOrUpdate() {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); return; }
    
    let time = document.getElementById("tableTeam").value.trim();
    let pontos = parseInt(document.getElementById("tablePts").value) || 0;
    let jogos = parseInt(document.getElementById("tablePj").value) || 0;
    let vitorias = parseInt(document.getElementById("tableV").value) || 0;
    let empates = parseInt(document.getElementById("tableE").value) || 0;
    let derrotas = parseInt(document.getElementById("tableD").value) || 0;
    let golsPro = parseInt(document.getElementById("tableGp").value) || 0;
    let golsContra = parseInt(document.getElementById("tableGc").value) || 0;
    
    if (!time) { Toast.show("Digite o nome do time!"); return; }
    
    const saldoGols = golsPro - golsContra;
    
    standingsRef.orderByChild("time").equalTo(time).once("value", snap => {
      let exists = false;
      let id = null;
      snap.forEach(child => {
        exists = true;
        id = child.key;
      });
      
      const data = {
        time: time,
        pontos: pontos,
        jogos: jogos,
        vitorias: vitorias,
        empates: empates,
        derrotas: derrotas,
        golsPro: golsPro,
        golsContra: golsContra,
        saldoGols: saldoGols,
        timestamp: Date.now()
      };
      
      if (exists && id) {
        standingsRef.child(id).update(data).then(() => {
          Logger.add("✏️ Editou Time na Tabela", `${time} | ${pontos} pts`);
          Toast.show("Time atualizado!");
        });
      } else {
        standingsRef.push(data).then(() => {
          Logger.add("➕ Adicionou Time na Tabela", `${time} | ${pontos} pts`);
          Toast.show("Time adicionado!");
        });
      }
    });
    
    document.getElementById("tableTeam").value = "";
    document.getElementById("tablePts").value = "";
    document.getElementById("tablePj").value = "";
    document.getElementById("tableV").value = "";
    document.getElementById("tableE").value = "";
    document.getElementById("tableD").value = "";
    document.getElementById("tableGp").value = "";
    document.getElementById("tableGc").value = "";
  },
  
  delete(timeId, timeName) {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); return; }
    if (confirm(`⚠️ Remover ${timeName} da tabela?`)) {
      standingsRef.child(timeId).remove().then(() => {
        Logger.add("🗑️ Removeu Time da Tabela", timeName);
        Toast.show("Time removido!");
      });
    }
  },
  
  render(data) {
    let container = document.getElementById("tableList");
    if (!container) return;
    container.innerHTML = "";
    
    if (!data) {
      container.innerHTML = '<div class="no-stats">🏆 Nenhum time cadastrado na tabela</div>';
      return;
    }
    
    let times = [];
    for (let id in data) {
      times.push({ id: id, dados: data[id] });
    }
    times.sort((a, b) => {
      if (a.dados.pontos !== b.dados.pontos) return b.dados.pontos - a.dados.pontos;
      return b.dados.saldoGols - a.dados.saldoGols;
    });
    
    for (let i = 0; i < times.length; i++) {
      let t = times[i].dados;
      let id = times[i].id;
      
      const deleteBtn = isAdmin ? `<button class="table-delete-btn" onclick="Standings.delete('${id}', '${t.time.replace(/'/g, "\\'")}')">🗑️</button>` : '';
      
      container.innerHTML += `
      <div class="table-card">
        <div class="table-position">${i + 1}º</div>
        <div class="table-team">${t.time}</div>
        <div class="table-stats">${t.vitorias}V/${t.empates}E/${t.derrotas}D</div>
        <div class="table-goals">${t.golsPro}:${t.golsContra}</div>
        <div class="table-points">${t.pontos} pts</div>
        ${deleteBtn}
      </div>`;
    }
  }
};

// ================= LOGGER =================
const Logger = {
  add(action, details) {
    if (!currentUser) return;
    db.ref("logs").push({
      usuario: currentUser,
      acao: action,
      detalhes: details,
      data: new Date().toLocaleString(),
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  },
  render() {
    let container = document.getElementById("logsList");
    if (!container) return;
    db.ref("logs").orderByChild("timestamp").once("value", snap => {
      container.innerHTML = "";
      let logs = snap.val();
      if (!logs) {
        container.innerHTML = '<div class="no-logs">📭 Nenhum log</div>';
        return;
      }
      let logsArray = Object.entries(logs).sort((a, b) => b[1].timestamp - a[1].timestamp);
      for (let i = 0; i < logsArray.length; i++) {
        let log = logsArray[i][1];
        let icon = "📝";
        if (log.acao.includes("Jogador")) icon = "👤";
        else if (log.acao.includes("Partida")) icon = "⚽";
        else if (log.acao.includes("Reset")) icon = "⚠️";
        container.innerHTML += `
        <div class="log-item">
          <div class="log-header">
            <span class="log-icon">${icon}</span>
            <span class="log-usuario">${log.usuario}</span>
            <span class="log-data">📅 ${log.data}</span>
          </div>
          <div class="log-acao">${log.acao}</div>
          <div class="log-detalhes">${log.detalhes}</div>
        </div>`;
      }
      let logCount = document.getElementById("logCount");
      if (logCount) logCount.textContent = `${logsArray.length} logs`;
    });
  }
};

// ================= SYSTEM =================
const System = {
  reset() {
    if (!isAdmin) { Toast.show("Sem permissão!"); return; }
    if (confirm("⚠️ Resetar todos os dados? (LOGS serão mantidos)")) {
      playersRef.set(null);
      matchesRef.set(null);
      lineupRef.set(null);
      newsRef.set(null);
      standingsRef.set(null);
      Logger.add("⚠️ Reset Total", "Dados apagados");
      Toast.show("Dados resetados!");
      setTimeout(() => location.reload(), 1500);
    }
  }
};

// ================= VARIÁVEIS GLOBAIS PARA LINEUP DA PARTIDA =================
let currentMatchLineupId = null;
let currentLineupType = null;

// ================= FUNÇÕES PARA LINEUP DA PARTIDA =================
function openMatchLineupModal(matchId) {
  if (!isAdmin) { Toast.show("🔒 Apenas administradores!"); return; }
  currentMatchLineupId = matchId;
  document.getElementById("matchLineupId").value = matchId;
  loadMatchLineup(matchId);
  document.getElementById("editMatchLineupModal").style.display = "flex";
}

function closeMatchLineupModal() {
  document.getElementById("editMatchLineupModal").style.display = "none";
  currentMatchLineupId = null;
}

function closeAddPlayerModal() {
  document.getElementById("addPlayerToLineupModal").style.display = "none";
  currentLineupType = null;
}

function addPlayerToMatchLineup(type) {
  currentLineupType = type;
  const select = document.getElementById("playerSelect");
  select.innerHTML = '<option value="">Selecione um jogador</option>';
  
  playersRef.once("value", snap => {
    const dados = snap.val();
    if (dados) {
      for (let id in dados) {
        const option = document.createElement("option");
        option.value = id;
        option.textContent = dados[id].nome;
        select.appendChild(option);
      }
    }
  });
  
  document.getElementById("addPlayerToLineupModal").style.display = "flex";
}

function confirmAddPlayerToMatchLineup() {
  const select = document.getElementById("playerSelect");
  const customName = document.getElementById("playerCustomName").value.trim();
  
  let playerName = "";
  let playerId = null;
  let playerImg = null;
  
  if (customName) {
    playerName = customName;
    addPlayerToLineupList(currentLineupType, playerId, playerName, playerImg);
    closeAddPlayerModal();
    return;
  } else if (select.value) {
    playerId = select.value;
    playersRef.child(playerId).once("value", snap => {
      const p = snap.val();
      if (p) {
        playerName = p.nome;
        playerImg = p.img;
        addPlayerToLineupList(currentLineupType, playerId, playerName, playerImg);
      }
    });
    closeAddPlayerModal();
    return;
  } else {
    Toast.show("Selecione um jogador ou digite um nome!");
    return;
  }
}

function addPlayerToLineupList(type, playerId, playerName, playerImg) {
  const container = document.getElementById(`matchLineup${type === 'starter' ? 'Starters' : type === 'sub' ? 'Subs' : 'Coach'}`);
  
  const playerDiv = document.createElement("div");
  playerDiv.className = "lineup-player-item";
  playerDiv.setAttribute("data-player-id", playerId || "custom");
  playerDiv.setAttribute("data-player-name", playerName);
  playerDiv.setAttribute("data-player-img", playerImg || "");
  
  playerDiv.innerHTML = `
    <div class="lineup-player-img">
      <img src="${playerImg || 'https://via.placeholder.com/40?text=Jogador'}" onerror="this.src='https://via.placeholder.com/40?text=Jogador'">
    </div>
    <div class="lineup-player-name">${playerName}</div>
    <button class="lineup-remove-btn" onclick="this.parentElement.remove()">✖</button>
  `;
  
  container.appendChild(playerDiv);
}

function saveMatchLineup() {
  const matchId = document.getElementById("matchLineupId").value;
  if (!matchId) return;
  
  const lineup = {
    starters: [],
    subs: [],
    coach: []
  };
  
  document.querySelectorAll("#matchLineupStarters .lineup-player-item").forEach(item => {
    lineup.starters.push({
      id: item.getAttribute("data-player-id"),
      nome: item.getAttribute("data-player-name"),
      img: item.getAttribute("data-player-img")
    });
  });
  
  document.querySelectorAll("#matchLineupSubs .lineup-player-item").forEach(item => {
    lineup.subs.push({
      id: item.getAttribute("data-player-id"),
      nome: item.getAttribute("data-player-name"),
      img: item.getAttribute("data-player-img")
    });
  });
  
  document.querySelectorAll("#matchLineupCoach .lineup-player-item").forEach(item => {
    lineup.coach.push({
      id: item.getAttribute("data-player-id"),
      nome: item.getAttribute("data-player-name"),
      img: item.getAttribute("data-player-img")
    });
  });
  
  matchesRef.child(matchId).child("lineup").set(lineup).then(() => {
    Logger.add("📋 Editou Escalação da Partida", `Partida ID: ${matchId}`);
    Toast.show("Escalação salva!");
    closeMatchLineupModal();
  });
}

function loadMatchLineup(matchId) {
  document.getElementById("matchLineupStarters").innerHTML = "";
  document.getElementById("matchLineupSubs").innerHTML = "";
  document.getElementById("matchLineupCoach").innerHTML = "";
  
  matchesRef.child(matchId).child("lineup").once("value", snap => {
    const lineup = snap.val();
    if (lineup) {
      if (lineup.starters) {
        lineup.starters.forEach(p => {
          const container = document.getElementById("matchLineupStarters");
          const playerDiv = document.createElement("div");
          playerDiv.className = "lineup-player-item";
          playerDiv.setAttribute("data-player-id", p.id || "custom");
          playerDiv.setAttribute("data-player-name", p.nome);
          playerDiv.setAttribute("data-player-img", p.img || "");
          playerDiv.innerHTML = `
            <div class="lineup-player-img">
              <img src="${p.img || 'https://via.placeholder.com/40?text=Jogador'}" onerror="this.src='https://via.placeholder.com/40?text=Jogador'">
            </div>
            <div class="lineup-player-name">${p.nome}</div>
            <button class="lineup-remove-btn" onclick="this.parentElement.remove()">✖</button>
          `;
          container.appendChild(playerDiv);
        });
      }
      if (lineup.subs) {
        lineup.subs.forEach(p => {
          const container = document.getElementById("matchLineupSubs");
          const playerDiv = document.createElement("div");
          playerDiv.className = "lineup-player-item";
          playerDiv.setAttribute("data-player-id", p.id || "custom");
          playerDiv.setAttribute("data-player-name", p.nome);
          playerDiv.setAttribute("data-player-img", p.img || "");
          playerDiv.innerHTML = `
            <div class="lineup-player-img">
              <img src="${p.img || 'https://via.placeholder.com/40?text=Jogador'}" onerror="this.src='https://via.placeholder.com/40?text=Jogador'">
            </div>
            <div class="lineup-player-name">${p.nome}</div>
            <button class="lineup-remove-btn" onclick="this.parentElement.remove()">✖</button>
          `;
          container.appendChild(playerDiv);
        });
      }
      if (lineup.coach) {
        lineup.coach.forEach(p => {
          const container = document.getElementById("matchLineupCoach");
          const playerDiv = document.createElement("div");
          playerDiv.className = "lineup-player-item";
          playerDiv.setAttribute("data-player-id", p.id || "custom");
          playerDiv.setAttribute("data-player-name", p.nome);
          playerDiv.setAttribute("data-player-img", p.img || "");
          playerDiv.innerHTML = `
            <div class="lineup-player-img">
              <img src="${p.img || 'https://via.placeholder.com/40?text=Jogador'}" onerror="this.src='https://via.placeholder.com/40?text=Jogador'">
            </div>
            <div class="lineup-player-name">${p.nome}</div>
            <button class="lineup-remove-btn" onclick="this.parentElement.remove()">✖</button>
          `;
          container.appendChild(playerDiv);
        });
      }
    }
  });
}

function toggleMatchLineup(header) {
  const content = header.nextElementSibling;
  const icon = header.querySelector('.toggle-icon');
  if (content.style.display === 'none' || !content.style.display) {
    content.style.display = 'block';
    icon.textContent = '▼';
  } else {
    content.style.display = 'none';
    icon.textContent = '▶';
  }
}

// ================= FUNÇÕES GLOBAIS =================
function closeEditModal() {
  Player.closeModal();
}

function closeEditMatchModal() {
  Match.closeModal();
}

function closeEditNewsModal() {
  News.closeModal();
}

// ================= LISTENERS =================
playersRef.on("value", snap => Player.render(snap.val()));
matchesRef.on("value", snap => {
  Match.render(snap.val());
  Stats.processMatches(snap.val());
});
lineupRef.on("value", snap => Lineup.render(snap.val()));
newsRef.on("value", snap => News.render(snap.val()));
standingsRef.on("value", snap => Standings.render(snap.val()));

// ================= SEARCH =================
document.getElementById("searchPlayer")?.addEventListener("input", e => {
  let term = e.target.value.toLowerCase();
  document.querySelectorAll("#playersList .player-card-full").forEach(card => {
    let nome = card.querySelector("h3")?.innerText.toLowerCase() || "";
    card.style.display = nome.includes(term) ? "block" : "none";
  });
});
document.getElementById("searchStats")?.addEventListener("input", e => {
  let term = e.target.value.toLowerCase();
  document.querySelectorAll("#statsList .stats-card").forEach(card => {
    let nome = card.querySelector(".stats-player-name")?.innerText.toLowerCase() || "";
    card.style.display = nome.includes(term) ? "flex" : "none";
  });
});

console.log("✅ Script carregado com sucesso!");
