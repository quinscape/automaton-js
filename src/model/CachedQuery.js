import { makeObservable, observable, action } from "mobx";
import InteractiveQuery, { NO_COMPONENT } from "./InteractiveQuery";
import { getWireFormat } from "../domain";
import { evaluateMemoryQuery } from "../util/evaluateMemoryQuery";

/**
 * Helper class to handle interactive query updates based on a in-memory iQuery document containing all (cached) results.
 *
 * The instance will behave just like an InteractiveQuery instance and can be used as replacement for the iQuery based
 * widgets with full filtering / sorting / pagination support.
 */
export default class CachedQuery
{
    /** Current result rows of the base type*/
    @observable rows;

    /**
     * Query config object used to create this query
     */
    @observable queryConfig;

    /**
     * Array of column states for this query
     */
    @observable columnStates;

    /**
     * Total number of rows available for pagination
     *
     * @type {number}
     */
    @observable rowCount = 0;


    /**
     * Creates a new CachedQuery
     * @param {InteractiveQuery} source     source iQuery document containing all rows
     * @param {Object} queryConfig          queryConfig override. Note that you will want to override "pageSize" in most cases
     *                                      since the source query will have disabled paging to get all results.
     */
    constructor(source, queryConfig, fn)
    {
        this.rows = [];
        this.queryConfig = {
            ... source.queryConfig,
            ... queryConfig
        };

        this.columnStates = source.columnStates;
        this.type = source.type;
        this.rowCount = source.rowCount;

        this._type = source._type;

        this._query = CachedQuery.createMemoryQuery(source, this.queryConfig, fn);

        // apply default config 
        this.update(this.queryConfig)

        makeObservable(this)

        //console.log("Created CachedQuery", toJS(this), "source = ", source,  "queryConfig = ", queryConfig);
    }

    /**
     * Set the new queryConfig without mobx printing warnings.
     * 
     * This is supposed to be only called from the inside.
     * 
     * @param {Object} config the new query configuration
     */
    @action
    setQueryConfig(config) {
        this.queryConfig = config;
    }

    update(
        queryConfig
    )
    {
        return InteractiveQuery.prototype.update.call(this, queryConfig);
    }

    /**
     * Updates a component condition in the current query config state.
     *
     * If no component node is found, the current condition if present will be ANDed with the component condition
     *
     * @param {Object} componentCondition   condition node
     * @param {String} [componentId]        component id if none is given NO_COMPONENT (null) will be used
     * @param {Boolean} [checkConditions]     check component condition before updating, don't update if identical
     * @return {Promise<* | never>}
     */
    updateCondition(
        componentCondition,
        componentId = NO_COMPONENT,
        checkConditions = true
    )
    {
        return InteractiveQuery.prototype.updateCondition.call(this, componentCondition, componentId, checkConditions);
    }


    /**
     * Creates a in-memory query from the given source iQuery.
     *
     * @param source            InteractiveQuery instance containing all rows
     * @param queryConfig       overriding query config
     * @param {function} [fn]   optional function callback called after every mocked request ( result => ... }
     * 
     * @return {GraphQLQuery} mocked graphql query
     */
    static createMemoryQuery(source, queryConfig, fn)
    {

        const query = source._query.clone();

        const mergedConfig = {
            offset: 0,
            ... query.defaultVars.config,
            ... queryConfig
        };

        query.execute = vars => {
            const queryDef = query.getQueryDefinition();
            const aliases = queryDef.aliases;
            const name = queryDef.methodCalls[0];
            const gqlMethodName = aliases ? aliases[name] || name : name;

            const result = evaluateMemoryQuery(
                getWireFormat(),
                source,
                {
                    ... mergedConfig,
                    ... vars.config
                }
            );

            // XXX: needed in tests
            result._query = query;
            
            if (typeof fn === "function")
            {
                fn(result);
            }

            return Promise.resolve(
                {
                    [gqlMethodName] :  result
                }
            )
        }

        query.defaultVars = mergedConfig;

        return query;
    }


    /**
     * Loads a memory query from a raw JSON iquery document. Mostly useful for tests
     *
     * @param {String} type             InteractiveQuery type
     * @param {object} raw              raw, unconverted iQuery JSON data (must have _type field)
     * @param {GraphQLQuery} query      formal query instance to register for the memory query
     * @param queryConfig               queryConfig override for the memory query
     *
     * @param {function} [fn]   optional callback called after every mocked request
     *
     * @return {GraphQLQuery} mocked graphql query
     */
    static loadMemoryQuery(type, raw, query, queryConfig, fn)
    {
        const source = this.convertIQuery(type, raw, query);        
        return this.createMemoryQuery(source, queryConfig, fn);
    }


    /**
     * Convert raw iquery data to an Interactive Query instance.
     *
     * @param {String} type             name of the degenerified InteractiveQuery container (e.g. "InteractiveQueryFoo")
     * @param {object} raw              raw JSON data like it comes from the GraphQL server matching the type
     * @param {GraphQLQuery} query      query instance to register as _query for the converted document.
     *                                  Will be used by widgets to requery it.
     *
     * @return {InteractiveQuery} iQuery document instance containing correctly converted scalar values
     */
    static convertIQuery(type, raw, query)
    {
        const source = getWireFormat().fromWire(type, raw);
        source._query = query;
        return source;
    }
}


