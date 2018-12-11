import { parse } from "graphql/language/parser"
import { Kind } from "graphql/language/kinds"


const KIND_NON_NULL = "NON_NULL";
const KIND_OBJECT = "OBJECT";
const KIND_SCALAR = "SCALAR";
const KIND_LIST = "LIST";

function transformType(inputSchema, type)
{
    if (type.kind === Kind.NON_NULL_TYPE)
    {
        return {
            kind: KIND_NON_NULL,
            ofType: transformType(inputSchema, type.type)
        };
    }
    else if (type.kind === Kind.NAMED_TYPE)
    {
        const name = type.name.value;

        const typeDef = inputSchema.getType(name);

        return {
            kind: typeDef.kind === KIND_SCALAR ? KIND_SCALAR : KIND_OBJECT,
            name
        };
    }
    else if (type.kind === Kind.LIST_TYPE)
    {
        return {
            kind: KIND_LIST,
            ofType: transformType(inputSchema, type.type)
        };
    }

    throw new Error("Unhandled type: " + JSON.stringify(type));
}


/**
 * Parses the given query and returns a map with type references for the used variables.
 *
 * @param {InputSchema} inputSchema     input schema
 * @param {String} query                GraphQL query document
 *
 * @return {Object} object mapping variable names to type references.
 */
export default function(inputSchema, query)
{
    const vars = {};

    const document = parse(query);

    if (!document || document.kind !== Kind.DOCUMENT)
    {
        throw new Error("Could not parse query: " + query + " => " + JSON.stringify(document))
    }

    const { definitions } = document;

    for (let i = 0; i < definitions.length; i++)
    {
        const definition = definitions[i];
        if (definition.kind === Kind.OPERATION_DEFINITION)
        {
            const { variableDefinitions } = definition;

            for (let j = 0; j < variableDefinitions.length; j++)
            {
                const variableDefinition = variableDefinitions[j];

                const name = variableDefinition.variable.name.value;
                vars[name] = transformType(inputSchema, variableDefinition.type);
            }
        }
    }

    return vars;
}
