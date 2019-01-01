/* eslint-disable node/no-unsupported-features/es-syntax */
const {makeExecutableSchema} = require("graphql-tools");
const {importSchema} = require("graphql-import");
const {resolve} = require("path");
const schemaDirectives = require("../authDirective");
const {Prisma} = require("../../../database/generated/prisma-client");
const resolvers = require("../resolvers");
const {graphql} = require("graphql");
const prisma= new Prisma({
    endpoint: "http://localhost:4466/gql/dev",//prisma URL
    debug: true,
});
const authTests = [{
    id: "signup",
    query: `
    mutation{
        signup(name:"useradmin",username:"useradmin",password:"123456",role:"ADMIN"){
            token
          user{
            name
          }
        }
      }      
    `,
    context: ({
        prisma: prisma,
    }),
    expected: { 
        name: "useradmin"
    }
},
{
    id: "createUser",
    isTokenRequired: true,
    query: `
    mutation{
        createUser(name:"usertest",username:"usertest",password:"123456",role:"USER"){
            token
          user{
            name
          }
        }
      }      
    `,
    context: ({
        req:{headers:{authorization:""}},
        prisma: prisma,
    }),
    expected: { 
        name: "usertest"
    }
},
{
    id: "login",
    query: `
    mutation{
        login(username:"useradmin",password:"123456"){
        token
          user{
            name
          }
        }
      }   
    `,
    context: ({
        prisma: prisma,
    }),
    expected: { 
        name: "useradmin"     
    }
}
];
const authNegetiveTests = {
    createUser: {
        id: "createUser",
        query: `
    mutation{
        createUser(name:"usertest",username:"usertest",password:"123456",role:"USER"){
            token
          user{
            name
          }
        }
      }      
    `,
        context: ({
            prisma: prisma,
        }),
        expectedError: "Authentication error"
        
    }, 
    deleteUserWithoutIdOrUsername: {
        id: "deleteUser",
        query: `
    mutation{
        deleteUser(username: ""){
            name
        }
      }   
    `,
        context: ({
            req:{headers:{authorization:""}},
            prisma: prisma,
        }),
        expectedError: "No Id or Username found for User"

    },
    loginWithWrongPassword: {
        id: "loginWithWrongPassword",
        query:`
        mutation{
            login(username:"useradmin",password:"456"){
            token
              user{
                name
              }
            }
          }   
        `,
        context: ({
            prisma: prisma,
        }),
        expectedError: "Invalid Password"
    },
    loginWithInvalidUser: {
        id: "loginWithInvalidUser",
        query:`
        mutation{
            login(username:"usera",password:"123456"){
            token
              user{
                name
              }
            }
          }   
        `,
        context: ({
            prisma: prisma,
        }),
        expectedError: "No user found for user:usera"
    }
};
const authQueriesTests = [{
    id: "user",
    query: `
    query{
        user{
          name
        }
      }   
    `,
    context: ({
        req:{headers:{authorization:""}},
        prisma: prisma,
    }),
    expected: { 
        name: "useradmin"     
    },
    
}];
const deleteUser = (deleteUsername) => {
    return ({
        id: "deleteUser",
        query: `
    mutation{
        deleteUser(username: "${deleteUsername}"){
            name
        }
      }   
    `,
        context: ({
            req:{headers:{authorization:""}},
            prisma: prisma,
        }),
        expected: { 
            name: `${deleteUsername}`    
        }
    });
};

describe("auth", () => {
    let token = {};
    const cases = authTests;
    const mockSchema = makeExecutableSchema({
        typeDefs: importSchema(resolve(__dirname,"../../auth/auth.graphql")),
        resolvers,
        schemaDirectives: schemaDirectives,
    });

    cases.forEach(obj => {
        const {id, query, context, expected} = obj;
        test(`mutation ${id}`, async () => {
            if(obj.isTokenRequired)
                context.req.headers.authorization = "Bearer "+token["useradmin"];
            const output = await graphql(mockSchema, query, null, context);
            token[output.data[id].user.name] = output.data[id].token;
            return expect(output.data[id].user).toEqual(expected);
        });
    });
    const authNegetiveCases = authNegetiveTests;
    Object.values(authNegetiveCases).forEach(obj => {
        const {id, query, context, expectedError} = obj;
        test(`query ${id}`, async () => {
            if(context.req)
                context.req.headers.authorization = "Bearer "+token["useradmin"];
            else
                context["req"] = {"headers":{"authorization" : ""}};
            const output = await graphql(mockSchema, query, null, context);
            console.log(output)
            return expect(output.errors[0].message).toEqual(expectedError);
        });
    });

    test("createUser with incorrect role", async () => {
        const {query, context, expectedError} = authNegetiveCases.createUser;
        context["req"] = {"headers":{"authorization" : "Bearer "+token["usertest"]}};
        const output = await graphql(mockSchema, query, null, context);
        return expect(output.errors[0].message).toEqual("Not authorized");
    });

    const queryCases = authQueriesTests;
    queryCases.forEach(obj => {
        const {id, query, context, expected} = obj;
        test(`query ${id}`, async () => {
            context.req.headers.authorization = "Bearer "+token["useradmin"];
            const output = await graphql(mockSchema, query, null, context);
            return expect(output.data[id]).toEqual(expected);
        });
    });
    test("Mutation deleteNormalUser", async () => {
        const deleteUsername = "usertest";
        const {query, context, expected} = deleteUser(deleteUsername);
        context.req.headers.authorization = "Bearer "+token["useradmin"];
        const output = await graphql(mockSchema, query, null, context);
        return expect(output.data["deleteUser"]).toEqual(expected);
    });
    test("Mutation deleteAdminUser", async () => {
        const deleteUsername = "useradmin";
        const {query, context, expected} = deleteUser(deleteUsername);
        context.req.headers.authorization = "Bearer "+token["useradmin"];
        const output = await graphql(mockSchema, query, null, context);
        return expect(output.data["deleteUser"]).toEqual(expected);
    });
});