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
  if (!user) return false;
  let pass = prompt("🔐 Senha:");
  if (!pass) return false;
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
  location.reload();
}

function openAdmin(el){
  if(isAdmin){
    UI.go('admin', el);
    return;
  }
  if(loginAdmin()) UI.go('admin', el);
}

// ================= LOADER =================
window.onload = function() {
  setTimeout(function() {
    var loader = document.getElementById("loader");
    if(loader) loader.style.display = "none";
  }, 500);
};

// ================= TOAST =================
const Toast = {
  show(msg) {
    var toastEl = document.getElementById("toast");
    if(toastEl){
      toastEl.innerText = msg;
      toastEl.style.opacity = "1";
      setTimeout(function() { toastEl.style.opacity = "0"; }, 2500);
    }
  }
};

// ================= UI =================
const UI = {
  go(id, el) {
    var screens = document.querySelectorAll(".screen");
    for(var i = 0; i < screens.length; i++) {
      screens[i].classList.remove("active");
    }
    var target = document.getElementById(id);
    if(target) target.classList.add("active");
    
    var menus = document.querySelectorAll(".menu div");
    for(var i = 0; i < menus.length; i++) {
      menus[i].classList.remove("active");
    }
    if(el) el.classList.add("active");
    
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

playersRef.on("value", function(snap) {
  var dados = snap.val();
  if(dados){
    jogadoresLista = [];
    for(var id in dados) {
      jogadoresLista.push({
        id: id,
        nome: dados[id].nome,
        nomeLower: dados[id].nome.toLowerCase(),
        img: dados[id].img || "https://via.placeholder.com/40?text=Jogador"
      });
    }
  }
});

function encontrarJogador(nomeDigitado){
  if(!nomeDigitado) return null;
  var nomeBusca = nomeDigitado.toLowerCase().trim();
  for(var i = 0; i < jogadoresLista.length; i++) {
    if(jogadoresLista[i].nomeLower === nomeBusca || jogadoresLista[i].nomeLower.includes(nomeBusca)) {
      return jogadoresLista[i];
    }
  }
  return null;
}

// ================= ESTATÍSTICAS =================
const Stats = {
  data: {},
  
  processMatches(matches){
    this.data = {};
    if(!matches) return;
    
    for(var key in matches) {
      var match = matches[key];
      if(match.gols){
        var linhas = match.gols.split("\n");
        for(var i = 0; i < linhas.length; i++) {
          var nomeMatch = linhas[i].match(/([a-zA-ZÀ-ÿ]+(?:[0-9]*))/);
          if(nomeMatch){
            var jogador = encontrarJogador(nomeMatch[1]);
            var nome = jogador ? jogador.nome : nomeMatch[1];
            this.addStat(nome, "gols", 1, jogador?.img);
          }
        }
      }
      if(match.assistencias){
        var linhas = match.assistencias.split("\n");
        for(var i = 0; i < linhas.length; i++) {
          var nomeMatch = linhas[i].match(/([a-zA-ZÀ-ÿ]+(?:[0-9]*))/);
          if(nomeMatch){
            var jogador = encontrarJogador(nomeMatch[1]);
            var nome = jogador ? jogador.nome : nomeMatch[1];
            this.addStat(nome, "assistencias", 1, jogador?.img);
          }
        }
      }
      if(match.defesas){
        var linhas = match.defesas.split("\n");
        for(var i = 0; i < linhas.length; i++) {
          var nomeMatch = linhas[i].match(/([a-zA-ZÀ-ÿ]+(?:[0-9]*))/);
          var qtdMatch = linhas[i].match(/(\d+)\s*defesas/);
          if(nomeMatch){
            var jogador = encontrarJogador(nomeMatch[1]);
            var nome = jogador ? jogador.nome : nomeMatch[1];
            var qtd = qtdMatch ? parseInt(qtdMatch[1]) : 1;
            this.addStat(nome, "defesas", qtd, jogador?.img);
          }
        }
      }
      if(match.mvp){
        var jogador = encontrarJogador(match.mvp);
        var nome = jogador ? jogador.nome : match.mvp;
        this.addStat(nome, "mvps", 1, jogador?.img);
      }
      var mencoes = [match.menc1, match.menc2, match.menc3];
      for(var i = 0; i < mencoes.length; i++) {
        if(mencoes[i]){
          var jogador = encontrarJogador(mencoes[i]);
          var nome = jogador ? jogador.nome : mencoes[i];
          this.addStat(nome, "mensoes", 1, jogador?.img);
        }
      }
    }
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
  },
  
  render(){
    var container = document.getElementById("statsList");
    if(!container) return;
    var self = this;
    matchesRef.once("value", function(snap) {
      self.processMatches(snap.val());
      var keys = Object.keys(self.data);
      if(keys.length === 0){
        container.innerHTML = '<div class="no-stats">📊 Nenhuma estatística disponível</div>';
        return;
      }
      var sorted = [];
      for(var nome in self.data) {
        sorted.push({nome: nome, gols: self.data[nome].gols, stats: self.data[nome]});
      }
      sorted.sort(function(a,b){ return b.gols - a.gols; });
      
      container.innerHTML = "";
      for(var i = 0; i < sorted.length; i++) {
        var s = sorted[i].stats;
        container.innerHTML += `
        <div class="stats-card">
          <div class="stats-rank">${i+1}º</div>
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
  add(){
    if(!isAdmin){ Toast.show("🔒 Apenas administradores!"); return; }
    var nomeInp = document.getElementById("nome");
    if(!nomeInp.value.trim()){ Toast.show("Digite o nome!"); return; }
    playersRef.push({
      nome: nomeInp.value,
      img: document.getElementById("img").value || "https://via.placeholder.com/150?text=Jogador",
      ovr: parseInt(document.getElementById("ovr").value)||0,
      pac: document.getElementById("pac").value||"0",
      sho: document.getElementById("sho").value||"0",
      pas: document.getElementById("pas").value||"0",
      dri: document.getElementById("dri").value||"0",
      def: document.getElementById("def").value||"0",
      phy: document.getElementById("phy").value||"0"
    }).then(function() {
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
  
  // Função que cria o modal dinamicamente (SÓ PARA ADMIN)
  edit(id, jogador) {
    if(!isAdmin){ 
      Toast.show("🔒 Apenas administradores podem editar!"); 
      return; 
    }
    
    // Cria o modal dinamicamente
    var modalHtml = `
    <div id="editModal" class="modal" style="display: flex;">
      <div class="modal-content">
        <div class="modal-header">
          <h3>✏️ Editar Jogador</h3>
          <span class="modal-close" onclick="this.closest('#editModal').remove()">&times;</span>
        </div>
        <div class="modal-body">
          <input type="hidden" id="editId" value="${id}">
          <input id="editNome" placeholder="Nome" value="${jogador.nome || ''}">
          <input id="editImg" placeholder="URL da imagem" value="${jogador.img || ''}">
          <input id="editOvr" placeholder="OVR" type="number" value="${jogador.ovr || 0}">
          <div class="grid-attrs">
            <input id="editPac" placeholder="Ritmo" value="${jogador.pac || '0'}">
            <input id="editSho" placeholder="Chute" value="${jogador.sho || '0'}">
            <input id="editPas" placeholder="Passe" value="${jogador.pas || '0'}">
            <input id="editDri" placeholder="Drible" value="${jogador.dri || '0'}">
            <input id="editDef" placeholder="Defesa" value="${jogador.def || '0'}">
            <input id="editPhy" placeholder="Físico" value="${jogador.phy || '0'}">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" onclick="this.closest('#editModal').remove()">Cancelar</button>
          <button class="btn-save" onclick="Player.update()">💾 Salvar</button>
          <button class="btn-delete" onclick="Player.delete()">🗑️ Excluir</button>
        </div>
      </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  },
  
  update(){
    var modal = document.getElementById("editModal");
    if(!modal) return;
    var id = document.getElementById("editId").value;
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
    }).then(function() {
      Logger.add("✏️ Editou Jogador", "Nome: " + document.getElementById("editNome").value);
      Toast.show("Jogador atualizado!");
      if(modal) modal.remove();
    });
  },
  
  delete(){
    var modal = document.getElementById("editModal");
    if(!modal) return;
    var id = document.getElementById("editId").value;
    if(!id) return;
    if(confirm("⚠️ Excluir este jogador?")){
      playersRef.child(id).remove().then(function() {
        Logger.add("🗑️ Excluiu Jogador", "ID: " + id);
        Toast.show("Jogador excluído!");
        if(modal) modal.remove();
      });
    }
  },
  
  render(data){
    var container = document.getElementById("playersList");
    if(!container) return;
    container.innerHTML = "";
    if(!data) return;
    
    var jogadores = [];
    for(var id in data) {
      jogadores.push({id: id, dados: data[id]});
    }
    jogadores.sort(function(a,b){ return b.dados.ovr - a.dados.ovr; });
    
    // PARA NÃO-ADMIN: APENAS VISUALIZAÇÃO
    if(!isAdmin){
      for(var i = 0; i < jogadores.length; i++) {
        var p = jogadores[i].dados;
        container.innerHTML += `
        <div class="player-card-full" style="cursor: default;">
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
    
    // PARA ADMIN: COM EDIÇÃO
    for(var i = 0; i < jogadores.length; i++) {
      var p = jogadores[i].dados;
      var id = jogadores[i].id;
      container.innerHTML += `
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
    }
  }
};

// ================= MATCHES =================
const Match = {
  formatGols(input){
    if(!input || !input.trim()) return "";
    var lines = input.split("\n");
    var result = [];
    for(var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if(line){
        var parts = line.split(/\s+/);
        if(parts.length >= 2){
          result.push(parts[0] + "⚽ " + parts[1] + "'");
        } else {
          result.push(parts[0] + "⚽");
        }
      }
    }
    return result.join("\n");
  },
  
  formatAssists(input){
    if(!input || !input.trim()) return "";
    var lines = input.split("\n");
    var result = [];
    for(var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if(line){
        var parts = line.split(/\s+/);
        if(parts.length >= 2){
          result.push(parts[0] + "👟 " + parts[1] + "'");
        } else {
          result.push(parts[0] + "👟");
        }
      }
    }
    return result.join("\n");
  },
  
  formatDefesas(input){
    if(!input || !input.trim()) return "";
    var lines = input.split("\n");
    var result = [];
    for(var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if(line){
        var parts = line.split(/\s+/);
        if(parts.length >= 2){
          result.push(parts[0] + "🧤 " + parts[1] + " defesas");
        } else {
          result.push(parts[0] + "🧤");
        }
      }
    }
    return result.join("\n");
  },
  
  formatCartoes(input){
    if(!input || !input.trim()) return "";
    var lines = input.split("\n");
    var result = [];
    for(var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if(line){
        var parts = line.split(/\s+/);
        if(parts.length >= 3){
          var emoji = parts[2].toLowerCase().includes("vermelho") ? "🟥" : "🟨";
          result.push(parts[0] + emoji + " " + parts[1] + "'");
        } else if(parts.length >= 2){
          result.push(parts[0] + "🟨 " + parts[1] + "'");
        } else {
          result.push(parts[0] + "🟨");
        }
      }
    }
    return result.join("\n");
  },
  
  add(){
    if(!isAdmin){ Toast.show("🔒 Apenas administradores!"); return; }
    var timeA = document.getElementById("timeA");
    var timeB = document.getElementById("timeB");
    if(!timeA.value || !timeB.value){ Toast.show("Preencha os times!"); return; }
    
    var dataPartida = "";
    var partidaData = document.getElementById("partidaData");
    var partidaHora = document.getElementById("partidaHora");
    if(partidaData && partidaData.value){
      var d = new Date(partidaData.value);
      dataPartida = (d.getDate().toString().padStart(2,'0')) + "/" + ((d.getMonth()+1).toString().padStart(2,'0')) + "/" + d.getFullYear();
      if(partidaHora && partidaHora.value) dataPartida += " - " + partidaHora.value;
    } else {
      var a = new Date();
      dataPartida = (a.getDate().toString().padStart(2,'0')) + "/" + ((a.getMonth()+1).toString().padStart(2,'0')) + "/" + a.getFullYear() + " - " + a.getHours().toString().padStart(2,'0') + ":" + a.getMinutes().toString().padStart(2,'0');
    }
    
    matchesRef.push({
      timeA: timeA.value, timeB: timeB.value,
      timeALogo: document.getElementById("timeALogo").value||null,
      timeBLogo: document.getElementById("timeBLogo").value||null,
      ligaLogo: document.getElementById("ligaLogo").value||null,
      tipoPartida: document.getElementById("tipoPartida").value,
      placar: document.getElementById("placar").value||"0x0",
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
    }).then(function() {
      Logger.add("⚽ Adicionou Partida", timeA.value + " " + document.getElementById("placar").value + " " + timeB.value);
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
    if(partidaData) partidaData.value = "";
    if(partidaHora) partidaHora.value = "";
  },
  
  render(data){
    var matchesContainer = document.getElementById("matchesList");
    var tableContainer = document.getElementById("tableList");
    if(!matchesContainer || !tableContainer) return;
    matchesContainer.innerHTML = "";
    tableContainer.innerHTML = "";
    var tabela = {};
    
    if(!data) return;
    for(var key in data) {
      var m = data[key];
      matchesContainer.innerHTML += `
      <div class="match-full-card">
        <div class="match-header">
          <div class="match-liga-info">${m.ligaLogo ? '<img src="'+m.ligaLogo+'" class="liga-logo">' : '<div class="liga-logo-placeholder">🏆</div>'}<span class="match-type">${m.tipoPartida === 'liga' ? '🏆 LIGA' : m.tipoPartida === 'copa' ? '🏅 COPA' : '🤝 AMISTOSO'}</span></div>
          <div class="match-date-time">📅 ${m.dataPartida || "Data não informada"}</div>
        </div>
        <div class="match-teams-container">
          <div class="match-team-box"><div class="team-logo-wrapper">${m.timeALogo ? '<img src="'+m.timeALogo+'" class="team-logo-big">' : '<div class="team-logo-placeholder">⚽</div>'}</div><h3>${m.timeA}</h3></div>
          <div class="match-score-big">${m.placar}</div>
          <div class="match-team-box"><div class="team-logo-wrapper">${m.timeBLogo ? '<img src="'+m.timeBLogo+'" class="team-logo-big">' : '<div class="team-logo-placeholder">⚽</div>'}</div><h3>${m.timeB}</h3></div>
        </div>
        <div class="match-stats-grid">
          ${m.gols ? '<div class="stat-section"><div class="stat-title">⚽ GOLS</div><div class="stat-content">'+m.gols.replace(/\n/g,'<br>')+'</div></div>' : ''}
          ${m.assistencias ? '<div class="stat-section"><div class="stat-title">👟 ASSISTÊNCIAS</div><div class="stat-content">'+m.assistencias.replace(/\n/g,'<br>')+'</div></div>' : ''}
          ${m.defesas ? '<div class="stat-section"><div class="stat-title">🧤 DEFESAS</div><div class="stat-content">'+m.defesas.replace(/\n/g,'<br>')+'</div></div>' : ''}
          ${m.cartoes ? '<div class="stat-section"><div class="stat-title">🟨🟥 CARTÕES</div><div class="stat-content">'+m.cartoes.replace(/\n/g,'<br>')+'</div></div>' : ''}
        </div>
        <div class="match-awards">
          ${m.mvp ? '<div class="mvp-section"><div class="mvp-title">🏆 MVP</div><div class="mvp-name">⭐ '+m.mvp+'</div></div>' : ''}
          ${(m.menc1||m.menc2||m.menc3) ? '<div class="mentions-section"><div class="mentions-title">📋 MENÇÕES</div><div class="mentions-list">'+(m.menc1 ? '<div>🥇 '+m.menc1+'</div>' : '')+(m.menc2 ? '<div>🥈 '+m.menc2+'</div>' : '')+(m.menc3 ? '<div>🥉 '+m.menc3+'</div>' : '')+'</div></div>' : ''}
        </div>
        ${m.observacoes ? '<div class="match-observations"><div class="obs-title">📝 OBSERVAÇÕES</div><div class="obs-content">'+m.observacoes+'</div></div>' : ''}
      </div>`;
      
      var placarParts = (m.placar || "0x0").split("x");
      var g1 = parseInt(placarParts[0]) || 0;
      var g2 = parseInt(placarParts[1]) || 0;
      
      if(!tabela[m.timeA]) tabela[m.timeA] = {p:0,v:0,e:0,d:0,gp:0,gc:0};
      if(!tabela[m.timeB]) tabela[m.timeB] = {p:0,v:0,e:0,d:0,gp:0,gc:0};
      tabela[m.timeA].gp += g1;
      tabela[m.timeA].gc += g2;
      tabela[m.timeB].gp += g2;
      tabela[m.timeB].gc += g1;
      if(g1 > g2){
        tabela[m.timeA].p += 3;
        tabela[m.timeA].v++;
        tabela[m.timeB].d++;
      } else if(g2 > g1){
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
    
    var timesOrdenados = [];
    for(var time in tabela) {
      timesOrdenados.push({nome: time, pontos: tabela[time].p, stats: tabela[time]});
    }
    timesOrdenados.sort(function(a,b){ return b.pontos - a.pontos; });
    for(var i = 0; i < timesOrdenados.length; i++) {
      var s = timesOrdenados[i].stats;
      tableContainer.innerHTML += '<div class="table-card"><div class="table-position">'+(i+1)+'º</div><div class="table-team">'+timesOrdenados[i].nome+'</div><div class="table-stats">'+s.v+'V/'+s.e+'E/'+s.d+'D</div><div class="table-goals">'+s.gp+':'+s.gc+'</div><div class="table-points">'+s.p+' pts</div></div>';
    }
  }
};

// ================= LINEUP =================
const Lineup = {
  add(){
    if(!isAdmin){ Toast.show("🔒 Apenas administradores!"); return; }
    var pNome = document.getElementById("pNome");
    if(!pNome.value.trim()){ Toast.show("Digite o nome!"); return; }
    var jogador = encontrarJogador(pNome.value);
    lineupRef.push({ nome: pNome.value, x: 50, y: 50, img: jogador?.img || null }).then(function() {
      Logger.add("📋 Adicionou à Escalação", "Jogador: " + pNome.value);
      Toast.show("Jogador adicionado!");
    });
    pNome.value = "";
  },
  render(data){
    var field = document.getElementById("field");
    if(!field) return;
    field.innerHTML = "";
    if(!data) return;
    
    for(var id in data) {
      var p = data[id];
      var el = document.createElement("div");
      el.className = "player";
      if(p.img){
        el.innerHTML = '<img src="'+p.img+'" class="player-img" onerror="this.style.display=\'none\'"><span>'+p.nome+'</span>';
      } else {
        el.innerHTML = '<span>'+p.nome+'</span>';
      }
      el.style.left = p.x + "%";
      el.style.top = p.y + "%";
      var dragging = false;
      var startX, startY, startLeft, startTop;
      
      el.onmousedown = function(e, id, el) {
        return function(e) {
          e.preventDefault();
          dragging = true;
          startX = e.clientX;
          startY = e.clientY;
          startLeft = parseFloat(el.style.left);
          startTop = parseFloat(el.style.top);
          el.style.cursor = "grabbing";
          
          document.onmousemove = function(e) {
            if(!dragging) return;
            var rect = field.getBoundingClientRect();
            var newX = startLeft + ((e.clientX - startX) / rect.width) * 100;
            var newY = startTop + ((e.clientY - startY) / rect.height) * 100;
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
      }(null, id, el);
      
      field.appendChild(el);
    }
  }
};

// ================= LOGGER =================
const Logger = {
  add(action, details){
    if(!currentUser) return;
    db.ref("logs").push({ usuario: currentUser, acao: action, detalhes: details, data: new Date().toLocaleString(), timestamp: firebase.database.ServerValue.TIMESTAMP });
  },
  render(){
    var container = document.getElementById("logsList");
    if(!container) return;
    db.ref("logs").orderByChild("timestamp").once("value", function(snap) {
      container.innerHTML = "";
      var logs = snap.val();
      if(!logs){ container.innerHTML = '<div class="no-logs">📭 Nenhum log</div>'; return;
