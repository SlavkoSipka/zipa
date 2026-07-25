import http from 'http';

let app = require('./server').default;

const server = http.createServer(app);

let currentApp = app;

// Port se zadaje kroz SERVER_PORT (na hostingu: `SERVER_PORT=$PORT npm run start:prod`).
// Namerno se ne koristi PORT: Razzle ga pri build-u zamenjuje fiksnom vrednošću,
// a u dev režimu ga sam postavlja na 3000.
const port = process.env.SERVER_PORT || 10016;

server.listen(port, error => {
  if (error) {
    console.log(error);
  }

  console.log(`🚀 started on port ${port}`);
});

if (module.hot) {
  console.log('✅  Server-side HMR Enabled!');

  module.hot.accept('./server', () => {
    console.log('🔁  HMR Reloading `./server`...');

    try {
      app = require('./server').default;
      server.removeListener('request', currentApp);
      server.on('request', app);
      currentApp = app;
    } catch (error) {
      console.error(error);
    }
  });
}
