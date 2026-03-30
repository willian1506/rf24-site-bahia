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
  {user:"willian1506", pass:"willian123"},
  {user:"stormy", pass:"183524"},
  {user:"Mkz", pass:"12456453"}
];

// ================= LOGIN =================
let isAdmin = localStorage.getItem("admin") === "true";

function loginAdmin(){
  let user = prompt("Usuário:");
  let pass = prompt("Senha:");
  let autorizado = ADMINS.find(a => a.user === user && a.pass === pass);
  if(autorizado){
    isAdmin = true;
    localStorage.setItem("admin", "true");
    Toast.show("Login salvo!");
  } else {
    Toast.show("Acesso negado!");
  }
}

function logoutAdmin(){
  isAdmin = false;
  localStorage.removeItem("admin");
  Toast.show("Saiu da conta!");
}

function openAdmin(el){
  if(!isAdmin){
    loginAdmin();
    if(!isAdmin) return;
  }
  UI.go('admin', el);
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
  }
};

// ================= DATABASE REF =================
const playersRef = db.ref("players");
const matchesRef = db.ref("matches");
const lineupRef = db.ref("lineup");

// ================= PLAYERS =================
const Player = {
  add() {
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
    playersRef.push(player);
    nome.value = "";
    img.value = "";
    ovr.value = "";
    pac.value = "";
    sho.value = "";
    pas.value = "";
    dri.value = "";
    def.value = "";
    phy.value = "";
    Toast.show("Jogador salvo online!");
  },

  render(data) {
    playersList.innerHTML = "";
    Object.values(data || {})
      .sort((a,b)=>b.ovr - a.ovr)
      .forEach(p => {
        playersList.innerHTML += `
        <div class="card">
          <img src="${p.img}" onerror="this.src='https://via.placeholder.com/150?text=Jogador'">
          <h3>${p.nome}</h3>
          <p>OVR ${p.ovr}</p>
          <div class="player-attrs">
            <span>⚡${p.pac}</span>
            <span>🎯${p.sho}</span>
            <span>🎯${p.pas}</span>
            <span>💫${p.dri}</span>
            <span>🛡️${p.def}</span>
            <span>💪${p.phy}</span>
          </div>
        </div>`;
      });
  }
};

