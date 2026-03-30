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
  {user:"Mkz", pass:"12456453", nome:"Mkz"},
  {user:"gusline1", pass:"18376423", nome:"Gusline"}
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

// ================= UI (DEFINIDA ANTES DE SER USADA) =================
const UI = {
  go(id, el) {
    console.log("Mudando para:", id);
    let screens = document.querySelectorAll(".screen");
    for (let i = 0; i < screens.length; i++) {
      screens[i].classList.remove("active");
    }
    let target = document.getElementById(id);
    if (target) {
      target.classList.add("active");
      console.log("Tela ativada:", id);
    } else {
      console.log("Tela não encontrada:", id);
    }
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
      matchesContainer.innerHTML += `
      <div class="match-full-card">
        <div class="match-header">
          <div class="match-liga-info">${m.ligaLogo ? '<img src="' + m.ligaLogo + '" class="liga-logo">' : '<div class="liga-logo-placeholder">🏆</div>'}<span class="match-type">${m.tipoPartida === 'liga' ? '🏆 LIGA' : m.tipoPartida === 'copa' ? '🏅 COPA' : '🤝 AMISTOSO'}</span></div>
          <div class="match-date-time">📅 ${m.dataPartida || "Data não informada"}</div>
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
  
  delete(id, titulo) {
    if (!isAdmin) { Toast.show("🔒 Apenas administradores podem deletar notícias!"); return; }
    if (confirm(`⚠️ Tem certeza que deseja deletar a notícia "${titulo}"?`)) {
      newsRef.child(id).remove().then(() => {
        Logger.add("🗑️ Deletou Notícia", `Título: ${titulo}`);
        Toast.show("Notícia deletada!");
      });
    }
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
      
      const deleteButton = isAdmin ? `
        <button class="news-delete-btn" onclick="News.delete('${id}', '${n.titulo.replace(/'/g, "\\'")}')">
          🗑️ Deletar
        </button>
      ` : '';
      
      container.innerHTML += `
      <div class="news-card">
        <div class="news-image">
          <img src="${n.imagem}" onerror="this.src='https://via.placeholder.com/400x200?text=Imagem+não+disponível'">
          ${deleteButton}
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
      Logger.add("⚠️ Reset Total", "Dados apagados");
      Toast.show("Dados resetados!");
      setTimeout(() => location.reload(), 1500);
    }
  }
};

// ================= LISTENERS =================
playersRef.on("value", snap => Player.render(snap.val()));
matchesRef.on("value", snap => {
  Match.render(snap.val());
  Stats.processMatches(snap.val());
});
lineupRef.on("value", snap => Lineup.render(snap.val()));
newsRef.on("value", snap => News.render(snap.val()));

// ================= FUNÇÕES GLOBAIS =================
function closeEditModal() {
  Player.closeModal();
}

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
console.log("UI está definida:", typeof UI !== "undefined");

