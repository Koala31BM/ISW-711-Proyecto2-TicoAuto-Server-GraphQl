require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const { ApolloServer }     = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');

const typeDefs  = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { getAuthUser } = require('./middleware/auth');

async function startServer() {
  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production'
  });

  await server.start();

  app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
  app.use(express.json({ limit: '10kb' }));

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => ({ user: getAuthUser(req) })
    })
  );

  app.get('/health', (_, res) => res.json({ status: 'ok', service: 'TicoAuto GraphQL' }));

  const db = mongoose.connection;

  db.on('error', (err) => {
    console.error('[MongoDB] Error:', err);
    process.exit(1);
  });

  db.once('connected', () => {
    const PORT = process.env.GRAPHQL_PORT || 4000;
    app.listen(PORT, () => {
      console.log(`[GraphQL] http://localhost:${PORT}/graphql`);
    });
  });

  await mongoose.connect(process.env.DATABASE_URL);
}

startServer();