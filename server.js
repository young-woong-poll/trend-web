const express = require('express');
const next = require('next');
const http = require('http');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const port = 3000;
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  let isDisableKeepAlive = false;
  server.use((req, res, next) => {
    if (isDisableKeepAlive) {
      res.set('Connection', 'close');
    }
    next();
  });

  server.use((req, res) => {
    return handle(req, res);
  });

  const httpServer = http.createServer(server);

  httpServer.listen(port, (err) => {
    if (err) throw err;
    if (process.send) {
      process.send('ready');
      console.log(`${new Date()}: application is listening on port ${port}...`);
    }
  });

  process.on('SIGINT', () => {
    isDisableKeepAlive = true;
    httpServer.close(() => {
      console.log('server closed');
      process.exit(0);
    });
  });
});
