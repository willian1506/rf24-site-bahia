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
  if (!user || user === null) return false;
  let pass = prompt("🔐 Senha:");
  if (!pass || pass === null) return false;
  let autorizado = ADMINS.find(a => a.user === user && a.pass === pass);
  if(autorizado){
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

function logoutAdmin(){
  isAdmin = false;
  currentUser = null;
  localStorage.removeItem("admin");
  localStorage.removeItem("currentUser");
  Toast.show("👋 Saiu do admin!");
  UI.go('home', document.querySelector('.menu div:first-child'));
}

function openAdmin(el){
  if(isAdmin){
    UI.go('admin', el);
    return;
  }
  if(loginAdmin()) UI.go('admin', el);
}

// ================= LOADER =================
window.onload = () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    if(loader) loader.style.display = "none";
  }, 800);
};

// ================= TOAST =================
const Toast = {
  show(msg) {
    const toastEl = document.getElementById("toast");
    if(toastEl){
      toastEl.innerText = msg;
      toastEl.style.opacity = 1;
      setTimeout(() => toastEl.style.opacity = 0, 2500);
    }
  }
};

// ================= UI (CORRIGIDO) =================
const UI = {
  go(id, el) {
    // Esconde todas as telas
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    // Mostra a tela selecionada
    const targetScreen = document.getElementById(id);
    if(targetScreen) targetScreen.classList.add("active");
    
    // Remove active de todos os menus
    document.querySelectorAll(".menu div").forEach(m => m.classList.remove("active"));
    // Adiciona active no menu clicado
    if(el) el.classList.add("active");
    
    // Recarrega logs se for admin
    if(id === "admin" && isAdmin) Logger.render();
    if(id === "scorers") Stats.render();
  }
};

// ================= DATABASE REF =================
const playersRef = db.ref("players");
const matchesRef = db.ref("matches");
const lineupRef = db.ref("lineup");

// ================= LISTA DE JOGADORES =================
let jogadoresLista = [];

playersRef.on("value", (snap) => {
  const dados = snap.val();
  if(dados){
    jogadoresLista = Object.entries(dados).map(([id, j]) => ({
      id: id,
      nome: j.nome,
      nomeLower: j.nome.toLowerCase(),
      img: j.img || "https://via.placeholder.com/40?text=Jogador"
    }));
  }
});

function encontrarJogador(nomeDigitado){
  if(!nomeDigitado) return null;
  const nomeBusca = nomeDigitado.toLowerCase().trim();
  return jogadoresLista.find(j => j.nomeLower === nomeBusca || j.nomeLower.includes(nomeBusca)) || null;
}

