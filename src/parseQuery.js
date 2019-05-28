import { parse } from "graphql/language/parser"
import { Kind } from "graphql/language/kinds"


const KIND_NON_NULL = "NON_NULL";
const KIND_OBJECT = "OBJECT";
const KIND_SCALAR = "SCALAR";
const KIND_LIST = "LIST";


/**
 * Converts a GraphQL document parsing type reference to the format exported by schema introspection / what WireFormat
 * uses
 *
 * @param {InputSchema } inputSchema    input schema instance
 * @param {Object} type                 type reference
 * 
 * @return {Object} schema type reference
 */
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


function join(path, segment)
{
    if (path)
    {
        return path + "." + segment;
    }
    return segment;
}


/**
 * Recursively builds the aliases map.
 *
 * @param {Object} aliases          map ( path => field alias)
 * @param {Object} selectionSet     current selectionSet structure
 * @param {String} path             current path
 *
 * @return {object|boolean} aliases map or `false` if there are no aliases
 */
function collectAliases(aliases, selectionSet, path)
{
    let haveAliases = false;
    if (selectionSet)
    {
        const { selections } = selectionSet;

        for (let i = 0; i < selections.length; i++)
        {
            const field = selections[i];
            if (field.kind === "Field")
            {
                const pathForField = join(path , field.name.value);
                if (field.alias)
                {
                    aliases[join(path , field.name.value)] = field.alias.value;
                    haveAliases = true;
                }

                if (collectAliases(aliases, field.selectionSet, pathForField))
                {
                    haveAliases = true;
                }
            }
        }
    }

    return haveAliases ? aliases : false;
}


function getMethods(selectionSet)
{
    const methods = [];
    if (selectionSet)
    {
        const { selections } = selectionSet;

        for (let i = 0; i < selections.length; i++)
        {
            const field = selections[i];
            if (field.kind === "Field")
            {
                methods.push(field.name.value);
            }
        }
    }

    return methods;

}


/**
 * Result type of parseQuery. A simplified transformation of the GraphQL language parser document structure.
 *
 * @typedef QueryDefinition
 * @type {object}
 * @property {Array<String>} methods      method names used in the query
 * @property {Object} vars                Map mapping variable names to a type reference
 * @property {Object} aliases             Map mapping fully qualified field names to the alias name of that field
 */

/**
 * Parses the given query and returns a map with type references for the used variables.
 *
 * @param {InputSchema} inputSchema     input schema
 * @param {String} query                GraphQL query document
 *
 * @return {QueryDefinition} object mapping variable names to type references.
 */
export default function parseQuery(inputSchema, query)
{
    const vars = {};

    const document = parse(query);

    if (!document || document.kind !== Kind.DOCUMENT)
    {
        throw new Error("Could not parse query: " + query + " => " + JSON.stringify(document))
    }

    //console.log("DOCUMENT", JSON.stringify(document, null, 4))

    const definitions = document.definitions.filter(def => def.kind === Kind.OPERATION_DEFINITION);

    if (definitions.length > 1)
    {
        throw new Error("GraphQL query should only contain a single definition: is " + definitions.map(def => def.name ? def.name.value : "Unnamed").join(", "))
    }

    const definition = definitions[0];

    const { variableDefinitions } = definition;

    for (let j = 0; j < variableDefinitions.length; j++)
    {
        const variableDefinition = variableDefinitions[j];

        const name = variableDefinition.variable.name.value;
        vars[name] = transformType(inputSchema, variableDefinition.type);
    }

    return {
        methods: getMethods(definition.selectionSet),
        vars,
        aliases: collectAliases({}, definition.selectionSet, "")
    };
}
