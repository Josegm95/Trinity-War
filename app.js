const express = require('express');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const favicon = require('serve-favicon');
const routes = require('./routes/router');
const Sockets = require('./sockets/sockets');

app.set('port', process.env.PORT || 3000);
app.use(routes);
app.use(express.static(`${__dirname}/public`));
app.use(favicon(`${__dirname}/public/img/favicon.png`));

server.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}`);
});

Sockets(io);
