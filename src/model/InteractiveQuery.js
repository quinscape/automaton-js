import { action, observable } from "mobx";
import { component, condition, isLogicalCondition, Type } from "../FilterDSL";
import compareConditions from "../util/compareConditions"
import updateComponentCondition from "../util/updateComponentCondition";

const NO_COMPONENT = null;


/**
 * Returns the first value from an object.
 * 
 * @param {object} m    js object
 *
 * @returns {*}
 */
export function getFirstValue(m)
{
    for (let key in m)
    {
        if (m.hasOwnProperty(key))
        {
            return m[key];
        }
    }
    return null;
}

const updateFromResult = action("Update iQuery from Result", (iQuery, result) => {
    const value = getFirstValue(result);

    //console.log("updateFromResult: queryConfig =", JSON.stringify(value.queryConfig));

    iQuery.rows.replace(value.rows);
    Object.assign(iQuery.queryConfig, value.queryConfig);
    iQuery.columnStates.replace(value.columnStates);
    iQuery.rowCount = value.rowCount;

    return true;
});




/**
 * Client-side implementation of the InteractiveQuery mechanism. Meant to be registered for all concrete types created
 * for de.quinscape.automaton.model.data.InteractiveQuery
 */
export default class InteractiveQuery {

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
     * Updates the current iQuery base on a new query config. The given query config is merged with the current config
     * so you only need to define the changes.
     *
     * Examples:
     *
     * ```js
     * // page to second page
     * iQuery.update({offset: 10})
     *
     * // sorty by name descending
     * iQuery.update({
     *     sortFields: [ "!name" ]
     * })
     * ```
     *
     * @param {Object} queryConfig      query config structure (see de.quinscape.automaton.model.data.QueryConfig)
     * @return {Promise<* | never>}
     */
    update(
        queryConfig
    )
    {
        const vars = {
            config: queryConfig ? {
                ...this.queryConfig,
                ...queryConfig
            } : this.queryConfig
        };

        //console.log("InteractiveQuery.update", JSON.stringify(vars));

        return this._query.execute(vars)
            .then(
                result => updateFromResult(this, result)
            );
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
        let {condition: currentCondition} = this.queryConfig;

        const newCondition = updateComponentCondition(
            currentCondition,
            componentCondition,
            componentId,
            checkConditions
        );

        if (newCondition === currentCondition)
        {
            return Promise.resolve(true);
        }

        return this.update({
            condition: newCondition,
            offset: 0
        })
    }


}
