import config from "./config"
import { observable } from "mobx";
import { getWireFormat } from "./domain";
import GraphQLQuery from "./GraphQLQuery";
import { getGraphQLMethodType } from "./process/Process";


/**
 * Logs graphql errors
 * @param errors
 */
export function defaultErrorHandler(errors)
{
    console.error("GraphQL Request failed");
    console.table(errors);
}


function convertInput(varTypes, variables)
{
    if (!variables)
    {
        return undefined;
    }

    const wireFormat = getWireFormat();

    const out = {};

    for (let name in variables)
    {
        if (variables.hasOwnProperty(name))
        {
            const value = variables[name];
            const varType = varTypes[name];
            if (!varType)
            {
                throw new Error("Cannot convert invalid variable '" + name + "'");
            }

            out[name] = wireFormat.convert(varType, value, false);
        }
    }

    return out;
}


export function formatGraphQLError(params, errors)
{
    return "\nQUERY ERROR:\n" + params.query.query + "\nvariables: " + JSON.stringify(params.variables, null, 4) + "\n\n" +
           errors.map(
               e => (
           e.message +
           ( e.path ? (

           "\nPath: " +
           e.path.join(".")
               ) : "") +
           " " +
           (e.locations ? e.locations.map(
               l =>
           "line " +
           l.line +
           ", " +
           l.column
           ).join(", ") : "") +
           "\n"
               )
           );
}

const postProcessedTypes = new Map();


export function registerGraphQLPostProcessor(type, fn)
{
    const array = postProcessedTypes.get(type);
    if (!array)
    {
        postProcessedTypes.set(type, [ fn ]);
    }
    else
    {
        array.push(fn);
    }
}

export function registerGenericGraphQLPostProcessor(type, fn)
{
    const { genericTypes } = config.inputSchema.meta;

    for (let i = 0; i < genericTypes.length; i++)
    {
        const gt = genericTypes[i];
        if (gt.genericType === type)
        {
            registerGraphQLPostProcessor(gt.type, fn);
        }
    }
}


function postProcess(result, processors, queryDecl, params)
{
    let promises = [];

    for (let i = 0; i < processors.length; i++)
    {
        const { methodName, array } = processors[i];

        let value = result[methodName];
        for (let j = 0; j < array.length; j++)
        {
            const fn = array[j];

            promises.push(
                Promise.resolve(
                    fn(value, queryDecl, params)
                )
                .then(value => {
                    result[methodName] = value;
                })
            )

        }
    }

    return Promise.all(promises).then(
        () => result
    );
}


/**
 * GraphQL query service.
 *
 * Executes the given GraphQL query with the given variables. By default it will automatically perform a wire format
 * conversions. The variables are converted from Javascript format to the current wire format and the result received
 * is being converted from wire format to Javascript.
 *
 * You can pass in a param `autoConvert: false` to disable that behavior.
 *
 * @param {Object} params                   Parameters
 * @param {String} params.query             query string
 * @param {Object} params.variables         query variables
 * @param {Object} params.autoConvert       if false, don't convert input and result ( default is true)
 *
 * @returns {Promise<*,*>} Promise resolving to query data
 */
export default function graphql(params) {

    //console.log("QUERY: ", params);

    const {csrfToken, contextPath} = config;

    let queryDecl;
    if (params.query instanceof GraphQLQuery)
    {
        queryDecl = params.query;
    }
    else
    {
        //console.log("NEW QUERY DECL");

        queryDecl = new GraphQLQuery(params.query);
    }

    const autoConvert = params.autoConvert !== false;

    let {variables} = params;
    if (autoConvert)
    {
        variables = convertInput(queryDecl.getQueryDefinition().vars, variables);
    }

    return (
        fetch(
            window.location.origin + contextPath + "/graphql",
            {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",

                    // spring security enforces every POST request to carry a csrf token as either parameter or header
                    [csrfToken.header]: csrfToken.value
                },
                body: JSON.stringify({
                    query: queryDecl.query,
                    variables
                })
            }
        )
        .then(response => response.json())
        .then(
            ({data, errors}) => {
                if (errors)
                {
                    const err = new Error(
                        formatGraphQLError(params, errors)
                    );

                    return Promise.reject(err);
                }

                // console.log("GQL response", { ... data });

                const processors = [];

                if (autoConvert)
                {
                    const { methods, aliases } = queryDecl.getQueryDefinition();


                    for (let i = 0; i < methods.length; i++)
                    {
                        const methodName = methods[i];
                        const typeRef = getGraphQLMethodType(methodName);
                        const alias = aliases && aliases[methodName];

                        //console.log("AUTO-CONVERT", methodName, "type = ", typeRef);
                        data[methodName] = getWireFormat().convert(
                            typeRef,
                            data[alias ? alias : methodName],
                            true,
                            aliases,
                            methodName
                        );

                        const array = postProcessedTypes.get(typeRef.name);
                        if (array)
                        {
                            processors.push({
                                methodName,
                                array
                            });
                        }
                    }
                }

                const result = observable(data);

                return postProcess(result, processors, queryDecl, params);
            }
        )
    );
}
