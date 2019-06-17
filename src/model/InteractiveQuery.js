import { action, observable } from "mobx";
import { component, condition, isLogicalCondition, Type } from "../FilterDSL";
import compareConditions from "../util/compareConditions"

function getFirstValue(m)
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
    Object.assign(iQuery.columnConfig, value.columnConfig);
    iQuery.rowCount = value.rowCount;

    return true;
});


const NO_COMPONENT = null;


/**
 * Simplifies conditions of the form `and(component("example", null), ...)` to simply null
 * @param cond
 * @return {Object|null} condition
 */
function simplifyCondition(cond)
{
    if (cond && cond.type === Type.CONDITION && cond.name === "and")
    {
        const { operands } = cond;
        for (let i = 0; i < operands.length; i++)
        {
            const operand = operands[i];
            if (operand.type !== Type.COMPONENT || operand.id !== null)
            {
                return cond;
            }
        }

        // is and with null component nodes
        return null;
    }
    return cond;
}


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
     * Column config object used to create this query
     */
    @observable columnConfig;

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
     * iQuery.update({currentPage: 1})
     *
     * // sorty by name descending
     * iQuery.update({
     *     sortOrder:
     *         {
     *             fields: [ "!name" ]
     *         }
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
     * @param {Object} componentCondition       condition node
     * @param {String} [componentId]            component id if none is given NO_COMPONENT (null) will be used
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

        const newComponentNode = component(componentId);
        newComponentNode.condition = componentCondition;

        let newCondition;
        if (currentCondition === null)
        {
            newCondition = condition("and");
            newCondition.operands = [ newComponentNode ];
        }
        else
        {
            if (!isLogicalCondition(currentCondition))
            {
                throw new Error(
                    "Invalid current condition in queryConfig, " +
                    "root node must be a logical condition combining component conditions: " +
                    JSON.stringify(currentCondition, null, 4)
                );
            }

            const componentConditions = [];

            const {operands} = currentCondition;

            let found = false;
            for (let i = 0; i < operands.length; i++)
            {
                const componentNode = operands[i];

                if (componentNode.type !== Type.COMPONENT)
                {
                    throw new Error(
                        "Invalid component condition structure: " +
                        JSON.stringify(currentCondition, null, 4)
                    );
                }

                // is it the id we're updating?
                if (componentNode.id === componentId)
                {
                    if (
                        checkConditions &&
                        compareConditions(
                            simplifyCondition(
                                componentNode.condition,
                            ),
                            simplifyCondition(
                                newComponentNode.condition
                            ),
                            true
                        )
                    )
                    {
                        //console.log("SKIP UPDATE");

                        // component condition is actually the exact same as it was before, don't update
                        return Promise.resolve(true);
                    }

                    componentConditions.push(
                        newComponentNode
                    );

                    found = true;
                }
                else
                {
                    componentConditions.push(
                        componentNode
                    );
                }
            }

            if (!found)
            {
                componentConditions.push(
                    newComponentNode
                )
            }

            newCondition = condition(currentCondition.name);
            newCondition.operands = componentConditions;
        }

        return this.update({
            condition: newCondition,
            currentPage: 0
        })
    }
}