// ================= ESTATÍSTICAS =================
const Stats = {
  data: {},
  
  processMatches(matches){
    this.data = {};
    if(!matches) return;
    
    Object.values(matches).forEach(match => {
      if(match.gols){
        match.gols.split("\n").forEach(line => {
          const nomeMatch = line.match(/([a-zA-ZÀ-ÿ]+(?:[0-9]*))/);
          if(nomeMatch){
            const jogador = encontrarJogador(nomeMatch[1]);
            const nome = jogador ? jogador.nome : nomeMatch[1];
            this.addStat(nome, "gols", 1, jogador?.img);
          }
        });
      }
      if(match.assistencias){
        match.assistencias.split("\n").forEach(line => {
          const nomeMatch = line.match(/([a-zA-ZÀ-ÿ]+(?:[0-9]*))/);
          if(nomeMatch){
            const jogador = encontrarJogador(nomeMatch[1]);
            const nome = jogador ? jogador.nome : nomeMatch[1];
            this.addStat(nome, "assistencias", 1, jogador?.img);
          }
        });
      }
      if(match.defesas){
        match.defesas.split("\n").forEach(line => {
          const nomeMatch = line.match(/([a-zA-ZÀ-ÿ]+(?:[0-9]*))/);
          const qtdMatch = line.match(/(\d+)\s*defesas/);
          if(nomeMatch){
            const jogador = encontrarJogador(nomeMatch[1]);
            const nome = jogador ? jogador.nome : nomeMatch[1];
            const qtd = qtdMatch ? parseInt(qtdMatch[1]) : 1;
            this.addStat(nome, "defesas", qtd, jogador?.img);
          }
        });
      }
      if(match.mvp){
        const jogador = encontrarJogador(match.mvp);
        const nome = jogador ? jogador.nome : match.mvp;
        this.addStat(nome, "mvps", 1, jogador?.img);
      }
      [match.menc1, match.menc2, match.menc3].forEach(men => {
        if(men){
          const jogador = encontrarJogador(men);
          const nome = jogador ? jogador.nome : men;
          this.addStat(nome, "mensoes", 1, jogador?.img);
        }
      });
    });
  },
  
  addStat(nome, tipo, valor, imagem){
    if(!this.data[nome]){
      this.data[nome] = {
        gols: 0, assistencias: 0, defesas: 0, mvps: 0, mensoes: 0,
        total: 0, img: imagem || "https://via.placeholder.com/60?text=Jogador"
      };
    }
    this.data[nome][tipo] += valor;
    this.data[nome].total = this.data[nome].gols + this.data[nome].assistencias + this.data[nome].defesas;
    if(imagem && this.data[nome].img === "https://via.placeholder.com/60?text=Jogador") this.data[nome].img = imagem;
  },
  
  render(){
    const container = document.getElementById("statsList");
    if(!container) return;
    matchesRef.once("value", snap => {
      this.processMatches(snap.val());
      if(Object.keys(this.data).length === 0){
        container.innerHTML = '<div class="no-stats">📊 Nenhuma estatística disponível</div>';
        return;
      }
      const sorted = Object.entries(this.data).sort((a,b) => b[1].gols - a[1].gols);
      container.innerHTML = "";
      sorted.forEach(([nome, stats], i) => {
        container.innerHTML += `
        <div class="stats-card">
          <div class="stats-rank">${i+1}º</div>
          <div class="stats-player-img"><img src="${stats.img}" class="stats-img" onerror="this.src='https://via.placeholder.com/60?text=Jogador'"></div>
          <div class="stats-player-info"><div class="stats-player-name">${nome}</div></div>
          <div class="stats-numbers">
            <div class="stat-item"><span class="stat-icon">⚽</span><span class="stat-value">${stats.gols}</span><span class="stat-label">Gols</span></div>
            <div class="stat-item"><span class="stat-icon">👟</span><span class="stat-value">${stats.assistencias}</span><span class="stat-label">Assist.</span></div>
            <div class="stat-item"><span class="stat-icon">🧤</span><span class="stat-value">${stats.defesas}</span><span class="stat-label">Defesas</span></div>
            <div class="stat-item"><span class="stat-icon">🏆</span><span class="stat-value">${stats.mvps}</span><span class="stat-label">MVP</span></div>
            <div class="stat-item"><span class="stat-icon">📋</span><span class="stat-value">${stats.mensoes}</span><span class="stat-label">Menções</span></div>
          </div>
          <div class="stats-total"><span>🎯 Total: ${stats.total}</span></div>
        </div>`;
      });
    });
  }
};

// ================= PLAYERS (SEM EDIÇÃO FORA DO ADMIN) =================
const Player = {
  add(){
    if(!isAdmin){ Toast.show("🔒 Apenas administradores!"); return; }
    if(!nome.value.trim()){ Toast.show("Digite o nome!"); return; }
    playersRef.push({
      nome: nome.value, img: img.value || "https://via.placeholder.com/150?text=Jogador",
      ovr: parseInt(ovr.value)||0, pac: pac.value||"0", sho: sho.value||"0",
      pas: pas.value||"0", dri: dri.value||"0", def: def.value||"0", phy: phy.value||"0"
    }).then(() => {
      Logger.add("➕ Adicionou Jogador", `Nome: ${nome.value}`);
      Toast.show("Jogador salvo!");
    });
    nome.value = img.value = ovr.value = pac.value = sho.value = pas.value = dri.value = def.value = phy.value = "";
  },
  
  edit(id, jogador){
    if(!isAdmin){ Toast.show("🔒 Apenas administradores!"); return; }
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
  
  update(){
    if(!isAdmin){ Toast.show("🔒 Apenas administradores!"); this.closeModal(); return; }
    const id = document.getElementById("editId").value;
    if(!id) return;
    playersRef.child(id).update({
      nome: document.getElementById("editNome").value,
      img: document.getElementById("editImg").value || "https://via.placeholder.com/150?text=Jogador",
      ovr: parseInt(document.getElementById("editOvr").value)||0,
      pac: document.getElementById("editPac").value||"0",
      sho: document.getElementById("editSho").value||"0",
      pas: document.getElementById("editPas").value||"0",
      dri: document.getElementById("editDri").value||"0",
      def: document.getElementById("editDef").value||"0",
      phy: document.getElementById("editPhy").value||"0"
    }).then(() => {
      Logger.add("✏️ Editou Jogador", `Nome: ${document.getElementById("editNome").value}`);
      Toast.show("Jogador atualizado!");
      this.closeModal();
    });
  },
  
  delete(){
    if(!isAdmin){ Toast.show("🔒 Apenas administradores!"); this.closeModal(); return; }
    const id = document.getElementById("editId").value;
    if(!id) return;
    if(confirm("⚠️ Excluir este jogador?")){
      playersRef.child(id).remove().then(() => {
        Logger.add("🗑️ Excluiu Jogador", `ID: ${id}`);
        Toast.show("Jogador excluído!");
        this.closeModal();
      });
    }
  },
  
  closeModal(){
    document.getElementById("editModal").classList.remove("active");
  },
  
  render(data){
    playersList.innerHTML = "";
    if(!data) return;
    
    // Para não-admin: só visualização
    if(!isAdmin){
      Object.values(data).sort((a,b)=>b.ovr - a.ovr).forEach(p => {
        playersList.innerHTML += `
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
      });
      return;
    }
    
    // Para admin: com edição
    Object.entries(data).sort((a,b)=>b[1].ovr - a[1].ovr).forEach(([id, p]) => {
      playersList.innerHTML += `
      <div class="player-card-full admin-card" onclick="Player.edit('${id}', ${JSON.stringify(p).replace(/"/g, '&quot;')})">
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
    });
  }
};

