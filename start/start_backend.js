/* eslint-disable node/no-unsupported-features/es-syntax */
const {
    ApolloServer
} = require("apollo-server-express");
const express = require("express");
const {Prisma} = require("../database/generated/prisma-client");
const resolvers = require("./resolvers")
const schema = require("./schema")
const schemaDirectives = require("./directives");

class StartServer {
    constructor() { }
    async startServer() { 
        const server = new ApolloServer({
            typeDefs: schema,
            resolvers,
            schemaDirectives:schemaDirectives,
            context: req => ({
                ...req,
                prisma: new Prisma({
                    endpoint: "http://localhost:4466/gql/dev",//prismaUrl
                    debug: true,
                }),
            }),
            playground: true,
        });
        const app = express();
        server.applyMiddleware({app});
        const port = 4000;
        app.listen({port}, () =>   
        console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`),
        )
    }
}


module.exports = StartServer;