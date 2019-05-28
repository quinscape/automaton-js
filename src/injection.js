import GraphQLQuery from "./GraphQLQuery";


/**
 * Declares a GraphQL injection that will be automatically provided to the process scope on process initialization.
 *
 * The returned value is a query declaration object that is used to resolve the data from the initial process data
 * provided by the server.
 *
 * The server in turn uses JSON data generated by NPM module "babel-plugin-track-usage" to automatically determine
 * the injection queries.
 *
 * The GraphQL query value will be stripped of its first level. There can be only one query or mutation per injection.
 * This has no performance implications since all initial process queries are running at once on the server side anyway.
 *
 * @param query             query string
 * @param defaultVars       Formal variable parameter. Not really used on the client side per se. Only needed to be detected
 *                          by NPM module "babel-plugin-track-usage"
 *
 * @returns {GraphQLQuery} query declaration
 */
export default function injection(query, defaultVars) {
    return new GraphQLQuery(query);
}
