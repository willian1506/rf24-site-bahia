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
    let player = {
      nome: nome.value,
      img: img.value,
      ovr: parseInt(ovr.value) || 0,
      pac: pac.value,
      sho: sho.value,
      pas: pas.value,
      dri: dri.value,
      def: def.value,
      phy: phy.value
    };

    playersRef.push(player);
    Toast.show("Jogador salvo online!");
  },

  render(data) {
    playersList.innerHTML = "";

    Object.values(data || {})
      .sort((a,b)=>b.ovr - a.ovr)
      .forEach(p => {
        playersList.innerHTML += `
        <div class="card">
          <img src="${p.img}">
          <h3>${p.nome}</h3>
          <p>OVR ${p.ovr}</p>
        </div>`;
      });
  }
};

// ================= MATCHES =================
const Match = {

  add() {
    let match = {
      timeA: timeA.value,
      timeB: timeB.value,
      placar: placar.value,
      gols: gols.value
    };

    matchesRef.push(match);
    Toast.show("Partida salva!");
  },

  render(data) {
    matchesList.innerHTML = "";
    tableList.innerHTML = "";
    scorersList.innerHTML = "";

    let tabela = {};
    let artilharia = {};

    Object.values(data || {}).forEach(m => {

      matchesList.innerHTML += `
      <div class="card">
        ${m.timeA} ${m.placar} ${m.timeB}
      </div>`;

      let [g1, g2] = (m.placar || "0x0").split("x").map(Number);

      tabela[m.timeA] = (tabela[m.timeA] || 0);
      tabela[m.timeB] = (tabela[m.timeB] || 0);

      if (g1 > g2) tabela[m.timeA] += 3;
      else if (g2 > g1) tabela[m.timeB] += 3;
      else {
        tabela[m.timeA] += 1;
        tabela[m.timeB] += 1;
      }

      if (m.gols) {
        let [nome, qtd] = m.gols.split(":");
        artilharia[nome] = (artilharia[nome] || 0) + parseInt(qtd);
      }
    });

    Object.entries(tabela).forEach(t => {
      tableList.innerHTML += `
      <div class="card">
        ${t[0]} - ${t[1]} pts
      </div>`;
    });

    Object.entries(artilharia).forEach(a => {
      scorersList.innerHTML += `
      <div class="card">
        ${a[0]} ⚽ ${a[1]}
      </div>`;
    });
  }
};

// ================= LINEUP =================
const Lineup = {

  add() {
    lineupRef.push({
      nome: pNome.value,
      x: 50,
      y: 50
    });

    Toast.show("Jogador adicionado ao campo!");
  },

  render(data) {
    field.innerHTML = "";

    Object.entries(data || {}).forEach(([id, p]) => {

      let el = document.createElement("div");
      el.className = "player";
      el.innerText = p.nome;
      el.style.left = p.x + "%";
      el.style.top = p.y + "%";

      let dragging = false;

      el.onmousedown = (e) => {
        dragging = true;
      };

      document.onmouseup = () => dragging = false;

      document.onmousemove = (e) => {
        if (!dragging) return;

        let rect = field.getBoundingClientRect();

        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;

        el.style.left = x + "%";
        el.style.top = y + "%";

        lineupRef.child(id).update({ x, y });
      };

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
    if(confirm("Tem certeza?")) {
      db.ref().set(null);
      Toast.show("Banco resetado!");
    }
  }
};
