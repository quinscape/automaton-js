import { action, makeObservable, observable, toJS } from "mobx"
import { isConditionObject } from "../FilterDSL";
import updateComponentCondition from "../util/updateComponentCondition";
import { getGraphQLMethodType } from "../util/type-utils"
import GraphQLQuery from "../GraphQLQuery"


export const NO_COMPONENT = null;


/**
 * Returns the first value from an object.
 *
 * @category iquery
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
    iQuery.columnStates.replace(value.columnStates);
    iQuery.rowCount = value.rowCount;

    return true;
});

function indent(buf, level)
{
    for (let i = 0; i < level; i++)
    {
        buf.push("    ")
    }
}

function renderSelections(buf, sel, level)
{
    for (let name in sel)
    {
        if (sel.hasOwnProperty(name))
        {
            const v = sel[name]
            if (v === true)
            {
                indent(buf, level)
                buf.push(name, "\n")
            }
            else
            {
                indent(buf, level)
                buf.push(name, "{\n")
                renderSelections(buf, v, level + 1)
                indent(buf, level)
                buf.push("}\n")
            }
        }
    }

    return buf
}


let partialCount = 0;


/**
 * Client-side implementation of the InteractiveQuery mechanism. Meant to be registered for all concrete types created
 * for de.quinscape.automaton.model.data.InteractiveQuery
 *
 * @category iquery
 */
export default class InteractiveQuery {

    constructor()
    {
        makeObservable(this)
    }

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
        let vars;
        if (queryConfig)
        {
            vars = {
                config: {
                    ... this.queryConfig,
                    ... queryConfig
                }
            };

            // safety-check for optional conditions without and() / or() or not()
            // if we receive a condition that is not an object, we substitute null
            if (!isConditionObject(vars.config.condition))
            {
                vars.config.condition = null;
            }

            this.setQueryConfig(vars.config);
        }
        else
        {
            vars = {
                config: this.queryConfig
            };
        }

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


    /**
     * Extracts a new independent iQuery object with a new Query containing only the selections for that iQuery.
     *
     * @param {Object} result   multi iQuery result object
     * @param {String} varName  variable name of this query in the original query
     */
    static separate(result, varName)
    {
        const iQuery = result[varName];
        const query = result[varName]._query;
        const queryDef = query.getQueryDefinition()

        const { methodCalls, aliases, selections } = queryDef
        //console.log({ methodCalls, aliases, selections })

        let gqlMethodName = null;
        for (let i = 0; i < methodCalls.length; i++)
        {
            const name = methodCalls[i];
            if (name === varName)
            {
                gqlMethodName = aliases ? aliases[name] || name : name;
                break;
            }
        }

        const buf = [];
        const sel = renderSelections(buf, selections[varName], 6).join("");

        if (!gqlMethodName)
        {
            throw new Error("Could not find method name for " + varName)
        }

        iQuery._query = new GraphQLQuery(
            // language=GraphQL
            `query ${gqlMethodName + "_p" + (++partialCount)}($config: QueryConfigInput!)
            {
                ${gqlMethodName}(config: $config)
                {
                    type
                    columnStates{
                        name
                        enabled
                        sortable
                    }
                    queryConfig{
                        id
                        condition
                        offset
                        pageSize
                        sortFields
                    }
                    rows{
${ buf.join("")}
                    }
                    rowCount
                }
            }`,
            {
            config: toJS(iQuery.queryConfig)
        })

        //console.log("QUERY", iQuery._query)

        return iQuery
    }
}
