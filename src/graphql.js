import config from "./config"
import { getWireFormat } from "./domain";
import GraphQLQuery from "./GraphQLQuery";
import { getGraphQLMethodType } from "./Process";


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
        return;
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


export function formatGraphQLError(query, errors)
{
    return "\n" + query + "\n\n" +
           errors.map(
               e => (
           e.message +
           "\nPath: " +
           e.path.join(".") +
           " " +
           ( e.locations ? e.locations.map(
               l =>
           "line " +
           l.line +
           ", " +
           l.column
           ).join(", ") : "")+
           "\n"
               )
           );
}


/**
 * GraphQL query service
 *
 * @param {Object} params                   Parameters
 * @param {String} params.query             query string
 * @param {Object} [params.variables]       query variables
 * @param {Object} [params.autoConvert]     if false, don't convert input ( default is true)
 *
 * @returns {Promise<any>} Promise resolving to query data
 */
export default function graphql(params) {

    //console.log("QUERY: ", params);

    const { csrfToken, contextPath } = config;

    let queryDecl;
    if (params.query instanceof GraphQLQuery)
    {
        queryDecl = params.query;
    }
    else
    {
        console.log("NEW QUERY DECL");

        queryDecl = new GraphQLQuery(params.query);
    }

    const autoConvert  = params.autoConvert !== false;

    let { variables } = params;
    if (autoConvert)
    {
        variables = convertInput(queryDecl.getVars(), variables);
    }

    return fetch(
            window.location.origin + contextPath + "/graphql",
            {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",

                    // spring security enforces every POST request to carry a csrf token as either parameter or header
                    [csrfToken.header] : csrfToken.value
                },
                body: JSON.stringify({
                    query: queryDecl.query,
                    variables
                })
            }
        )
        .then(response => response.json())
        .then(
            ({ data, errors}) => {
                if (errors)
                {
                    const err = new Error(
                        formatGraphQLError(queryDecl.query, errors)
                    );

                    return  Promise.reject(err);
                }

                if (autoConvert)
                {
                    for (let methodName in data)
                    {
                        if (data.hasOwnProperty(methodName))
                        {
                            const typeRef = getGraphQLMethodType(methodName);

                            //console.log("AUTO-CONVERT", methodName, "type = ", typeRef);

                            data[methodName] = getWireFormat().convert(typeRef, data[methodName], true);

                            //console.log("converted", data[methodName]);
                        }
                    }
                }

                return data;
            }
        );
}
