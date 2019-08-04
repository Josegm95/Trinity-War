/* eslint-disable prefer-destructuring */
// eslint-disable-next-line no-undef
const socket = io('http://localhost:3000');
const heroes = [];
let myName = '';
let playerNumber = 0;
let mygame = [];

document.getElementById('login-button').addEventListener('click', () => {
  const name = document.getElementById('name').value;
  const login = document.getElementById('login');
  const chatRoom = document.getElementById('chat-room');
  const err = document.getElementById('login-error');

  if (name === '') {
    err.className = 'error-message';
    err.innerHTML = 'Debe ingresar un nombre de usuario';
  } else {
    socket.emit('check user', name, (res) => {
      if (res) {
        login.className = 'hide';
        chatRoom.className = 'chat-room';
        myName = name;
        socket.emit('new user', name);
      } else {
        err.className = 'error-message';
        err.innerHTML = 'El nombre de usuario ya está en uso';
      }
    });
  }
});

function challenge(username) {
  socket.emit('challenge', username);
}

socket.on('challenge', (username, callback) => {
  const modal = document.getElementById('modal');
  const title = document.getElementById('modal-title');
  const message = document.getElementById('modal-message');
  const acept = document.getElementById('modal-acept');
  const reject = document.getElementById('modal-reject');
  modal.className = 'modal';
  acept.className = 'modal-acept';
  reject.className = 'modal-reject';
  title.innerHTML = 'Solicitud de Duelo';
  message.innerHTML = `${username} te ha retado a un duelo`;
  acept.addEventListener('click', () => {
    acept.className = 'hide';
    reject.className = 'hide';
    modal.className = 'hide';
    callback(true);
  });
  reject.addEventListener('click', () => {
    acept.className = 'hide';
    reject.className = 'hide';
    modal.className = 'hide';
    callback(false);
  });
});

socket.on('challenge confirm', (data, res) => {
  if (res) {
    playerNumber = data[myName];
    const chatRoom = document.getElementById('chat-room');
    const selection = document.getElementById('selection');
    chatRoom.className = 'hide';
    selection.className = 'selection';
  } else {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const message = document.getElementById('modal-message');
    const acept = document.getElementById('modal-acept');
    modal.className = 'modal';
    acept.className = 'modal-acept';
    title.innerHTML = 'Respuesta del Duelo';
    message.innerHTML = `${data} ha rechazado el duelo`;
    acept.addEventListener('click', () => {
      acept.className = 'hide';
      modal.className = 'hide';
    });
  }
});

function updateNames(data) {
  const users = data[0];
  const inGame = data[1];
  const usersContainer = document.getElementById('users');
  usersContainer.innerHTML = '';
  for (let i = 0; i < users.length; i += 1) {
    const user = document.createElement('div');
    user.className = 'user';
    const name = document.createElement('span');
    name.innerHTML = users[i];
    user.appendChild(name);
    if (users[i] !== myName) {
      const btn = document.createElement('button');
      const status = document.createElement('i');
      if (inGame.indexOf(users[i]) === -1) {
        btn.onclick = () => { challenge(name.innerHTML); };
        btn.innerHTML = 'Retar';
        user.appendChild(btn);
        status.className = 'fas fa-circle connected';
      } else {
        status.className = 'fas fa-circle in-game';
      }
      user.appendChild(status);
    }
    usersContainer.appendChild(user);
  }
}

socket.on('usersnames', updateNames);

socket.on('user leave', updateNames);

document.getElementById('send-message').addEventListener('click', () => {
  const message = document.getElementById('message');
  socket.emit('new message', message.value);
  message.value = '';
});

socket.on('new message', (data) => {
  const messages = document.getElementById('messages-container');
  const div = document.createElement('div');
  div.className = 'message';
  const name = document.createElement('span');
  name.innerHTML = data.name;
  const text = document.createElement('p');
  text.innerHTML = data.message;

  div.appendChild(name);
  div.appendChild(text);
  messages.appendChild(div);
});

const tank = document.getElementById('tank');
const warrior = document.getElementById('warrior');
const wizard = document.getElementById('wizard');
const healer = document.getElementById('healer');
const selectError = document.getElementById('selection-error');

function chechHeroes(heroName, heroElement) {
  selectError.classList = 'hide';
  if (heroes.indexOf(heroName) !== -1) {
    heroes.splice(heroes.indexOf(heroName), 1);
    heroElement.classList.toggle('selected');
  } else if (heroes.length < 2) {
    heroes.push(heroName);
    heroElement.classList.toggle('selected');
  } else {
    selectError.innerHTML = 'Solo puede seleccionar 2 heroes';
    selectError.className = 'error-message';
  }
}

tank.addEventListener('click', () => {
  chechHeroes('tank', tank);
});

