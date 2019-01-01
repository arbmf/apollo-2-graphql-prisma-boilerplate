# apollo-graphql-prisma-boilerplate
Uses Apollo server 2 and prisma for mongoDB to provide the base boilerplate with authentication using JWT, authorization using graphql directives, tests using jest and a feature based architecture.

This has been built on Apollo docs and Prisma docs

* DB: MongoDB
* DBHelper: Prisma
* Authentication: JWT
* Authorization: Built using GraphQL directives
* Test: Jest and graphql
* Architecture: component/feature based

Usage:

Edit your prisma url

Run in the /database directory:
```
prisma deploy
```

or 

```
PRISMA_MANAGEMENT_API_SECRET=somesecret prisma deploy
```

Then run in root

```
yarn install
node index.js
```
  
To test run in root
```
yarn test
```

