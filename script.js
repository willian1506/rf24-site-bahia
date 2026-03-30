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

// ================= LOGIN =================
let isAdmin = localStorage.getItem("admin") === "true";
let currentUser = localStorage.getItem("currentUser") || null;

function loginAdmin(){
  let user = prompt("👤 Usuário:");
  if (!user || user === null) {
    Toast.show("Login cancelado!");
    return false;
  }
  let pass = prompt("🔐 Senha:");
  if (!pass || pass === null) {
    Toast.show("Login cancelado!");
    return false;
  }
  let autorizado = ADMINS.find(a => a.user === user && a.pass === pass);
  if(autorizado){
    isAdmin = true;
    currentUser = autorizado.nome;
    localStorage.setItem("admin", "true");
    localStorage.setItem("currentUser", autorizado.nome);
    Toast.show(`✅ Login realizado como ${autorizado.nome}!`);
    return true;
  } else {
    Toast.show("❌ Acesso negado!");
    return false;
  }
}

function logoutAdmin(){
  isAdmin = false;
  currentUser = null;
  localStorage.removeItem("admin");
  localStorage.removeItem("currentUser");
  Toast.show("👋 Saiu da conta do admin!");
  const homeButton = document.querySelector('.menu div:first-child');
  if (homeButton) UI.go('home', homeButton);
}

function openAdmin(el){
  if(isAdmin){
    UI.go('admin', el);
    return;
  }
  let logou = loginAdmin();
  if(logou) UI.go('admin', el);
}

// ================= LOADER =================
window.onload = () => {
  setTimeout(() => loader.style.display = "none", 1200);
};

// ================= TOAST =================
const Toast = {
  show(msg) {
    toast.innerText = msg;
    toast.style.opacity = 1;
    setTimeout(() => toast.style.opacity = 0, 2500);
  }
};

// ================= UI =================
const UI = {
  go(id, el) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    document.querySelectorAll(".menu div").forEach(m => m.classList.remove("active"));
    el.classList.add("active");
    if (id === "admin" && isAdmin) Logger.render();
    if (id === "scorers") Stats.render();
  }
};

// ================= DATABASE REF =================
const playersRef = db.ref("players");
const matchesRef = db.ref("matches");
const lineupRef = db.ref("lineup");

// ================= LISTA DE JOGADORES (para correspondência) =================
let jogadoresLista = [];
let jogadoresMap = {};

playersRef.on("value", (snap) => {
  const dados = snap.val();
  if (dados) {
    jogadoresLista = Object.entries(dados).map(([id, j]) => ({
      id: id,
      nome: j.nome,
      nomeLower: j.nome.toLowerCase(),
      img: j.img || "https://via.placeholder.com/40?text=Jogador"
    }));
    
    jogadoresMap = {};
    jogadoresLista.forEach(j => {
      jogadoresMap[j.nome.toLowerCase()] = j;
    });
  }
});

function encontrarJogador(nomeDigitado) {
  if (!nomeDigitado) return null;
  
  const nomeBusca = nomeDigitado.toLowerCase().trim();
  const semAcentos = nomeBusca.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  let encontrado = jogadoresLista.find(j => j.nomeLower === nomeBusca);
  if (encontrado) return encontrado;
  
  encontrado = jogadoresLista.find(j => j.nomeLower.startsWith(nomeBusca) || nomeBusca.startsWith(j.nomeLower));
  if (encontrado) return encontrado;
  
  encontrado = jogadoresLista.find(j => j.nomeLower.includes(nomeBusca));
  if (encontrado) return encontrado;
  
  encontrado = jogadoresLista.find(j => {
    const jSemAcentos = j.nomeLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return jSemAcentos === semAcentos || jSemAcentos.includes(semAcentos);
  });
  
  return encontrado || null;
}

