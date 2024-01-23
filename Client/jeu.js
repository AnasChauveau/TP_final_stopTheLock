const token = localStorage.getItem('token');

if (!token) {
    document.location.href="index.html";
}

const socket = io('http://localhost:3000');

// socket.on('attente', () => {
//   console.log("Manque 1 joueur !");
//   document.getElementById('app').innerHTML = "En attente d'un joueur : 1/2 ...";
// });

// socket.on('ok', () => {
//   console.log("Prêt à lancer la partie !");
//   document.getElementById('app').innerHTML = "Joueur trouvé !<br> La partie va commencer !";
// });

socket.emit('getRoomList', localStorage.getItem("token"));

let deco = document.getElementById('deco');
let btnDeco = document.createElement('button');
btnDeco.addEventListener('click', async (event) => {
    const response = await fetch('http://localhost:3000/api/auth/logout', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    });
    localStorage.removeItem("token");
    document.location.href="index.html";
})
btnDeco.innerHTML = "Se déconnecter";
deco.appendChild(btnDeco);

let secondes = 0;

let page = document.getElementById('page');
let jeu = document.getElementById('jeu');
let jeu2 = document.getElementById('jeu2');
let jeu3 = document.getElementById('jeu3');
let divRooms = document.getElementById('rooms');
let divBtn = document.getElementById('createRoom');
let btn = document.createElement("button");
btn.addEventListener('click', (event) => {
    socket.emit('createRoom', localStorage.getItem("token"));
    page.style.display = "none";
    jeu.innerHTML = "En attente d'un autre joueur ..."
    divRooms.innerHTML = "";
});
btn.innerText = "Créer une nouvelle partie";
divBtn.appendChild(btn);

socket.on('roomList', (roomList) => {
    roomList.forEach(element => {
        let btn2 = document.createElement("button");
        btn2.style.marginBottom = "0.8rem";
        btn2.addEventListener('click', (event) => {
            socket.emit('joinRoom', localStorage.getItem("token"), element);
            page.style.display = "none";
        });
        btn2.innerText = element;
        divRooms.appendChild(btn2);
    });
})

socket.on('roomFull', (roomList) => {
    alert("Le groupe est déjà plein !")
    page.style.display = "block";
    jeu.innerHTML = ""
})

socket.on('lancer', (objectif, room) => {
    secondes = objectif;
    jeu.innerHTML = "<h3>Objectif : "+secondes+" Secondes</h3>"
    jeu2.innerHTML = "La partie va commencer, l'objectif est d'arréter le compteur le plus proche possible de "+objectif+" secondes !";
    setTimeout(() => socket.emit('ok', room), 3000)
})

socket.on('countdown', (number) => {
    jeu2.innerHTML = "<h3>"+number+"</h3>"
})

socket.on('go', () => {
    jeu2.innerHTML = '';
    let counter = 0;
    let startTime = Date.now();
  
    let intervalId = setInterval(() => {
      counter = ((Date.now() - startTime) / 1000).toFixed(3);
    }, 1);

      let btnStop = document.createElement("button");
      btnStop.innerHTML = "STOP";
      btnStop.addEventListener('click', (event) => {
        clearInterval(intervalId);
        socket.emit('time', localStorage.getItem("token"));
        jeu2.innerHTML = counter.toString();
        jeu3.innerHTML = "Chargement du résultat ..."
      });
      jeu3.innerHTML = '';
      jeu3.appendChild(btnStop);
})

socket.on('victoire', () => {
    jeu3.innerHTML = "Vous avez Gagné !"
})

socket.on('defeat', () => {
    jeu3.innerHTML = "Vous avez Perdu !"
})

socket.on('tokenErreur',() => {
    localStorage.removeItem("token");
    alert("erreur au niveau du token")
    document.location.href="index.html";
})

// socket.on('jouer', () => {
//     let page = document.getElementById('app');
//     let btn = document.createElement("button");
//     btn.innerText = "Lancer";
//     page.appendChild(btn);
// });