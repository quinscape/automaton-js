import GraphQLQuery from "./GraphQLQuery";


/**
 * Creates a GraphQL query with the given query string and default variables.
 *
 * This static version can be tracked by babel-plugin-track-usage and is used to
 * declare named queries.
 *
 * @category declarative
 *
 * @param {String} query            query String
 * @param {object} [defaultVars]    default variables
 *
 * @return {GraphQLQuery} a GraphQL query instance
 */
export default function query(query, defaultVars) {

    if (typeof query instanceof GraphQLQuery)
    {
        return query;
    }
    return new GraphQLQuery(query, defaultVars);
}
