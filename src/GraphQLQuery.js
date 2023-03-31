import parseQuery from "./parseQuery"
import config from "./config"
import graphql, { convertInput } from "./graphql"
import cloneJSONObject from "./util/cloneJSONObject"
import { DateTime } from "luxon"
import downloadURI from "./util/downloadURI"


/**
 * Partial query config used to disable pagination on exports
 * @type {{pageSize: number}}
 */
export const NO_PAGING = { pageSize : 0}
const contentDispositionRE = /attachment; filename="(.*)"/

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
     * @param {object} [vars]   default variables for the query
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


    /**
     * Queries and exports this GraphQL query with the given exporter.
     * @param {String} exporter     exporter name (must match a serverside bean definition)
     * @param {Object} variables    variables for query
     */
    export(exporter, variables = this.defaultVars)
    {
        const { csrfToken, contextPath } = config

        const convertedVariables = convertInput(this.getQueryDefinition().vars, variables)

        const formData = new FormData()
        formData.append("query", this.query)
        formData.append("variables", JSON.stringify(convertedVariables))
        formData.append("exporter", exporter)
        formData.append(csrfToken.param, csrfToken.value)

        return fetch(
            window.location.origin + contextPath + "/graphql-export",
            {
                method: "POST",
                body: formData
            }
        )
            .then(response => {

                let fileName

                const m = contentDispositionRE.exec(response.headers.get("Content-Disposition") || "")
                if (m)
                {
                    fileName = m[1]
                }
                else
                {
                    fileName = "export-" + DateTime.now().toISO() + ".bin"
                }

                return response.blob().then(
                    blob => {
                        return new Promise((resolve, reject) => {
                            let reader = new FileReader()
                            reader.onload = function () {
                                resolve(this.result)
                            }
                            reader.onerror = function (e) {
                                reject(e)
                            }
                            reader.readAsDataURL(blob)
                        })
                    }
                )
                .then(dataURI => downloadURI(dataURI, fileName))

            })
            .catch(
                e => console.error("Error exporting data", e)
            )

    }
}
