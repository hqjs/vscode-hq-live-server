import process from 'process';
import serve from '@hqjs/hq';

(async () => {
  const [ , , root, port, arg ] = process.argv;
  const defaultPort = Number(port);
  const hq = await serve(root, defaultPort, { build: arg === 'build' });

  process.send(`${hq.server.protocol}://${hq.server.localIP}:${hq.app.port}`);
})();
