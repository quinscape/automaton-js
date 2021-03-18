import { observable, toJS } from "mobx";
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
    constructor(source, queryConfig)
    {
        this.rows = source.rows;
        this.queryConfig = {
            ... source.queryConfig,
            ... queryConfig
        };

        this.columnStates = source.columnStates;
        this.type = source.type;
        this.rowCount = source.rowCount;

        this._type = source._type;

        this._query = source._query.clone();

        this._query.execute = vars => {

            //console.log("CachedQuery execute", vars);

            const gqlMethodName = this._query.getQueryDefinition().methods[0];

            return Promise.resolve(
                {
                    [gqlMethodName] :  evaluateMemoryQuery(
                        getWireFormat(),
                        source,
                        {
                            ... this.queryConfig,
                            ... vars.config
                        },
                        this
                    )
                }
            )
        }

        // apply default config 
        this.update(this.queryConfig)

        //console.log("Created CachedQuery", toJS(this), "source = ", source,  "queryConfig = ", queryConfig);
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
}
    