// ================= SISTEMA DE TRADUÇÃO COMPLETO =================
const translations = {
  // PORTUGUÊS
  pt: {
    // Menu
    "🏠 Início": "🏠 Início",
    "👥 Jogadores": "👥 Jogadores",
    "📊 Partidas": "📊 Partidas",
    "🏆 Tabela": "🏆 Tabela",
    "⚽ Estatísticas": "⚽ Estatísticas",
    "📋 Escalação": "📋 Escalação",
    "📰 Notícias": "📰 Notícias",
    "⚙️ Admin": "⚙️ Admin",
    
    // Títulos das seções
    "Jogadores": "Jogadores",
    "Partidas": "Partidas",
    "Tabela de Classificação": "Tabela de Classificação",
    "Estatísticas dos Jogadores": "Estatísticas dos Jogadores",
    "Escalação Tática": "Escalação Tática",
    "Últimas Notícias": "Últimas Notícias",
    "Painel Administrativo": "Painel Administrativo",
    
    // Botões
    "Adicionar Jogador": "Adicionar Jogador",
    "Adicionar Partida": "Adicionar Partida",
    "Publicar Notícia": "Publicar Notícia",
    "Adicionar ao campo": "Adicionar ao campo",
    "RESET TOTAL": "RESET TOTAL",
    "Sair do Admin": "Sair do Admin",
    "Buscar jogador...": "Buscar jogador...",
    
    // Placeholders
    "Nome do jogador": "Nome do jogador",
    "URL da imagem": "URL da imagem",
    "Overall (OVR)": "Overall (OVR)",
    "Ritmo": "Ritmo",
    "Chute": "Chute",
    "Passe": "Passe",
    "Drible": "Drible",
    "Defesa": "Defesa",
    "Físico": "Físico",
    "Título da notícia": "Título da notícia",
    "Descrição/Conteúdo da notícia": "Descrição/Conteúdo da notícia",
    "URL da logo da liga": "URL da logo da liga",
    "Time A": "Time A",
    "Time B": "Time B",
    "URL da logo": "URL da logo",
    "Placar (ex: 2x1)": "Placar (ex: 2x1)",
    "⚽ GOLS (ex: Willian 15)": "⚽ GOLS (ex: Willian 15)",
    "👟 ASSISTÊNCIAS (ex: Willian 15)": "👟 ASSISTÊNCIAS (ex: Willian 15)",
    "🧤 DEFESAS (ex: Goleiro 5)": "🧤 DEFESAS (ex: Goleiro 5)",
    "🟨🟥 CARTÕES (ex: Willian 30 amarelo)": "🟨🟥 CARTÕES (ex: Willian 30 amarelo)",
    "🏆 Melhor da Partida (MVP)": "🏆 Melhor da Partida (MVP)",
    "🥇 1ª Menção": "🥇 1ª Menção",
    "🥈 2ª Menção": "🥈 2ª Menção",
    "🥉 3ª Menção": "🥉 3ª Menção",
    "📝 Observações": "📝 Observações",
    
    // Admin
    "Adicionar Jogador": "Adicionar Jogador",
    "Adicionar Partida": "Adicionar Partida",
    "Adicionar Notícia": "Adicionar Notícia",
    "Adicionar à Escalação": "Adicionar à Escalação",
    "HISTÓRICO DE AÇÕES (LOGS)": "HISTÓRICO DE AÇÕES (LOGS)",
    "Logs permanentes": "Logs permanentes",
    
    // Home
    "Bem-vindo ao site oficial do": "Bem-vindo ao site oficial do",
    "do Real Futebol 24!": "do Real Futebol 24!",
    "Clube Esporte Salvador - O gigante do Real Futebol 24": "Clube Esporte Salvador - O gigante do Real Futebol 24",
    "📖 História do Clube": "📖 História do Clube",
    
    // Escalação
    "Arraste os jogadores livremente no campo": "Arraste os jogadores livremente no campo",
    
    // Toast
    "🔒 Apenas administradores!": "🔒 Apenas administradores!",
    "Digite o nome!": "Digite o nome!",
    "Jogador salvo!": "Jogador salvo!",
    "Preencha os times!": "Preencha os times!",
    "Partida salva!": "Partida salva!",
    "Jogador adicionado!": "Jogador adicionado!",
    "Notícia publicada!": "Notícia publicada!",
    "Sem permissão!": "Sem permissão!",
    "Dados resetados!": "Dados resetados!",
    "Login salvo!": "Login salvo!",
    "Acesso negado!": "Acesso negado!",
    "Saiu da conta!": "Saiu da conta!"
  },
  
  // INGLÊS
  en: {
    "🏠 Início": "🏠 Home",
    "👥 Jogadores": "👥 Players",
    "📊 Partidas": "📊 Matches",
    "🏆 Tabela": "🏆 Standings",
    "⚽ Estatísticas": "⚽ Statistics",
    "📋 Escalação": "📋 Lineup",
    "📰 Notícias": "📰 News",
    "⚙️ Admin": "⚙️ Admin",
    "Jogadores": "Players",
    "Partidas": "Matches",
    "Tabela de Classificação": "Standings",
    "Estatísticas dos Jogadores": "Player Statistics",
    "Escalação Tática": "Tactical Lineup",
    "Últimas Notícias": "Latest News",
    "Painel Administrativo": "Admin Panel",
    "Adicionar Jogador": "Add Player",
    "Adicionar Partida": "Add Match",
    "Publicar Notícia": "Publish News",
    "Adicionar ao campo": "Add to field",
    "RESET TOTAL": "TOTAL RESET",
    "Sair do Admin": "Logout Admin",
    "Buscar jogador...": "Search player...",
    "Nome do jogador": "Player name",
    "URL da imagem": "Image URL",
    "Overall (OVR)": "Overall (OVR)",
    "Ritmo": "Pace",
    "Chute": "Shooting",
    "Passe": "Passing",
    "Drible": "Dribbling",
    "Defesa": "Defense",
    "Físico": "Physical",
    "Título da notícia": "News title",
    "Descrição/Conteúdo da notícia": "News content",
    "URL da logo da liga": "League logo URL",
    "Time A": "Team A",
    "Time B": "Team B",
    "URL da logo": "Logo URL",
    "Placar (ex: 2x1)": "Score (ex: 2x1)",
    "⚽ GOLS (ex: Willian 15)": "⚽ GOALS (ex: Willian 15)",
    "👟 ASSISTÊNCIAS (ex: Willian 15)": "👟 ASSISTS (ex: Willian 15)",
    "🧤 DEFESAS (ex: Goleiro 5)": "🧤 SAVES (ex: Goalkeeper 5)",
    "🟨🟥 CARTÕES (ex: Willian 30 amarelo)": "🟨🟥 CARDS (ex: Willian 30 yellow)",
    "🏆 Melhor da Partida (MVP)": "🏆 Man of the Match (MVP)",
    "🥇 1ª Menção": "🥇 1st Mention",
    "🥈 2ª Menção": "🥈 2nd Mention",
    "🥉 3ª Menção": "🥉 3rd Mention",
    "📝 Observações": "📝 Observations",
    "Adicionar Notícia": "Add News",
    "Adicionar à Escalação": "Add to Lineup",
    "HISTÓRICO DE AÇÕES (LOGS)": "ACTION HISTORY (LOGS)",
    "Logs permanentes": "Permanent logs",
    "Bem-vindo ao site oficial do": "Welcome to the official website of",
    "do Real Futebol 24!": "of Real Futebol 24!",
    "Clube Esporte Salvador - O gigante do Real Futebol 24": "Clube Esporte Salvador - The giant of Real Futebol 24",
    "📖 História do Clube": "📖 Club History",
    "Arraste os jogadores livremente no campo": "Drag players freely on the field",
    "🔒 Apenas administradores!": "🔒 Administrators only!",
    "Digite o nome!": "Enter the name!",
    "Jogador salvo!": "Player saved!",
    "Preencha os times!": "Fill in the teams!",
    "Partida salva!": "Match saved!",
    "Jogador adicionado!": "Player added!",
    "Notícia publicada!": "News published!",
    "Sem permissão!": "No permission!",
    "Dados resetados!": "Data reset!",
    "Login salvo!": "Login saved!",
    "Acesso negado!": "Access denied!",
    "Saiu da conta!": "Logged out!"
  },
  
  // ESPANHOL
  es: {
    "🏠 Início": "🏠 Inicio",
    "👥 Jogadores": "👥 Jugadores",
    "📊 Partidas": "📊 Partidos",
    "🏆 Tabela": "🏆 Tabla",
    "⚽ Estatísticas": "⚽ Estadísticas",
    "📋 Escalação": "📋 Alineación",
    "📰 Notícias": "📰 Noticias",
    "⚙️ Admin": "⚙️ Admin",
    "Jogadores": "Jugadores",
    "Partidas": "Partidos",
    "Tabela de Classificação": "Tabla de Posiciones",
    "Estatísticas dos Jogadores": "Estadísticas de Jugadores",
    "Escalação Tática": "Alineación Táctica",
    "Últimas Notícias": "Últimas Noticias",
    "Painel Administrativo": "Panel Administrativo",
    "Adicionar Jogador": "Agregar Jugador",
    "Adicionar Partida": "Agregar Partido",
    "Publicar Notícia": "Publicar Noticia",
    "Adicionar ao campo": "Agregar al campo",
    "RESET TOTAL": "RESET TOTAL",
    "Sair do Admin": "Salir del Admin",
    "Buscar jogador...": "Buscar jugador...",
    "Nome do jogador": "Nombre del jugador",
    "URL da imagem": "URL de la imagen",
    "Overall (OVR)": "Overall (OVR)",
    "Ritmo": "Ritmo",
    "Chute": "Tiro",
    "Passe": "Pase",
    "Drible": "Regate",
    "Defesa": "Defensa",
    "Físico": "Físico",
    "Título da notícia": "Título de la noticia",
    "Descrição/Conteúdo da notícia": "Contenido de la noticia",
    "URL da logo da liga": "URL del logo de la liga",
    "Time A": "Equipo A",
    "Time B": "Equipo B",
    "URL da logo": "URL del logo",
    "Placar (ex: 2x1)": "Resultado (ej: 2x1)",
    "⚽ GOLS (ex: Willian 15)": "⚽ GOLES (ej: Willian 15)",
    "👟 ASSISTÊNCIAS (ex: Willian 15)": "👟 ASISTENCIAS (ej: Willian 15)",
    "🧤 DEFESAS (ex: Goleiro 5)": "🧤 ATAJADAS (ej: Portero 5)",
    "🟨🟥 CARTÕES (ex: Willian 30 amarelo)": "🟨🟥 TARJETAS (ej: Willian 30 amarilla)",
    "🏆 Melhor da Partida (MVP)": "🏆 Mejor del Partido (MVP)",
    "🥇 1ª Menção": "🥇 1ª Mención",
    "🥈 2ª Menção": "🥈 2ª Mención",
    "🥉 3ª Menção": "🥉 3ª Mención",
    "📝 Observações": "📝 Observaciones",
    "Adicionar Notícia": "Agregar Noticia",
    "Adicionar à Escalação": "Agregar a la Alineación",
    "HISTÓRICO DE AÇÕES (LOGS)": "HISTORIAL DE ACCIONES (LOGS)",
    "Logs permanentes": "Logs permanentes",
    "Bem-vindo ao site oficial do": "Bienvenido al sitio oficial del",
    "do Real Futebol 24!": "del Real Futebol 24!",
    "Clube Esporte Salvador - O gigante do Real Futebol 24": "Clube Esporte Salvador - El gigante del Real Futebol 24",
    "📖 História do Clube": "📖 Historia del Club",
    "Arraste os jogadores livremente no campo": "Arrastra jugadores libremente en el campo",
    "🔒 Apenas administradores!": "🔒 Solo administradores!",
    "Digite o nome!": "¡Ingresa el nombre!",
    "Jogador salvo!": "¡Jugador guardado!",
    "Preencha os times!": "¡Completa los equipos!",
    "Partida salva!": "¡Partido guardado!",
    "Jogador adicionado!": "¡Jugador agregado!",
    "Notícia publicada!": "¡Noticia publicada!",
    "Sem permissão!": "¡Sin permiso!",
    "Dados resetados!": "¡Datos reiniciados!",
    "Login salvo!": "¡Login guardado!",
    "Acesso negado!": "¡Acceso denegado!",
    "Saiu da conta!": "¡Sesión cerrada!"
  },
  
  // FRANCÊS
  fr: {
    "🏠 Início": "🏠 Accueil",
    "👥 Jogadores": "👥 Joueurs",
    "📊 Partidas": "📊 Matchs",
    "🏆 Tabela": "🏆 Classement",
    "⚽ Estatísticas": "⚽ Statistiques",
    "📋 Escalação": "📋 Composition",
    "📰 Notícias": "📰 Actualités",
    "⚙️ Admin": "⚙️ Admin",
    "Jogadores": "Joueurs",
    "Partidas": "Matchs",
    "Tabela de Classificação": "Classement",
    "Estatísticas dos Jogadores": "Statistiques des Joueurs",
    "Escalação Tática": "Composition Tactique",
    "Últimas Notícias": "Dernières Nouvelles",
    "Painel Administrativo": "Panneau Admin",
    "Adicionar Jogador": "Ajouter Joueur",
    "Adicionar Partida": "Ajouter Match",
    "Publicar Notícia": "Publier Actualité",
    "Adicionar ao campo": "Ajouter au terrain",
    "RESET TOTAL": "RÉINITIALISATION TOTALE",
    "Sair do Admin": "Quitter Admin",
    "Buscar jogador...": "Rechercher joueur...",
    "Nome do jogador": "Nom du joueur",
    "URL da imagem": "URL de l'image",
    "Overall (OVR)": "Global (OVR)",
    "Ritmo": "Rythme",
    "Chute": "Tir",
    "Passe": "Passe",
    "Drible": "Dribble",
    "Defesa": "Défense",
    "Físico": "Physique",
    "Título da notícia": "Titre de l'actualité",
    "Descrição/Conteúdo da notícia": "Contenu de l'actualité",
    "URL da logo da liga": "URL du logo de la ligue",
    "Time A": "Équipe A",
    "Time B": "Équipe B",
    "URL da logo": "URL du logo",
    "Placar (ex: 2x1)": "Score (ex: 2x1)",
    "⚽ GOLS (ex: Willian 15)": "⚽ BUTS (ex: Willian 15)",
    "👟 ASSISTÊNCIAS (ex: Willian 15)": "👟 PASSES DÉCISIVES (ex: Willian 15)",
    "🧤 DEFESAS (ex: Goleiro 5)": "🧤 ARRÊTS (ex: Gardien 5)",
    "🟨🟥 CARTÕES (ex: Willian 30 amarelo)": "🟨🟥 CARTONS (ex: Willian 30 jaune)",
    "🏆 Melhor da Partida (MVP)": "🏆 Homme du Match (MVP)",
    "🥇 1ª Menção": "🥇 1ère Mention",
    "🥈 2ª Menção": "🥈 2ème Mention",
    "🥉 3ª Menção": "🥉 3ème Mention",
    "📝 Observações": "📝 Observations",
    "Adicionar Notícia": "Ajouter Actualité",
    "Adicionar à Escalação": "Ajouter à la Composition",
    "HISTÓRICO DE AÇÕES (LOGS)": "HISTORIQUE DES ACTIONS (LOGS)",
    "Logs permanentes": "Journaux permanents",
    "Bem-vindo ao site oficial do": "Bienvenue sur le site officiel du",
    "do Real Futebol 24!": "du Real Futebol 24!",
    "Clube Esporte Salvador - O gigante do Real Futebol 24": "Clube Esporte Salvador - Le géant du Real Futebol 24",
    "📖 História do Clube": "📖 Histoire du Club",
    "Arraste os jogadores livremente no campo": "Faites glisser les joueurs librement sur le terrain",
    "🔒 Apenas administradores!": "🔒 Administrateurs uniquement!",
    "Digite o nome!": "Entrez le nom!",
    "Jogador salvo!": "Joueur sauvegardé!",
    "Preencha os times!": "Remplissez les équipes!",
    "Partida salva!": "Match sauvegardé!",
    "Jogador adicionado!": "Joueur ajouté!",
    "Notícia publicada!": "Actualité publiée!",
    "Sem permissão!": "Pas de permission!",
    "Dados resetados!": "Données réinitialisées!",
    "Login salvo!": "Connexion sauvegardée!",
    "Acesso negado!": "Accès refusé!",
    "Saiu da conta!": "Déconnecté!"
  },
  
  // ITALIANO
  it: {
    "🏠 Início": "🏠 Home",
    "👥 Jogadores": "👥 Giocatori",
    "📊 Partidas": "📊 Partite",
    "🏆 Tabela": "🏆 Classifica",
    "⚽ Estatísticas": "⚽ Statistiche",
    "📋 Escalação": "📋 Formazione",
    "📰 Notícias": "📰 Notizie",
    "⚙️ Admin": "⚙️ Admin",
    "Jogadores": "Giocatori",
    "Partidas": "Partite",
    "Tabela de Classificação": "Classifica",
    "Estatísticas dos Jogadores": "Statistiche Giocatori",
    "Escalação Tática": "Formazione Tattica",
    "Últimas Notícias": "Ultime Notizie",
    "Painel Administrativo": "Pannello Admin",
    "Adicionar Jogador": "Aggiungi Giocatore",
    "Adicionar Partida": "Aggiungi Partita",
    "Publicar Notícia": "Pubblica Notizia",
    "Adicionar ao campo": "Aggiungi al campo",
    "RESET TOTAL": "RESET TOTALE",
    "Sair do Admin": "Esci da Admin",
    "Buscar jogador...": "Cerca giocatore...",
    "Nome do jogador": "Nome giocatore",
    "URL da imagem": "URL immagine",
    "Overall (OVR)": "Overall (OVR)",
    "Ritmo": "Ritmo",
    "Chute": "Tiro",
    "Passe": "Passaggio",
    "Drible": "Dribbling",
    "Defesa": "Difesa",
    "Físico": "Fisico",
    "Título da notícia": "Titolo notizia",
    "Descrição/Conteúdo da notícia": "Contenuto notizia",
    "URL da logo da liga": "URL logo lega",
    "Time A": "Squadra A",
    "Time B": "Squadra B",
    "URL da logo": "URL logo",
    "Placar (ex: 2x1)": "Punteggio (es: 2x1)",
    "⚽ GOLS (ex: Willian 15)": "⚽ GOL (es: Willian 15)",
    "👟 ASSISTÊNCIAS (ex: Willian 15)": "👟 ASSIST (es: Willian 15)",
    "🧤 DEFESAS (ex: Goleiro 5)": "🧤 PARATE (es: Portiere 5)",
    "🟨🟥 CARTÕES (ex: Willian 30 amarelo)": "🟨🟥 CARTELLINI (es: Willian 30 giallo)",
    "🏆 Melhor da Partida (MVP)": "🏆 Migliore in Campo (MVP)",
    "🥇 1ª Menção": "🥇 1ª Menzione",
    "🥈 2ª Menção": "🥈 2ª Menzione",
    "🥉 3ª Menção": "🥉 3ª Menzione",
    "📝 Observações": "📝 Osservazioni",
    "Adicionar Notícia": "Aggiungi Notizia",
    "Adicionar à Escalação": "Aggiungi alla Formazione",
    "HISTÓRICO DE AÇÕES (LOGS)": "STORICO AZIONI (LOGS)",
    "Logs permanentes": "Log permanenti",
    "Bem-vindo ao site oficial do": "Benvenuti sul sito ufficiale del",
    "do Real Futebol 24!": "del Real Futebol 24!",
    "Clube Esporte Salvador - O gigante do Real Futebol 24": "Clube Esporte Salvador - Il gigante del Real Futebol 24",
    "📖 História do Clube": "📖 Storia del Club",
    "Arraste os jogadores livremente no campo": "Trascina i giocatori liberamente sul campo",
    "🔒 Apenas administradores!": "🔒 Solo amministratori!",
    "Digite o nome!": "Inserisci il nome!",
    "Jogador salvo!": "Giocatore salvato!",
    "Preencha os times!": "Compila le squadre!",
    "Partida salva!": "Partita salvata!",
    "Jogador adicionado!": "Giocatore aggiunto!",
    "Notícia publicada!": "Notizia pubblicata!",
    "Sem permissão!": "Nessun permesso!",
    "Dados resetados!": "Dati resettati!",
    "Login salvo!": "Login salvato!",
    "Acesso negado!": "Accesso negato!",
    "Saiu da conta!": "Disconnesso!"
  },
  
  // ALEMÃO
  de: {
    "🏠 Início": "🏠 Start",
    "👥 Jogadores": "👥 Spieler",
    "📊 Partidas": "📊 Spiele",
    "🏆 Tabela": "🏆 Tabelle",
    "⚽ Estatísticas": "⚽ Statistiken",
    "📋 Escalação": "📋 Aufstellung",
    "📰 Notícias": "📰 Nachrichten",
    "⚙️ Admin": "⚙️ Admin",
    "Jogadores": "Spieler",
    "Partidas": "Spiele",
    "Tabela de Classificação": "Tabelle",
    "Estatísticas dos Jogadores": "Spielerstatistiken",
    "Escalação Tática": "Taktische Aufstellung",
    "Últimas Notícias": "Letzte Nachrichten",
    "Painel Administrativo": "Admin-Bereich",
    "Adicionar Jogador": "Spieler hinzufügen",
    "Adicionar Partida": "Spiel hinzufügen",
    "Publicar Notícia": "Nachricht veröffentlichen",
    "Adicionar ao campo": "Zum Feld hinzufügen",
    "RESET TOTAL": "KOMPLETT ZURÜCKSETZEN",
    "Sair do Admin": "Admin verlassen",
    "Buscar jogador...": "Spieler suchen...",
    "Nome do jogador": "Spielername",
    "URL da imagem": "Bild-URL",
    "Overall (OVR)": "Gesamt (OVR)",
    "Ritmo": "Tempo",
    "Chute": "Schuss",
    "Passe": "Pass",
    "Drible": "Dribbling",
    "Defesa": "Verteidigung",
    "Físico": "Physis",
    "Título da notícia": "Nachrichtentitel",
    "Descrição/Conteúdo da notícia": "Nachrichteninhalt",
    "URL da logo da liga": "Liga-Logo-URL",
    "Time A": "Team A",
    "Time B": "Team B",
    "URL da logo": "Logo-URL",
    "Placar (ex: 2x1)": "Ergebnis (z.B. 2x1)",
    "⚽ GOLS (ex: Willian 15)": "⚽ TORE (z.B. Willian 15)",
    "👟 ASSISTÊNCIAS (ex: Willian 15)": "👟 ASSISTS (z.B. Willian 15)",
    "🧤 DEFESAS (ex: Goleiro 5)": "🧤 PARADEN (z.B. Torwart 5)",
    "🟨🟥 CARTÕES (ex: Willian 30 amarelo)": "🟨🟥 KARTEN (z.B. Willian 30 gelb)",
    "🏆 Melhor da Partida (MVP)": "🏆 Spieler des Spiels (MVP)",
    "🥇 1ª Menção": "🥇 1. Erwähnung",
    "🥈 2ª Menção": "🥈 2. Erwähnung",
    "🥉 3ª Menção": "🥉 3. Erwähnung",
    "📝 Observações": "📝 Bemerkungen",
    "Adicionar Notícia": "Nachricht hinzufügen",
    "Adicionar à Escalação": "Zur Aufstellung hinzufügen",
    "HISTÓRICO DE AÇÕES (LOGS)": "AKTIONSVERLAUF (LOGS)",
    "Logs permanentes": "Permanente Logs",
    "Bem-vindo ao site oficial do": "Willkommen auf der offiziellen Website des",
    "do Real Futebol 24!": "des Real Futebol 24!",
    "Clube Esporte Salvador - O gigante do Real Futebol 24": "Clube Esporte Salvador - Der Gigant des Real Futebol 24",
    "📖 História do Clube": "📖 Vereinsgeschichte",
    "Arraste os jogadores livremente no campo": "Ziehe Spieler frei auf dem Feld",
    "🔒 Apenas administradores!": "🔒 Nur Administratoren!",
    "Digite o nome!": "Gib den Namen ein!",
    "Jogador salvo!": "Spieler gespeichert!",
    "Preencha os times!": "Fülle die Teams aus!",
    "Partida salva!": "Spiel gespeichert!",
    "Jogador adicionado!": "Spieler hinzugefügt!",
    "Notícia publicada!": "Nachricht veröffentlicht!",
    "Sem permissão!": "Keine Berechtigung!",
    "Dados resetados!": "Daten zurückgesetzt!",
    "Login salvo!": "Login gespeichert!",
    "Acesso negado!": "Zugriff verweigert!",
    "Saiu da conta!": "Abgemeldet!"
  },
  
  // ALEMÃO SUÍÇO (Schweizerdeutsch)
  ch: {
    "🏠 Início": "🏠 Start",
    "👥 Jogadores": "👥 Spiler",
    "📊 Partidas": "📊 Spiil",
    "🏆 Tabela": "🏆 Tabälle",
    "⚽ Estatísticas": "⚽ Statistike",
    "📋 Escalação": "📋 Ufstellig",
    "📰 Notícias": "📰 Nöchrichte",
    "⚙️ Admin": "⚙️ Admin",
    "Jogadores": "Spiler",
    "Partidas": "Spiil",
    "Tabela de Classificação": "Tabälle",
    "Estatísticas dos Jogadores": "Spilerstatistike",
    "Escalação Tática": "Taktischi Ufstellig",
    "Últimas Notícias": "Letschti Nöchrichte",
    "Painel Administrativo": "Admin-Bereich",
    "Adicionar Jogador": "Spiler dezuefiege",
    "Adicionar Partida": "Spiil dezuefiege",
    "Publicar Notícia": "Nöchricht publiziere",
    "Adicionar ao campo": "Ufs Fäld dezuefiege",
    "RESET TOTAL": "KOMPLETT ZRÜCKSETZE",
    "Sair do Admin": "Admin verlah",
    "Buscar jogador...": "Spiler sueche...",
    "Nome do jogador": "Spilername",
    "URL da imagem": "Bild-URL",
    "Overall (OVR)": "Gsam (OVR)",
    "Ritmo": "Tempo",
    "Chute": "Schuss",
    "Passe": "Pass",
    "Drible": "Dribbling",
    "Defesa": "Verteidigung",
    "Físico": "Physis",
    "Título da notícia": "Nöchrichtetitel",
    "Descrição/Conteúdo da notícia": "Nöchrichteinhalt",
    "URL da logo da liga": "Liga-Logo-URL",
    "Time A": "Team A",
    "Time B": "Team B",
    "URL da logo": "Logo-URL",
    "Placar (ex: 2x1)": "Ergebnis (z.B. 2x1)",
    "⚽ GOLS (ex: Willian 15)": "⚽ TOR (z.B. Willian 15)",
    "👟 ASSISTÊNCIAS (ex: Willian 15)": "👟 ASSISTS (z.B. Willian 15)",
    "🧤 DEFESAS (ex: Goleiro 5)": "🧤 PARADE (z.B. Torhüeter 5)",
    "🟨🟥 CARTÕES (ex: Willian 30 amarelo)": "🟨🟥 CHARTE (z.B. Willian 30 gäub)",
    "🏆 Melhor da Partida (MVP)": "🏆 Spiler vom Spiil (MVP)",
    "🥇 1ª Menção": "🥇 1. Erwähnig",
    "🥈 2ª Menção": "🥈 2. Erwähnig",
    "🥉 3ª Menção": "🥉 3. Erwähnig",
    "📝 Observações": "📝 Bemerkige",
    "Adicionar Notícia": "Nöchricht dezuefiege",
    "Adicionar à Escalação": "Zur Ufstellig dezuefiege",
    "HISTÓRICO DE AÇÕES (LOGS)": "AKTIONSVERLAUF (LOGS)",
    "Logs permanentes": "Permanent Logs",
    "Bem-vindo ao site oficial do": "Wiuukomme uf de offizielle Website vom",
    "do Real Futebol 24!": "vom Real Futebol 24!",
    "Clube Esporte Salvador - O gigante do Real Futebol 24": "Clube Esporte Salvador - De Gigant vom Real Futebol 24",
    "📖 História do Clube": "📖 Vereinsgschicht",
    "Arraste os jogadores livremente no campo": "Zie d'Spiler frei uf em Fäld",
    "🔒 Apenas administradores!": "🔒 Nur Administratore!",
    "Digite o nome!": "Gib de Name ii!",
    "Jogador salvo!": "Spiler gspicheret!",
    "Preencha os times!": "Füll d'Team us!",
    "Partida salva!": "Spiil gspicheret!",
    "Jogador adicionado!": "Spiler dezuegfiegt!",
    "Notícia publicada!": "Nöchricht publiziert!",
    "Sem permissão!": "Kei Berechtigig!",
    "Dados resetados!": "Date zrüggsetzt!",
    "Login salvo!": "Login gspicheret!",
    "Acesso negado!": "Zuegriff verweigeret!",
    "Saiu da conta!": "Abgmeldet!"
  },
  
  // RUSSO
  ru: {
    "🏠 Início": "🏠 Главная",
    "👥 Jogadores": "👥 Игроки",
    "📊 Partidas": "📊 Матчи",
    "🏆 Tabela": "🏆 Турнирная таблица",
    "⚽ Estatísticas": "⚽ Статистика",
    "📋 Escalação": "📋 Состав",
    "📰 Notícias": "📰 Новости",
    "⚙️ Admin": "⚙️ Админ",
    "Jogadores": "Игроки",
    "Partidas": "Матчи",
    "Tabela de Classificação": "Турнирная таблица",
    "Estatísticas dos Jogadores": "Статистика игроков",
    "Escalação Tática": "Тактический состав",
    "Últimas Notícias": "Последние новости",
    "Painel Administrativo": "Панель администратора",
    "Adicionar Jogador": "Добавить игрока",
    "Adicionar Partida": "Добавить матч",
    "Publicar Notícia": "Опубликовать новость",
    "Adicionar ao campo": "Добавить на поле",
    "RESET TOTAL": "ПОЛНЫЙ СБРОС",
    "Sair do Admin": "Выйти из админки",
    "Buscar jogador...": "Поиск игрока...",
    "Nome do jogador": "Имя игрока",
    "URL da imagem": "URL изображения",
    "Overall (OVR)": "Общий рейтинг (OVR)",
    "Ritmo": "Скорость",
    "Chute": "Удар",
    "Passe": "Пас",
    "Drible": "Дриблинг",
    "Defesa": "Защита",
    "Físico": "Физика",
    "Título da notícia": "Заголовок новости",
    "Descrição/Conteúdo da notícia": "Содержание новости",
    "URL da logo da liga": "URL логотипа лиги",
    "Time A": "Команда А",
    "Time B": "Команда Б",
    "URL da logo": "URL логотипа",
    "Placar (ex: 2x1)": "Счет (напр: 2x1)",
    "⚽ GOLS (ex: Willian 15)": "⚽ ГОЛЫ (напр: Willian 15)",
    "👟 ASSISTÊNCIAS (ex: Willian 15)": "👟 ГОЛЕВЫЕ ПЕРЕДАЧИ (напр: Willian 15)",
    "🧤 DEFESAS (ex: Goleiro 5)": "🧤 СЕЙВЫ (напр: Вратарь 5)",
    "🟨🟥 CARTÕES (ex: Willian 30 amarelo)": "🟨🟥 КАРТОЧКИ (напр: Willian 30 желтая)",
    "🏆 Melhor da Partida (MVP)": "🏆 Лучший игрок матча (MVP)",
    "🥇 1ª Menção": "🥇 1-е упоминание",
    "🥈 2ª Menção": "🥈 2-е упоминание",
    "🥉 3ª Menção": "🥉 3-е упоминание",
    "📝 Observações": "📝 Примечания",
    "Adicionar Notícia": "Добавить новость",
    "Adicionar à Escalação": "Добавить в состав",
    "HISTÓRICO DE AÇÕES (LOGS)": "ИСТОРИЯ ДЕЙСТВИЙ (ЛОГИ)",
    "Logs permanentes": "Постоянные логи",
    "Bem-vindo ao site oficial do": "Добро пожаловать на официальный сайт",
    "do Real Futebol 24!": "Real Futebol 24!",
    "Clube Esporte Salvador - O gigante do Real Futebol 24": "Clube Esporte Salvador - Гигант Real Futebol 24",
    "📖 História do Clube": "📖 История клуба",
    "Arraste os jogadores livremente no campo": "Перетаскивайте игроков по полю",
    "🔒 Apenas administradores!": "🔒 Только для администраторов!",
    "Digite o nome!": "Введите имя!",
    "Jogador salvo!": "Игрок сохранен!",
    "Preencha os times!": "Заполните команды!",
    "Partida salva!": "Матч сохранен!",
    "Jogador adicionado!": "Игрок добавлен!",
    "Notícia publicada!": "Новость опубликована!",
    "Sem permissão!": "Нет разрешения!",
    "Dados resetados!": "Данные сброшены!",
    "Login salvo!": "Вход сохранен!",
    "Acesso negado!": "Доступ запрещен!",
    "Saiu da conta!": "Выход выполнен!"
  }
};

