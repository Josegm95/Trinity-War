/* eslint-disable no-param-reassign */
const Sockets = (io) => {
  const users = {};
  const inGame = [];
  const games = [];

  class Tank {
    constructor() {
      this.class = 'tank';
      this.hp = 100;
      this.atk = 10;
      this.def = 50;
    }
  }

  class Warrior {
    constructor() {
      this.class = 'warrior';
      this.hp = 100;
      this.atk = 40;
      this.def = 20;
    }
  }

  class Wizard {
    constructor() {
      this.class = 'wizard';
      this.hp = 100;
      this.atk = 50;
      this.def = 10;
    }
  }

  class Healer {
    constructor() {
      this.class = 'healer';
      this.hp = 150;
      this.atk = 10;
      this.def = 10;
    }
  }

  function createHero(name) {
    let heroe = null;
    if (name === 'tank') {
      heroe = new Tank();
    } else if (name === 'warrior') {
      heroe = new Warrior();
    } else if (name === 'wizard') {
      heroe = new Wizard();
    } else if (name === 'healer') {
      heroe = new Healer();
    }
    return heroe;
  }

  io.on('connection', (socket) => {
    socket.on('check user', (name, callback) => {
      if (name in users) {
        callback(false);
      } else {
        socket.join('chatRoom');
        callback(true);
      }
    });

    function updateNames() {
      io.to('chatRoom').emit('usersnames', [Object.keys(users), inGame]);
    }

    socket.on('new user', (name) => {
      socket.name = name;
      users[name] = socket;
      updateNames();
    });

    socket.on('new message', (message) => {
      io.to('chatRoom').emit('new message', {
        name: socket.name,
        message,
      });
    });

    socket.on('challenge', (username) => {
      users[username].emit('challenge', socket.name, (res) => {
        if (res) {
          const gameId = games.length;
          games[gameId] = [false];
          socket.leave('chatRoom');
          inGame.push(socket.name);
          socket.join(gameId);
          socket.game = gameId;
          socket.player = 1;

          users[username].leave('chatRoom');
          inGame.push(username);
          users[username].join(gameId);
          users[username].game = gameId;
          users[username].player = 2;

          const players = {};
          players[socket.name] = socket.player;
          players[username] = users[username].player;

          io.to(gameId).emit('challenge confirm', players, res);
          updateNames();
        } else {
          socket.emit('challenge confirm', username, res);
        }
      });
    });

    socket.on('chosen heroes', (heroesNames, callback) => {
      const heroes = [];
      heroesNames.forEach((heroe) => {
        const h = createHero(heroe);
        heroes.push(h);
      });
      games[socket.game][socket.player] = heroes;
      if (games[socket.game][0] === true) {
        games[socket.game].push([1, 1]); // player turn [player, heroe]
        io.to(socket.game).emit('start game', games[socket.game]);
        io.to(socket.game).emit('attack turn', games[socket.game][3]);
      } else {
        games[socket.game][0] = true;
        callback(false);
      }
    });

    socket.on('attack', (attack) => {
      const attacker = games[socket.game][attack[0][0]][attack[0][1] - 1];
      games[socket.game][attack[1][0]][attack[1][1] - 1].hp -= attacker.atk;

      if (games[socket.game][3][1] === 1) {
        games[socket.game][3][1] += 1;
      } else if (games[socket.game][3][0] === 2) {
        games[socket.game][3] = [1, 1];
      } else {
        games[socket.game][3][0] += 1;
        games[socket.game][3][1] -= 1;
      }

      io.to(socket.game).emit('attack', games[socket.game]);
      io.to(socket.game).emit('attack turn', games[socket.game][3]);
    });

    socket.on('disconnect', () => {
      if (socket.name) {
        delete users[socket.name];
        if (inGame.indexOf(socket.name) !== -1) {
          inGame.splice(inGame.indexOf(socket.name), 1);
        }
        updateNames();
      }
    });
  });
};

module.exports = Sockets;
