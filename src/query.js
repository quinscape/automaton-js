import GraphQLQuery from "./GraphQLQuery";


/**
 * Creates a GraphQL query with the given query string and default variables.
 *
 * This static version can be tracked by babel-plugin-track-usage and is used to
 * declare named queries. 
 */
export default function query(query, defaultVars) {

    if (typeof query instanceof GraphQLQuery)
    {
        return query;
    }
    return new GraphQLQuery(query, defaultVars);
}