// ================= SISTEMA DE ESTATÍSTICAS =================
const Stats = {
  data: {},
  
  processMatches(matches) {
    this.data = {};
    if (!matches) return;
    
    Object.values(matches).forEach(match => {
      if (match.gols) {
        const golsLines = match.gols.split("\n");
        golsLines.forEach(line => {
          const nomeMatch = line.match(/([a-zA-ZÀ-ÿ]+(?:[0-9]*))/);
          if (nomeMatch) {
            const nomeDigitado = nomeMatch[1];
            const jogador = encontrarJogador(nomeDigitado);
            const nomeCorrigido = jogador ? jogador.nome : nomeDigitado;
            this.addStat(nomeCorrigido, "gols", 1, jogador?.img, jogador?.id);
          }
        });
      }
      
      if (match.assistencias) {
        const assistLines = match.assistencias.split("\n");
        assistLines.forEach(line => {
          const nomeMatch = line.match(/([a-zA-ZÀ-ÿ]+(?:[0-9]*))/);
          if (nomeMatch) {
            const nomeDigitado = nomeMatch[1];
            const jogador = encontrarJogador(nomeDigitado);
            const nomeCorrigido = jogador ? jogador.nome : nomeDigitado;
            this.addStat(nomeCorrigido, "assistencias", 1, jogador?.img, jogador?.id);
          }
        });
      }
      
      if (match.defesas) {
        const defesasLines = match.defesas.split("\n");
        defesasLines.forEach(line => {
          const nomeMatch = line.match(/([a-zA-ZÀ-ÿ]+(?:[0-9]*))/);
          const qtdMatch = line.match(/(\d+)\s*defesas/);
          if (nomeMatch) {
            const nomeDigitado = nomeMatch[1];
            const jogador = encontrarJogador(nomeDigitado);
            const nomeCorrigido = jogador ? jogador.nome : nomeDigitado;
            const qtd = qtdMatch ? parseInt(qtdMatch[1]) : 1;
            this.addStat(nomeCorrigido, "defesas", qtd, jogador?.img, jogador?.id);
          }
        });
      }
      
      if (match.mvp) {
        const jogador = encontrarJogador(match.mvp);
        const nomeCorrigido = jogador ? jogador.nome : match.mvp;
        this.addStat(nomeCorrigido, "mvps", 1, jogador?.img, jogador?.id);
      }
      
      const mencoes = [match.menc1, match.menc2, match.menc3];
      mencoes.forEach(men => {
        if (men) {
          const jogador = encontrarJogador(men);
          const nomeCorrigido = jogador ? jogador.nome : men;
          this.addStat(nomeCorrigido, "mensoes", 1, jogador?.img, jogador?.id);
        }
      });
    });
  },
  
  addStat(nome, tipo, valor, imagem, id) {
    if (!this.data[nome]) {
      this.data[nome] = {
        gols: 0,
        assistencias: 0,
        defesas: 0,
        mvps: 0,
        mensoes: 0,
        totalParticipacoes: 0,
        img: imagem || "https://via.placeholder.com/80?text=Jogador",
        id: id
      };
    }
    this.data[nome][tipo] += valor;
    this.data[nome].totalParticipacoes = 
      this.data[nome].gols + 
      this.data[nome].assistencias + 
      this.data[nome].defesas;
    
    if (imagem && this.data[nome].img === "https://via.placeholder.com/80?text=Jogador") {
      this.data[nome].img = imagem;
    }
  },
  
  render() {
    const container = document.getElementById("statsList");
    if (!container) return;
    
    matchesRef.once("value", (snap) => {
      this.processMatches(snap.val());
      
      if (Object.keys(this.data).length === 0) {
        container.innerHTML = '<div class="no-stats">📊 Nenhuma estatística disponível ainda. Adicione partidas!</div>';
        return;
      }
      
      const sorted = Object.entries(this.data).sort((a,b) => b[1].gols - a[1].gols);
      
      container.innerHTML = "";
      sorted.forEach(([nome, stats], index) => {
        container.innerHTML += `
        <div class="stats-card">
          <div class="stats-rank">${index + 1}º</div>
          <div class="stats-player-img">
            <img src="${stats.img}" onerror="this.src='https://via.placeholder.com/60?text=Jogador'" class="stats-img">
          </div>
          <div class="stats-player-info">
            <div class="stats-player-name">${nome}</div>
          </div>
          <div class="stats-numbers">
            <div class="stat-item">
              <span class="stat-icon">⚽</span>
              <span class="stat-value">${stats.gols}</span>
              <span class="stat-label">Gols</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">👟</span>
              <span class="stat-value">${stats.assistencias}</span>
              <span class="stat-label">Assist.</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">🧤</span>
              <span class="stat-value">${stats.defesas}</span>
              <span class="stat-label">Defesas</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">🏆</span>
              <span class="stat-value">${stats.mvps}</span>
              <span class="stat-label">MVP</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📋</span>
              <span class="stat-value">${stats.mensoes}</span>
              <span class="stat-label">Menções</span>
            </div>
          </div>
          <div class="stats-total">
            <span>🎯 Total: ${stats.totalParticipacoes}</span>
          </div>
        </div>`;
      });
    });
  }
};

