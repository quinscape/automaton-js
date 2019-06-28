import parseQuery from "./parseQuery";
import config from "./config";
import graphql from "./graphql";


/**
 * GraphQL query abstraction for both GraphQL queries and mutations.
 *
 * Can be used to parse application queries only once and then .execute() them.
 *
 * The graphql service will always create a new instance of GraphQLQuery on every request otherwise.
 *
 */
export default class GraphQLQuery {

    constructor(query, vars)
    {
        this.query = query;
        this.queryDef = null;
        this.defaultVars = vars;
    }


    /**
     * Lazily parses the query string of this query and returns result.
     *
     * @return {QueryDefinition}
     */
    getQueryDefinition()
    {
        if (!this.queryDef)
        {
            this.queryDef = parseQuery(config.inputSchema, this.query);
        }
        return this.queryDef;
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
        //console.log("GraphQLQuery.execute", this, variables);

        return graphql(
            {
                query: this,
                variables
            }
        );
    }
}
