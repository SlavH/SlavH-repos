import { createServer, IncomingMessage, ServerResponse } from 'http';

const port = parseInt(process.env.PORT || '3000', 10);

const routes: Record<string, Record<string, (req: IncomingMessage, res: ServerResponse) => void>> = {
  '/health': {
    GET: (_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: '{{name}}' }));
    },
  },
};

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const route = routes[url.pathname];
  const handler = route?.[req.method || 'GET'];
  if (handler) {
    handler(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(port, () => {
  console.log(`{{name}} running on http://localhost:${port}`);
});
