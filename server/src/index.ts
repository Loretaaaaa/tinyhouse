require("dotenv").config();

import express, { Application } from "express";
import { ApolloServer } from "apollo-server-express";
import { resolvers } from "./graphql/resolvers";
import { typeDefs } from "./graphql/typeDefs";
import { connectDatabase } from "./database";

const app = express();

const mount = async (app: Application) => {
  const db = await connectDatabase();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: () => ({ db }),
  });
  server
    .start()
    .then(() => {
      server.applyMiddleware({ app: app as any, path: "/api" });
      app.listen(process.env.PORT);
      console.log(`[app]: http://localhost:${process.env.PORT}`);
    })
    .catch((error) => {
      console.error(error);
    });
};

mount(express());