// ================= MATCHES =================
const Match = {
  formatGols(input){
    if(!input.trim()) return "";
    return input.split("\n").map(line => {
      let parts = line.trim().split(/\s+/);
      return parts.length >= 2 ? `${parts[0]}⚽ ${parts[1]}'` : `${parts[0]}⚽`;
    }).join("\n");
  },
  formatAssists(input){
    if(!input.trim()) return "";
    return input.split("\n").map(line => {
      let parts = line.trim().split(/\s+/);
      return parts.length >= 2 ? `${parts[0]}👟 ${parts[1]}'` : `${parts[0]}👟`;
    }).join("\n");
  },
  formatDefesas(input){
    if(!input.trim()) return "";
    return input.split("\n").map(line => {
      let parts = line.trim().split(/\s+/);
      return parts.length >= 2 ? `${parts[0]}🧤 ${parts[1]} defesas` : `${parts[0]}🧤`;
    }).join("\n");
  },
  formatCartoes(input){
    if(!input.trim()) return "";
    return input.split("\n").map(line => {
      let parts = line.trim().split(/\s+/);
      if(parts.length >= 3){
        let emoji = parts[2].toLowerCase().includes("vermelho") ? "🟥" : "🟨";
        return `${parts[0]}${emoji} ${parts[1]}'`;
      }
      return parts.length >= 2 ? `${parts[0]}🟨 ${parts[1]}'` : `${parts[0]}🟨`;
    }).join("\n");
  },
  
  add(){
    if(!isAdmin){ Toast.show("🔒 Apenas administradores!"); return; }
    if(!timeA.value || !timeB.value){ Toast.show("Preencha os times!"); return; }
    
    let dataPartida = "";
    if(partidaData.value){
      const d = new Date(partidaData.value);
      dataPartida = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
      if(partidaHora.value) dataPartida += ` - ${partidaHora.value}`;
    } else {
      const a = new Date();
      dataPartida = `${a.getDate().toString().padStart(2,'0')}/${(a.getMonth()+1).toString().padStart(2,'0')}/${a.getFullYear()} - ${a.getHours().toString().padStart(2,'0')}:${a.getMinutes().toString().padStart(2,'0')}`;
    }
    
    matchesRef.push({
      timeA: timeA.value, timeB: timeB.value,
      timeALogo: timeALogo.value||null, timeBLogo: timeBLogo.value||null,
      ligaLogo: ligaLogo.value||null, tipoPartida: tipoPartida.value,
      placar: placar.value||"0x0",
      gols: this.formatGols(golsList.value),
      assistencias: this.formatAssists(assistsList.value),
      defesas: this.formatDefesas(defesasList.value),
      cartoes: this.formatCartoes(cartoesList.value),
      mvp: mvp.value, menc1: men1.value, menc2: men2.value, menc3: men3.value,
      observacoes: obsPartida.value, dataPartida: dataPartida,
      timestamp: Date.now()
    }).then(() => {
      Logger.add("⚽ Adicionou Partida", `${timeA.value} ${placar.value} ${timeB.value}`);
      Toast.show("Partida salva!");
    });
    
    timeA.value = timeB.value = timeALogo.value = timeBLogo.value = ligaLogo.value = placar.value = "";
    golsList.value = assistsList.value = defesasList.value = cartoesList.value = "";
    mvp.value = men1.value = men2.value = men3.value = obsPartida.value = "";
    partidaData.value = partidaHora.value = "";
  },
  
  render(data){
    matchesList.innerHTML = "";
    tableList.innerHTML = "";
    let tabela = {};
    Object.values(data || {}).forEach(m => {
      matchesList.innerHTML += `
      <div class="match-full-card">
        <div class="match-header">
          <div class="match-liga-info">${m.ligaLogo ? `<img src="${m.ligaLogo}" class="liga-logo">` : '<div class="liga-logo-placeholder">🏆</div>'}<span class="match-type">${m.tipoPartida === 'liga' ? '🏆 LIGA' : m.tipoPartida === 'copa' ? '🏅 COPA' : '🤝 AMISTOSO'}</span></div>
          <div class="match-date-time">📅 ${m.dataPartida || "Data não informada"}</div>
        </div>
        <div class="match-teams-container">
          <div class="match-team-box"><div class="team-logo-wrapper">${m.timeALogo ? `<img src="${m.timeALogo}" class="team-logo-big">` : '<div class="team-logo-placeholder">⚽</div>'}</div><h3>${m.timeA}</h3></div>
          <div class="match-score-big">${m.placar}</div>
          <div class="match-team-box"><div class="team-logo-wrapper">${m.timeBLogo ? `<img src="${m.timeBLogo}" class="team-logo-big">` : '<div class="team-logo-placeholder">⚽</div>'}</div><h3>${m.timeB}</h3></div>
        </div>
        <div class="match-stats-grid">
          ${m.gols ? `<div class="stat-section"><div class="stat-title">⚽ GOLS</div><div class="stat-content">${m.gols.replace(/\n/g,'<br>')}</div></div>` : ''}
          ${m.assistencias ? `<div class="stat-section"><div class="stat-title">👟 ASSISTÊNCIAS</div><div class="stat-content">${m.assistencias.replace(/\n/g,'<br>')}</div></div>` : ''}
          ${m.defesas ? `<div class="stat-section"><div class="stat-title">🧤 DEFESAS</div><div class="stat-content">${m.defesas.replace(/\n/g,'<br>')}</div></div>` : ''}
          ${m.cartoes ? `<div class="stat-section"><div class="stat-title">🟨🟥 CARTÕES</div><div class="stat-content">${m.cartoes.replace(/\n/g,'<br>')}</div></div>` : ''}
        </div>
        <div class="match-awards">
          ${m.mvp ? `<div class="mvp-section"><div class="mvp-title">🏆 MVP</div><div class="mvp-name">⭐ ${m.mvp}</div></div>` : ''}
          ${(m.menc1||m.menc2||m.menc3) ? `<div class="mentions-section"><div class="mentions-title">📋 MENÇÕES</div><div class="mentions-list">${m.menc1 ? `<div>🥇 ${m.menc1}</div>` : ''}${m.menc2 ? `<div>🥈 ${m.menc2}</div>` : ''}${m.menc3 ? `<div>🥉 ${m.menc3}</div>` : ''}</div></div>` : ''}
        </div>
        ${m.observacoes ? `<div class="match-observations"><div class="obs-title">📝 OBSERVAÇÕES</div><div class="obs-content">${m.observacoes}</div></div>` : ''}
      </div>`;
      
      let [g1,g2] = (m.placar||"0x0").split("x").map(Number);
      [m.timeA, m.timeB].forEach(t => { if(!tabela[t]) tabela[t] = {p:0,v:0,e:0,d:0,gp:0,gc:0}; });
      tabela[m.timeA].gp += g1; tabela[m.timeA].gc += g2;
      tabela[m.timeB].gp += g2; tabela[m.timeB].gc += g1;
      if(g1>g2){ tabela[m.timeA].p+=3; tabela[m.timeA].v++; tabela[m.timeB].d++; }
      else if(g2>g1){ tabela[m.timeB].p+=3; tabela[m.timeB].v++; tabela[m.timeA].d++; }
      else{ tabela[m.timeA].p++; tabela[m.timeB].p++; tabela[m.timeA].e++; tabela[m.timeB].e++; }
    });
    Object.entries(tabela).sort((a,b)=>b[1].p - a[1].p).forEach(([time, s], i) => {
      tableList.innerHTML += `<div class="table-card"><div class="table-position">${i+1}º</div><div class="table-team">${time}</div><div class="table-stats">${s.v}V/${s.e}E/${s.d}D</div><div class="table-goals">${s.gp}:${s.gc}</div><div class="table-points">${s.p} pts</div></div>`;
    });
  }
};