// ================= PLAYERS (com edição e exclusão - APENAS ADMIN) =================
const Player = {
  currentEditId: null,
  
  add() {
    if (!isAdmin) {
      Toast.show("🔒 Apenas administradores podem adicionar jogadores!");
      return;
    }
    if (!nome.value.trim()) {
      Toast.show("Digite o nome do jogador!");
      return;
    }
    let player = {
      nome: nome.value,
      img: img.value || "https://via.placeholder.com/150?text=Jogador",
      ovr: parseInt(ovr.value) || 0,
      pac: pac.value || "0",
      sho: sho.value || "0",
      pas: pas.value || "0",
      dri: dri.value || "0",
      def: def.value || "0",
      phy: phy.value || "0"
    };
    playersRef.push(player).then(() => {
      Logger.add("➕ Adicionou Jogador", `Nome: ${player.nome} | OVR: ${player.ovr}`);
      Toast.show("Jogador salvo!");
    });
    this.clearForm();
  },
  
  edit(id, jogador) {
    // VERIFICAÇÃO DUPLA: só abre se for admin
    if (!isAdmin) {
      Toast.show("🔒 Apenas administradores podem editar jogadores!");
      return;
    }
    
    this.currentEditId = id;
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
    
    document.getElementById("editModal").classList.add("active");
  },
  
  update() {
    if (!isAdmin) {
      Toast.show("🔒 Apenas administradores podem editar jogadores!");
      this.closeModal();
      return;
    }
    
    const id = document.getElementById("editId").value;
    if (!id) return;
    
    const jogadorAtualizado = {
      nome: document.getElementById("editNome").value,
      img: document.getElementById("editImg").value || "https://via.placeholder.com/150?text=Jogador",
      ovr: parseInt(document.getElementById("editOvr").value) || 0,
      pac: document.getElementById("editPac").value || "0",
      sho: document.getElementById("editSho").value || "0",
      pas: document.getElementById("editPas").value || "0",
      dri: document.getElementById("editDri").value || "0",
      def: document.getElementById("editDef").value || "0",
      phy: document.getElementById("editPhy").value || "0"
    };
    
    playersRef.child(id).update(jogadorAtualizado).then(() => {
      Logger.add("✏️ Editou Jogador", `Nome: ${jogadorAtualizado.nome} | OVR: ${jogadorAtualizado.ovr}`);
      Toast.show("Jogador atualizado!");
      this.closeModal();
    });
  },
  
  delete() {
    if (!isAdmin) {
      Toast.show("🔒 Apenas administradores podem excluir jogadores!");
      this.closeModal();
      return;
    }
    
    const id = document.getElementById("editId").value;
    if (!id) return;
    
    if(confirm("⚠️ Tem certeza que deseja excluir este jogador? Esta ação não pode ser desfeita!")) {
      playersRef.child(id).remove().then(() => {
        Logger.add("🗑️ Excluiu Jogador", `ID: ${id}`);
        Toast.show("Jogador excluído!");
        this.closeModal();
      });
    }
  },
  
  closeModal() {
    document.getElementById("editModal").classList.remove("active");
    this.currentEditId = null;
  },
  
  clearForm() {
    nome.value = "";
    img.value = "";
    ovr.value = "";
    pac.value = "";
    sho.value = "";
    pas.value = "";
    dri.value = "";
    def.value = "";
    phy.value = "";
  },

  render(data) {
    playersList.innerHTML = "";
    if (!data) return;
    
    // Para usuários não-admin, mostra apenas visualização (sem clique)
    if (!isAdmin) {
      Object.values(data).sort((a,b)=>b.ovr - a.ovr).forEach(p => {
        playersList.innerHTML += `
        <div class="player-card-full">
          <img src="${p.img}" onerror="this.src='https://via.placeholder.com/150?text=Jogador'">
          <h3>${p.nome}</h3>
          <div class="player-ovr">OVR ${p.ovr}</div>
          <div class="player-attrs-grid">
            <div class="attr-item"><span>⚡</span> Ritmo: ${p.pac}</div>
            <div class="attr-item"><span>🎯</span> Chute: ${p.sho}</div>
            <div class="attr-item"><span>🎯</span> Passe: ${p.pas}</div>
            <div class="attr-item"><span>💫</span> Drible: ${p.dri}</div>
            <div class="attr-item"><span>🛡️</span> Defesa: ${p.def}</div>
            <div class="attr-item"><span>💪</span> Físico: ${p.phy}</div>
          </div>
          <div class="view-only-badge">👀 Visualização</div>
        </div>`;
      });
      return;
    }
    
    // Para administradores, mostra com opção de edição
    Object.entries(data).sort((a,b) => b[1].ovr - a[1].ovr).forEach(([id, p]) => {
      playersList.innerHTML += `
      <div class="player-card-full admin-card" onclick="Player.edit('${id}', ${JSON.stringify(p).replace(/"/g, '&quot;')})">
        <img src="${p.img}" onerror="this.src='https://via.placeholder.com/150?text=Jogador'">
        <h3>${p.nome}</h3>
        <div class="player-ovr">OVR ${p.ovr}</div>
        <div class="player-attrs-grid">
          <div class="attr-item"><span>⚡</span> Ritmo: ${p.pac}</div>
          <div class="attr-item"><span>🎯</span> Chute: ${p.sho}</div>
          <div class="attr-item"><span>🎯</span> Passe: ${p.pas}</div>
          <div class="attr-item"><span>💫</span> Drible: ${p.dri}</div>
          <div class="attr-item"><span>🛡️</span> Defesa: ${p.def}</div>
          <div class="attr-item"><span>💪</span> Físico: ${p.phy}</div>
        </div>
        <div class="edit-badge">✏️ Clique para editar</div>
      </div>`;
    });
  }
};

