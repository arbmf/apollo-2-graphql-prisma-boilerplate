const {gql} = require("apollo-server-express");
const {importSchema} = require("graphql-import")
const {resolve} = require("path");

const schemas = [gql(importSchema(resolve(__dirname,"../components/auth/auth.graphql")))];

module.exports = schemas;