// ================= MATCHES COMPLETO COM FORMATAÇÃO AUTOMÁTICA =================
const Match = {
  
  // Função para formatar gols
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
  
  // Função para formatar assistências
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
  
  // Função para formatar defesas
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
  
  // Função para formatar cartões
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
    if (!timeA.value || !timeB.value) {
      Toast.show("Preencha os nomes dos times!");
      return;
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
      data: new Date().toLocaleString()
    };

    matchesRef.push(match);
    
    // Limpa os campos
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
    
    Toast.show("Partida salva com formatação automática!");
  },

  render(data) {
    matchesList.innerHTML = "";
    tableList.innerHTML = "";
    scorersList.innerHTML = "";

    let tabela = {};
    let artilharia = {};

    Object.values(data || {}).forEach(m => {
      // Renderiza partida com design completo
      matchesList.innerHTML += `
      <div class="match-full-card">
        <!-- Header com logo da liga -->
        <div class="match-header">
          <div class="match-liga-info">
            ${m.ligaLogo ? `<img src="${m.ligaLogo}" class="liga-logo" alt="Liga">` : '<div class="liga-logo-placeholder">🏆</div>'}
            <span class="match-type">${m.tipoPartida === 'liga' ? '🏆 PARTIDA DE LIGA' : m.tipoPartida === 'copa' ? '🏅 COPA' : '🤝 AMISTOSO'}</span>
          </div>
          <div class="match-date">📅 ${m.data}</div>
        </div>
        
        <!-- Times e Placar -->
        <div class="match-teams-container">
          <div class="match-team-box">
            <div class="team-logo-wrapper">
              ${m.timeALogo ? `<img src="${m.timeALogo}" class="team-logo-big" alt="${m.timeA}">` : '<div class="team-logo-placeholder">⚽</div>'}
            </div>
            <h3 class="team-name-big">${m.timeA}</h3>
          </div>
          <div class="match-score-big">${m.placar}</div>
          <div class="match-team-box">
            <div class="team-logo-wrapper">
              ${m.timeBLogo ? `<img src="${m.timeBLogo}" class="team-logo-big" alt="${m.timeB}">` : '<div class="team-logo-placeholder">⚽</div>'}
            </div>
            <h3 class="team-name-big">${m.timeB}</h3>
          </div>
        </div>
        
        <!-- Estatísticas -->
        <div class="match-stats-grid">
          ${m.gols ? `
          <div class="stat-section">
            <div class="stat-title">⚽ GOLS</div>
            <div class="stat-content">${m.gols.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}
          
          ${m.assistencias ? `
          <div class="stat-section">
            <div class="stat-title">👟 ASSISTÊNCIAS</div>
            <div class="stat-content">${m.assistencias.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}
          
          ${m.defesas ? `
          <div class="stat-section">
            <div class="stat-title">🧤 DEFESAS</div>
            <div class="stat-content">${m.defesas.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}
          
          ${m.cartoes ? `
          <div class="stat-section">
            <div class="stat-title">🟨🟥 CARTÕES</div>
            <div class="stat-content">${m.cartoes.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}
        </div>
        
        <!-- MVPs e Menções -->
        <div class="match-awards">
          ${m.mvp ? `
          <div class="mvp-section">
            <div class="mvp-title">🏆 MELHOR DA PARTIDA (MVP)</div>
            <div class="mvp-name">⭐ ${m.mvp}</div>
          </div>
          ` : ''}
          
          ${(m.menc1 || m.menc2 || m.menc3) ? `
          <div class="mentions-section">
            <div class="mentions-title">📋 MENÇÕES HONROSAS</div>
            <div class="mentions-list">
              ${m.menc1 ? `<div class="mention-item">🥇 ${m.menc1}</div>` : ''}
              ${m.menc2 ? `<div class="mention-item">🥈 ${m.menc2}</div>` : ''}
              ${m.menc3 ? `<div class="mention-item">🥉 ${m.menc3}</div>` : ''}
            </div>
          </div>
          ` : ''}
        </div>
        
        ${m.observacoes ? `
        <div class="match-observations">
          <div class="obs-title">📝 OBSERVAÇÕES</div>
          <div class="obs-content">${m.observacoes}</div>
        </div>
        ` : ''}
      </div>`;

      // Cálculo da tabela
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

      // Artilharia (extrai nomes dos gols formatados)
      if (m.gols) {
        let golsLines = m.gols.split("\n");
        golsLines.forEach(line => {
          let matchNome = line.match(/([a-zA-ZÀ-ÿ]+)/);
          if (matchNome) {
            let nome = matchNome[1];
            artilharia[nome] = (artilharia[nome] || 0) + 1;
          }
        });
      }
    });

    // Renderiza tabela
    Object.entries(tabela)
      .sort((a,b) => b[1].pontos - a[1].pontos)
      .forEach((t, index) => {
        tableList.innerHTML += `
        <div class="table-card">
          <div class="table-position">${index + 1}º</div>
          <div class="table-team">${t[0]}</div>
          <div class="table-stats">${t[1].vitorias}V/${t[1].empates}E/${t[1].derrotas}D</div>
          <div class="table-goals">${t[1].golsPro}:${t[1].golsContra}</div>
          <div class="table-points">${t[1].pontos} pts</div>
        </div>`;
      });

    // Renderiza artilharia
    Object.entries(artilharia)
      .sort((a,b) => b[1] - a[1])
      .forEach((a, index) => {
        scorersList.innerHTML += `
        <div class="scorer-card">
          <div class="scorer-position">${index + 1}º</div>
          <div class="scorer-name">${a[0]}</div>
          <div class="scorer-goals">⚽ ${a[1]}</div>
        </div>`;
      });
  }
};
// ================= LINEUP =================
const Lineup = {
  add() {
    if (!pNome.value.trim()) {
      Toast.show("Digite o nome do jogador!");
      return;
    }
    lineupRef.push({
      nome: pNome.value,
      x: 50,
      y: 50
    });
    pNome.value = "";
    Toast.show("Jogador adicionado ao campo!");
  },

  render(data) {
    field.innerHTML = "";
    if (!data) return;

    Object.entries(data).forEach(([id, p]) => {
      let el = document.createElement("div");
      el.className = "player";
      el.innerText = p.nome;
      el.style.left = p.x + "%";
      el.style.top = p.y + "%";
      el.setAttribute("data-id", id);
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

// ================= REALTIME LISTENERS =================
playersRef.on("value", snap => {
  Player.render(snap.val());
});

matchesRef.on("value", snap => {
  Match.render(snap.val());
});

lineupRef.on("value", snap => {
  Lineup.render(snap.val());
});

// ================= SYSTEM =================
const System = {
  reset() {
    if(confirm("⚠️ ATENÇÃO! Isso vai apagar TODOS os dados do banco. Tem certeza?")) {
      db.ref().set(null);
      Toast.show("Banco de dados resetado!");
      setTimeout(() => location.reload(), 1500);
    }
  }
};

// ================= SEARCH =================
const searchPlayer = document.getElementById("searchPlayer");
if (searchPlayer) {
  searchPlayer.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll("#playersList .card");
    cards.forEach(card => {
      const nome = card.querySelector("h3")?.innerText.toLowerCase() || "";
      card.style.display = nome.includes(searchTerm) ? "block" : "none";
    });
  });
}