// ================= MATCHES =================
const Match = {
  formatGols(input) {
    if (!input.trim()) return "";
    let lines = input.split("\n");
    let formatted = [];
    lines.forEach(line => {
      line = line.trim();
      if (line) {
        let parts = line.split(/\s+/);
        if (parts.length >= 2) {
          let nome = parts[0];
          let minuto = parts[1];
          formatted.push(`${nome}⚽ ${minuto}'`);
        } else if (parts.length === 1) {
          formatted.push(`${parts[0]}⚽`);
        }
      }
    });
    return formatted.join("\n");
  },
  
  formatAssists(input) {
    if (!input.trim()) return "";
    let lines = input.split("\n");
    let formatted = [];
    lines.forEach(line => {
      line = line.trim();
      if (line) {
        let parts = line.split(/\s+/);
        if (parts.length >= 2) {
          let nome = parts[0];
          let minuto = parts[1];
          formatted.push(`${nome}👟 ${minuto}'`);
        } else if (parts.length === 1) {
          formatted.push(`${parts[0]}👟`);
        }
      }
    });
    return formatted.join("\n");
  },
  
  formatDefesas(input) {
    if (!input.trim()) return "";
    let lines = input.split("\n");
    let formatted = [];
    lines.forEach(line => {
      line = line.trim();
      if (line) {
        let parts = line.split(/\s+/);
        if (parts.length >= 2) {
          let nome = parts[0];
          let quantidade = parts[1];
          formatted.push(`${nome}🧤 ${quantidade} defesas`);
        } else if (parts.length === 1) {
          formatted.push(`${parts[0]}🧤`);
        }
      }
    });
    return formatted.join("\n");
  },
  
  formatCartoes(input) {
    if (!input.trim()) return "";
    let lines = input.split("\n");
    let formatted = [];
    lines.forEach(line => {
      line = line.trim();
      if (line) {
        let parts = line.split(/\s+/);
        if (parts.length >= 3) {
          let nome = parts[0];
          let minuto = parts[1];
          let tipo = parts[2].toLowerCase();
          let emoji = tipo.includes("vermelho") ? "🟥" : "🟨";
          formatted.push(`${nome}${emoji} ${minuto}'`);
        } else if (parts.length === 2) {
          let nome = parts[0];
          let minuto = parts[1];
          formatted.push(`${nome}🟨 ${minuto}'`);
        }
      }
    });
    return formatted.join("\n");
  },

  add() {
    if (!isAdmin) {
      Toast.show("🔒 Apenas administradores podem adicionar partidas!");
      return;
    }
    if (!timeA.value || !timeB.value) {
      Toast.show("Preencha os nomes dos times!");
      return;
    }
    
    let dataPartida = "";
    if (partidaData.value) {
      const dataObj = new Date(partidaData.value);
      const dia = dataObj.getDate().toString().padStart(2, '0');
      const mes = (dataObj.getMonth() + 1).toString().padStart(2, '0');
      const ano = dataObj.getFullYear();
      const dataFormatada = `${dia}/${mes}/${ano}`;
      dataPartida = partidaHora.value ? `${dataFormatada} - ${partidaHora.value}` : dataFormatada;
    } else {
      const agora = new Date();
      const dia = agora.getDate().toString().padStart(2, '0');
      const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
      const ano = agora.getFullYear();
      const hora = agora.getHours().toString().padStart(2, '0');
      const minuto = agora.getMinutes().toString().padStart(2, '0');
      dataPartida = `${dia}/${mes}/${ano} - ${hora}:${minuto}`;
    }
    
    let match = {
      timeA: timeA.value,
      timeB: timeB.value,
      timeALogo: timeALogo.value || null,
      timeBLogo: timeBLogo.value || null,
      ligaLogo: ligaLogo.value || null,
      tipoPartida: tipoPartida.value || "liga",
      placar: placar.value || "0x0",
      gols: this.formatGols(golsList.value),
      assistencias: this.formatAssists(assistsList.value),
      defesas: this.formatDefesas(defesasList.value),
      cartoes: this.formatCartoes(cartoesList.value),
      mvp: mvp.value || "",
      menc1: men1.value || "",
      menc2: men2.value || "",
      menc3: men3.value || "",
      observacoes: obsPartida.value || "",
      dataPartida: dataPartida,
      timestamp: new Date(partidaData.value + "T" + (partidaHora.value || "00:00")).getTime() || Date.now()
    };

    matchesRef.push(match).then(() => {
      Logger.add("⚽ Adicionou Partida", `${match.timeA} ${match.placar} ${match.timeB} | ${match.dataPartida}`);
      Toast.show("Partida salva!");
    });
    
    timeA.value = "";
    timeB.value = "";
    timeALogo.value = "";
    timeBLogo.value = "";
    ligaLogo.value = "";
    placar.value = "";
    golsList.value = "";
    assistsList.value = "";
    defesasList.value = "";
    cartoesList.value = "";
    mvp.value = "";
    men1.value = "";
    men2.value = "";
    men3.value = "";
    obsPartida.value = "";
    partidaData.value = "";
    partidaHora.value = "";
  },

  render(data) {
    matchesList.innerHTML = "";
    tableList.innerHTML = "";
    
    let tabela = {};
    const partidasArray = Object.entries(data || {}).sort((a,b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));

    partidasArray.forEach(([key, m]) => {
      matchesList.innerHTML += `
      <div class="match-full-card">
        <div class="match-header">
          <div class="match-liga-info">
            ${m.ligaLogo ? `<img src="${m.ligaLogo}" class="liga-logo">` : '<div class="liga-logo-placeholder">🏆</div>'}
            <span class="match-type">${m.tipoPartida === 'liga' ? '🏆 PARTIDA DE LIGA' : m.tipoPartida === 'copa' ? '🏅 COPA' : '🤝 AMISTOSO'}</span>
          </div>
          <div class="match-date-time">
            <span>📅 ${m.dataPartida || "Data não informada"}</span>
          </div>
        </div>
        
        <div class="match-teams-container">
          <div class="match-team-box">
            <div class="team-logo-wrapper">
              ${m.timeALogo ? `<img src="${m.timeALogo}" class="team-logo-big">` : '<div class="team-logo-placeholder">⚽</div>'}
            </div>
            <h3 class="team-name-big">${m.timeA}</h3>
          </div>
          <div class="match-score-big">${m.placar}</div>
          <div class="match-team-box">
            <div class="team-logo-wrapper">
              ${m.timeBLogo ? `<img src="${m.timeBLogo}" class="team-logo-big">` : '<div class="team-logo-placeholder">⚽</div>'}
            </div>
            <h3 class="team-name-big">${m.timeB}</h3>
          </div>
        </div>
        
        <div class="match-stats-grid">
          ${m.gols ? `<div class="stat-section"><div class="stat-title">⚽ GOLS</div><div class="stat-content">${m.gols.replace(/\n/g, '<br>')}</div></div>` : ''}
          ${m.assistencias ? `<div class="stat-section"><div class="stat-title">👟 ASSISTÊNCIAS</div><div class="stat-content">${m.assistencias.replace(/\n/g, '<br>')}</div></div>` : ''}
          ${m.defesas ? `<div class="stat-section"><div class="stat-title">🧤 DEFESAS</div><div class="stat-content">${m.defesas.replace(/\n/g, '<br>')}</div></div>` : ''}
          ${m.cartoes ? `<div class="stat-section"><div class="stat-title">🟨🟥 CARTÕES</div><div class="stat-content">${m.cartoes.replace(/\n/g, '<br>')}</div></div>` : ''}
        </div>
        
        <div class="match-awards">
          ${m.mvp ? `<div class="mvp-section"><div class="mvp-title">🏆 MVP</div><div class="mvp-name">⭐ ${m.mvp}</div></div>` : ''}
          ${(m.menc1 || m.menc2 || m.menc3) ? `
          <div class="mentions-section">
            <div class="mentions-title">📋 MENÇÕES</div>
            <div class="mentions-list">
              ${m.menc1 ? `<div>🥇 ${m.menc1}</div>` : ''}
              ${m.menc2 ? `<div>🥈 ${m.menc2}</div>` : ''}
              ${m.menc3 ? `<div>🥉 ${m.menc3}</div>` : ''}
            </div>
          </div>` : ''}
        </div>
        
        ${m.observacoes ? `<div class="match-observations"><div class="obs-title">📝 OBSERVAÇÕES</div><div class="obs-content">${m.observacoes}</div></div>` : ''}
      </div>`;

      let [g1, g2] = (m.placar || "0x0").split("x").map(Number);
      tabela[m.timeA] = tabela[m.timeA] || { pontos: 0, vitorias: 0, empates: 0, derrotas: 0, golsPro: 0, golsContra: 0 };
      tabela[m.timeB] = tabela[m.timeB] || { pontos: 0, vitorias: 0, empates: 0, derrotas: 0, golsPro: 0, golsContra: 0 };
      
      tabela[m.timeA].golsPro += g1;
      tabela[m.timeA].golsContra += g2;
      tabela[m.timeB].golsPro += g2;
      tabela[m.timeB].golsContra += g1;

      if (g1 > g2) {
        tabela[m.timeA].pontos += 3;
        tabela[m.timeA].vitorias += 1;
        tabela[m.timeB].derrotas += 1;
      } else if (g2 > g1) {
        tabela[m.timeB].pontos += 3;
        tabela[m.timeB].vitorias += 1;
        tabela[m.timeA].derrotas += 1;
      } else {
        tabela[m.timeA].pontos += 1;
        tabela[m.timeB].pontos += 1;
        tabela[m.timeA].empates += 1;
        tabela[m.timeB].empates += 1;
      }
    });

    Object.entries(tabela).sort((a,b) => b[1].pontos - a[1].pontos).forEach((t, index) => {
      tableList.innerHTML += `
      <div class="table-card">
        <div class="table-position">${index + 1}º</div>
        <div class="table-team">${t[0]}</div>
        <div class="table-stats">${t[1].vitorias}V/${t[1].empates}E/${t[1].derrotas}D</div>
        <div class="table-goals">${t[1].golsPro}:${t[1].golsContra}</div>
        <div class="table-points">${t[1].pontos} pts</div>
      </div>`;
    });
  }
};