// Idioma atual
let currentLang = localStorage.getItem("language") || "pt";

// Função para detectar idioma do navegador
function detectBrowserLanguage() {
  const browserLang = (navigator.language || navigator.userLanguage).toLowerCase();
  if (browserLang.startsWith("pt")) return "pt";
  if (browserLang.startsWith("en")) return "en";
  if (browserLang.startsWith("es")) return "es";
  if (browserLang.startsWith("fr")) return "fr";
  if (browserLang.startsWith("it")) return "it";
  if (browserLang.startsWith("de")) return "de";
  if (browserLang.startsWith("ru")) return "ru";
  return "pt";
}

// Função para traduzir um elemento
function translateElement(element) {
  const text = element.innerText.trim();
  const translation = translations[currentLang][text];
  if (translation && translation !== text) {
    element.innerText = translation;
  }
}

// Função para traduzir todos os elementos da página
function translatePage() {
  const elementsToTranslate = document.querySelectorAll(
    'h1, h2, h3, p, button, .menu div, .admin-box h3, .formation-info, .logs-header small'
  );
  
  elementsToTranslate.forEach(el => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const placeholder = el.getAttribute('placeholder');
      if (placeholder && translations[currentLang][placeholder]) {
        el.setAttribute('placeholder', translations[currentLang][placeholder]);
      }
    } else {
      translateElement(el);
    }
  });
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const lang = btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    if (lang === currentLang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  localStorage.setItem("language", currentLang);
}

// Função para definir o idioma
function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  translatePage();
  Toast.show(`🌐 Idioma alterado para ${lang.toUpperCase()}`);
}

// Inicializa o idioma
function initLanguage() {
  const savedLang = localStorage.getItem("language");
  if (savedLang && translations[savedLang]) {
    currentLang = savedLang;
  } else {
    currentLang = detectBrowserLanguage();
  }
  translatePage();
}

document.addEventListener("DOMContentLoaded", initLanguage);
