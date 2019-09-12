#!/usr/bin/env -S node --experimental-modules --no-warnings

import process from 'process';
import serve from '@hqjs/hq';

(async () => {
  const [ , , root ] = process.argv;
  const defaultPort = Number(process.argv[3]);
  const hq = await serve(root, defaultPort);

  process.send(`http://${hq.server.localIP}:${hq.app.port}`);
})();