// ================= LINEUP (COM FOTO DOS JOGADORES) =================
const Lineup = {
  add() {
    if (!isAdmin) {
      Toast.show("🔒 Apenas administradores podem adicionar à escalação!");
      return;
    }
    if (!pNome.value.trim()) {
      Toast.show("Digite o nome do jogador!");
      return;
    }
    
    const jogador = encontrarJogador(pNome.value);
    const imgUrl = jogador ? jogador.img : null;
    
    lineupRef.push({
      nome: pNome.value,
      x: 50,
      y: 50,
      img: imgUrl
    }).then(() => {
      Logger.add("📋 Adicionou à Escalação", `Jogador: ${pNome.value}`);
      Toast.show("Jogador adicionado ao campo!");
    });
    pNome.value = "";
  },

  render(data) {
    field.innerHTML = "";
    if (!data) return;
    
    Object.entries(data).forEach(([id, p]) => {
      let el = document.createElement("div");
      el.className = "player";
      
      if (p.img) {
        el.innerHTML = `<img src="${p.img}" class="player-img" onerror="this.style.display='none'"><span>${p.nome}</span>`;
      } else {
        el.innerHTML = `<span>${p.nome}</span>`;
      }
      
      el.style.left = p.x + "%";
      el.style.top = p.y + "%";
      el.setAttribute("data-id", id);
      el.setAttribute("data-nome", p.nome);
      el.setAttribute("draggable", "false");
      
      let isDragging = false;
      let startMouseX, startMouseY;
      let startLeft, startTop;
      
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isDragging = true;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        startLeft = parseFloat(el.style.left);
        startTop = parseFloat(el.style.top);
        el.style.cursor = "grabbing";
        el.style.opacity = "0.7";
        el.style.zIndex = "100";
      });
      
      const onMouseMove = (e) => {
        if (!isDragging) return;
        const rect = field.getBoundingClientRect();
        const deltaX = e.clientX - startMouseX;
        const deltaY = e.clientY - startMouseY;
        const deltaPercentX = (deltaX / rect.width) * 100;
        const deltaPercentY = (deltaY / rect.height) * 100;
        let newX = startLeft + deltaPercentX;
        let newY = startTop + deltaPercentY;
        newX = Math.min(Math.max(newX, 0), 100);
        newY = Math.min(Math.max(newY, 0), 100);
        el.style.left = newX + "%";
        el.style.top = newY + "%";
        lineupRef.child(id).update({ x: newX, y: newY });
      };
      
      const onMouseUp = () => {
        if (isDragging) {
          isDragging = false;
          el.style.cursor = "grab";
          el.style.opacity = "1";
          el.style.zIndex = "10";
        }
      };
      
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      el.style.cursor = "grab";
      field.appendChild(el);
    });
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
    const logsContainer = document.getElementById("logsList");
    if (!logsContainer) return;
    db.ref("logs").orderByChild("timestamp").once("value", (snap) => {
      logsContainer.innerHTML = "";
      const logs = snap.val();
      if (!logs) {
        logsContainer.innerHTML = '<div class="no-logs">📭 Nenhum log registrado</div>';
        return;
      }
      const logsArray = Object.entries(logs).sort((a,b) => b[1].timestamp - a[1].timestamp);
      logsArray.forEach(([id, log]) => {
        let icon = "📝";
        if (log.acao.includes("Jogador")) icon = "👤";
        if (log.acao.includes("Partida")) icon = "⚽";
        if (log.acao.includes("Reset")) icon = "⚠️";
        logsContainer.innerHTML += `
        <div class="log-item">
          <div class="log-header">
            <span class="log-icon">${icon}</span>
            <span class="log-usuario">${log.usuario}</span>
            <span class="log-data">📅 ${log.data}</span>
          </div>
          <div class="log-acao">${log.acao}</div>
          <div class="log-detalhes">${log.detalhes}</div>
        </div>`;
      });
      const logCount = document.getElementById("logCount");
      if (logCount) logCount.textContent = `${logsArray.length} logs`;
    });
  }
};

// ================= SYSTEM =================
const System = {
  reset() {
    if(!isAdmin) {
      Toast.show("