// ================= LINEUP =================
const Lineup = {
  add(){
    if(!isAdmin){ Toast.show("🔒 Apenas administradores!"); return; }
    if(!pNome.value.trim()){ Toast.show("Digite o nome!"); return; }
    const jogador = encontrarJogador(pNome.value);
    lineupRef.push({ nome: pNome.value, x: 50, y: 50, img: jogador?.img || null }).then(() => {
      Logger.add("📋 Adicionou à Escalação", `Jogador: ${pNome.value}`);
      Toast.show("Jogador adicionado!");
    });
    pNome.value = "";
  },
  render(data){
    field.innerHTML = "";
    if(!data) return;
    Object.entries(data).forEach(([id, p]) => {
      let el = document.createElement("div");
      el.className = "player";
      el.innerHTML = p.img ? `<img src="${p.img}" class="player-img" onerror="this.style.display='none'"><span>${p.nome}</span>` : `<span>${p.nome}</span>`;
      el.style.left = p.x + "%";
      el.style.top = p.y + "%";
      let drag = false, sx, sy, sl, st;
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        drag = true;
        sx = e.clientX; sy = e.clientY;
        sl = parseFloat(el.style.left); st = parseFloat(el.style.top);
        el.style.cursor = "grabbing";
      });
      const move = (e) => {
        if(!drag) return;
        const rect = field.getBoundingClientRect();
        let nx = sl + ((e.clientX - sx) / rect.width) * 100;
        let ny = st + ((e.clientY - sy) / rect.height) * 100;
        nx = Math.min(Math.max(nx,0),100);
        ny = Math.min(Math.max(ny,0),100);
        el.style.left = nx + "%";
        el.style.top = ny + "%";
        lineupRef.child(id).update({ x: nx, y: ny });
      };
      const up = () => { drag = false; el.style.cursor = "grab"; };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      field.appendChild(el);
    });
  }
};

