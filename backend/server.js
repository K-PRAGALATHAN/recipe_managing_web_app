import 'dotenv/config';
import http from 'node:http';
import process from 'node:process';
import { createApp } from './src/app.js';

const app = createApp();
const port = Number(process.env.PORT ?? 4000);

const server = http.createServer(app);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${port}`);
});

