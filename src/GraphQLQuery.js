import parseQuery from "./parseQuery"
import config from "./config"
import graphql from "./graphql"
import cloneJSONObject from "./util/cloneJSONObject"


/**
 * GraphQL query abstraction for both GraphQL queries and mutations.
 *
 * Can be used to parse application queries only once and then .execute() them.
 *
 * The graphql service will always create a new instance of GraphQLQuery on every request otherwise.
 *
 */
export default class GraphQLQuery {

    /**
     * Create a new GraphQLQuery instance
     *
     * @param {String} query    query string
     * @param {object} vars     default variables for the query
     */
    constructor(query, vars)
    {
        this.query = query
        this.queryDef = null
        this.defaultVars = vars
        this.vars = vars
    }


    /**
     * Lazily parses the query string of this query and returns result.
     *
     * @return {QueryDefinition}
     */
    getQueryDefinition()
    {
        if (!this.query) {
            return null;
        }
        if (!this.queryDef)
        {
            this.queryDef = parseQuery(config.inputSchema, this.query)
        }
        return this.queryDef
    }


    /**
     * Executes this GraphQL query/mutation with the given variables
     *
     * @param {object} [variables]    variables object map
     *
     * @return {Promise<*,*>}   Resolves with query/mutation result or rejects with a GraphQL error.
     */
    execute(variables)
    {
        //console.log("GraphQLQuery.execute", this, JSON.stringify(variables, null, 4));

        this.vars = variables;

        return graphql(
            {
                query: this,
                variables
            }
        )
    }


    /**
     * Clone this query object.
     *
     * @return {GraphQLQuery} new graphql query
     */
    clone()
    {
        const c = new GraphQLQuery(this.query, cloneJSONObject(this.defaultVars))
        c.queryDef = this.queryDef
        return c
    }
}