// ================= LOGGER =================
const Logger = {
  add(action, details){
    if(!currentUser) return;
    db.ref("logs").push({ usuario: currentUser, acao: action, detalhes: details, data: new Date().toLocaleString(), timestamp: firebase.database.ServerValue.TIMESTAMP });
  },
  render(){
    const container = document.getElementById("logsList");
    if(!container) return;
    db.ref("logs").orderByChild("timestamp").once("value", snap => {
      container.innerHTML = "";
      const logs = snap.val();
      if(!logs){ container.innerHTML = '<div class="no-logs">📭 Nenhum log</div>'; return; }
      Object.entries(logs).sort((a,b)=>b[1].timestamp - a[1].timestamp).forEach(([id,log]) => {
        let icon = log.acao.includes("Jogador") ? "👤" : log.acao.includes("Partida") ? "⚽" : log.acao.includes("Reset") ? "⚠️" : "📝";
        container.innerHTML += `<div class="log-item"><div class="log-header"><span class="log-icon">${icon}</span><span class="log-usuario">${log.usuario}</span><span class="log-data">📅 ${log.data}</span></div><div class="log-acao">${log.acao}</div><div class="log-detalhes">${log.detalhes}</div></div>`;
      });
      const count = document.getElementById("logCount");
      if(count) count.textContent = `${Object.keys(logs).length} logs`;
    });
  }
};

// ================= SYSTEM =================
const System = {
  reset(){
    if(!isAdmin){ Toast.show("Sem permissão!"); return; }
    if(confirm("⚠️ Resetar todos os dados? (LOGS serão mantidos)")){
      playersRef.set(null); matchesRef.set(null); lineupRef.set(null);
      Logger.add("⚠️ Reset Total", "Dados apagados");
      Toast.show("Dados resetados!");
      setTimeout(() => location.reload(), 1500);
    }
  }
};

// ================= LISTENERS =================
playersRef.on("value", snap => Player.render(snap.val()));
matchesRef.on("value", snap => { Match.render(snap.val()); Stats.processMatches(snap.val()); });
lineupRef.on("value", snap => Lineup.render(snap.val()));

// ================= SEARCH =================
document.getElementById("searchPlayer")?.addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll("#playersList .player-card-full").forEach(c => {
    c.style.display = c.querySelector("h3")?.innerText.toLowerCase().includes(term) ? "block" : "none";
  });
});
document.getElementById("searchStats")?.addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll("#statsList .stats-card").forEach(c => {
    c.style.display = c.querySelector(".stats-player-name")?.innerText.toLowerCase().includes(term) ? "flex" : "none";
  });
});
