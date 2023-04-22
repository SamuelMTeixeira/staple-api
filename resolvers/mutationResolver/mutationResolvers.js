const { makeExecutableSchema } = require("@graphql-tools/schema");
let schemaMapping = undefined;
const logger = require("../../config/winston");
const classMutations = require("./mutations/classMutations");
const deleteMutation = require("./mutations/deleteMutation");
// const util = require("util");

const createMutationResolvers = (database, tree, Warnings, schemaMappingArg, schemaString) => {
    logger.info("createMutationResolvers called");
    schemaMapping = schemaMappingArg;
    const schema = makeExecutableSchema({ typeDefs: schemaString });

    let newResolverBody = {};
    const mutation = schema.getTypeMap()["Mutation"].astNode;
    for (let field of mutation.fields) {
        if (field.name.value === "DELETE") {
            newResolverBody[field.name.value] = deleteMutation(database);
        }
        else {
            newResolverBody[field.name.value] = classMutations(database, schemaMapping, tree, field, mutation, field);
        }
    }
    return newResolverBody;
};


module.exports = createMutationResolvers;