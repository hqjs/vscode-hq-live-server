import process from 'process';
import serve from '@hqjs/hq';

(async () => {
  const [ , , root, port, arg, buildArg ] = process.argv;
  const defaultPort = Number(port);
  const hq = await serve(root, defaultPort, { build: arg === 'build', buildArg });

  process.send(`${hq.server.protocol}://${hq.server.localIP}:${hq.app.port}`);
})();
