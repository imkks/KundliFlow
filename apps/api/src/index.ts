import { createApiServer } from './server.js';

const PORT = Number(process.env.PORT ?? 8787);
const server = createApiServer();

server.listen(PORT, () => {
  console.log(`MyAstro API listening on http://localhost:${PORT}`);
});