warrior.addEventListener('click', () => {
  chechHeroes('warrior', warrior);
});

wizard.addEventListener('click', () => {
  chechHeroes('wizard', wizard);
});

healer.addEventListener('click', () => {
  chechHeroes('healer', healer);
});

document.getElementById('choose-heroes').addEventListener('click', () => {
  if (heroes.length === 2) {
    socket.emit('chosen heroes', heroes, (res) => {
      if (!res) {
        const modal = document.getElementById('modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        modal.className = 'modal';
        title.innerHTML = 'Elección de Heroes';
        message.innerHTML = 'Esperando a que el otro jugador elija...';
      }
    });
  } else {
    selectError.innerHTML = 'Debe seleccionar 2 heroes';
    selectError.className = 'error-message';
  }
});

function updateHero(player, heroe) {
  const hp = document.getElementById(`hp-p${player}h${heroe}`);
  hp.innerHTML = mygame[player][heroe - 1].hp;

  const atk = document.getElementById(`atk-p${player}h${heroe}`);
  atk.innerHTML = mygame[player][heroe - 1].atk;

  const def = document.getElementById(`def-p${player}h${heroe}`);
  def.innerHTML = mygame[player][heroe - 1].def;
}

function updateGame() {
  updateHero(1, 1);
  updateHero(1, 2);
  updateHero(2, 1);
  updateHero(2, 2);
}

socket.on('start game', (game) => {
  const modal = document.getElementById('modal');
  modal.className = 'hide';
  const selection = document.getElementById('selection');
  const gameSection = document.getElementById('game');
  selection.className = 'hide';
  gameSection.className = 'game';
  mygame = game;

  const classp1h1 = document.getElementById('class-p1h1');
  classp1h1.innerHTML = mygame[1][0].class;
  const imgp1h1 = document.getElementById('img-p1h1');
  imgp1h1.src = `img/${mygame[1][0].class}.png`;

  const classp1h2 = document.getElementById('class-p1h2');
  classp1h2.innerHTML = mygame[1][1].class;
  const imgp1h2 = document.getElementById('img-p1h2');
  imgp1h2.src = `img/${mygame[1][1].class}.png`;

  const classp2h1 = document.getElementById('class-p2h1');
  classp2h1.innerHTML = mygame[2][0].class;
  const imgp2h1 = document.getElementById('img-p2h1');
  imgp2h1.src = `img/${mygame[2][0].class}.png`;

  const classp2h2 = document.getElementById('class-p2h2');
  classp2h2.innerHTML = mygame[2][1].class;
  const imgp2h2 = document.getElementById('img-p2h2');
  imgp2h2.src = `img/${mygame[2][1].class}.png`;

  updateGame();
});

socket.on('attack turn', (turn) => {
  const attack = document.getElementById('attack');
  const defense = document.getElementById('defense');
  const gameMessage = document.getElementById('game-message');
  const p1h1 = document.getElementById('img-p1h1');
  const p1h2 = document.getElementById('img-p1h2');
  const p2h1 = document.getElementById('img-p2h1');
  const p2h2 = document.getElementById('img-p2h2');
  const attacker = document.getElementById(`img-p${turn[0]}h${turn[1]}`);
  attack.className = '';
  defense.className = '';

  function selectVictim(player, heroe) {
    attack.className = '';
    defense.className = '';
    p1h1.className = '';
    p1h2.className = '';
    p2h1.className = '';
    p2h2.className = '';
    socket.emit('attack', [turn, [player, heroe]]);
  }

  if (turn[0] === playerNumber) {
    gameMessage.innerHTML = `Heroe fijado: ${mygame[playerNumber][turn[1] - 1].class}...`;
    attacker.className = 'attacker';

    document.getElementById('attack').addEventListener('click', () => {
      gameMessage.innerHTML = ' Seleccione El heroe que desee atacar';
      attack.className = 'hide';
      defense.className = 'hide';
      p1h1.className = 'option';
      p1h2.className = 'option';
      p2h1.className = 'option';
      p2h2.className = 'option';

      p1h1.addEventListener('click', () => {
        selectVictim(1, 1);
      });
      p1h2.addEventListener('click', () => {
        selectVictim(1, 2);
      });
      p2h1.addEventListener('click', () => {
        selectVictim(2, 1);
      });
      p2h2.addEventListener('click', () => {
        selectVictim(2, 2);
      });
    });
    document.getElementById('defense').addEventListener('click', () => {
    });
  } else {
    gameMessage.innerHTML = 'EL turno es del otro jugador';
    attack.className = 'hide';
    defense.className = 'hide';
  }
});

socket.on('attack', (game) => {
  mygame = game;
  updateGame();
});
