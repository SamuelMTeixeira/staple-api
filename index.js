const { makeExecutableSchema } = require('@graphql-tools/schema')
const DatabaseInterface = require("./database/database");
const Resolver = require("./resolvers/resolvers");
const schemaFromOntology = require("./schema/schemaFromOntology");
const jsonldFromOntology = require("./schema/jsonldFromOntology");
const { printSchema, graphql } = require("graphql");
const fs = require("fs");

async function init(ontology, configObject) {
    //handle config object
    if (configObject.file) {
        configObject = JSON.parse(fs.readFileSync(configObject.file));
    } else if (configObject.url) {
        const response = await fetch(configObject.url);
        configObject = await response.json();
    }
    if (!configObject.dataSources) {
        throw Error("Wrong config object!");
    }

    const schemaObj = {};
    const schema = await schemaFromOntology.generateSchema(
        ontology,
        configObject
    );

    schemaObj.schemaSDL = printSchema(schema);
    schemaObj.schemaMapping = await jsonldFromOntology.process(ontology);
    schemaObj.context = schemaObj.schemaMapping["@context"];
    schemaObj.database = new DatabaseInterface(
        schemaObj.schemaMapping,
        configObject
    );

    schemaObj.Warnings = []; // Warnings can be added as object to schemaObj array. Array is clear after each query.
    schemaObj.rootResolver = new Resolver(
        schemaObj.database,
        schemaObj.Warnings,
        schemaObj.schemaMapping,
        schemaObj.schemaSDL
    ).rootResolver; // Generate Resolvers for graphql

    schemaObj.schema = makeExecutableSchema({
        typeDefs: schemaObj.schemaSDL,
        resolvers: schemaObj.rootResolver,
    });

    schemaObj.graphql = async (query) => graphql(schemaObj.schema, query);

    return schemaObj;
}

module.exports = init;