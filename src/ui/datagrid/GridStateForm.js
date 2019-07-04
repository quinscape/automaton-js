import React, { useEffect, useMemo } from "react"
import { comparer, observable, reaction, toJS } from "mobx"
import { and, condition, field, findComponentNode, getConditionArgCount, Type, value } from "../../FilterDSL";
import i18n from "../../i18n";
import { Form, FormLayout } from "domainql-form"
import compareConditions from "../../util/compareConditions";


/**
 * FormValueEntry
 *
 * @typedef FormValueEntry
 * @type {object}
 * @property {String} type      scalar type
 * @property {String} label     label for input
 * @property {Object} value     current value
 */


function extractValueNodes(node, valueNodes = [])
{
    if (node === null)
    {
        return valueNodes;
    }

    const {type} = node;

    if (type === Type.VALUE)
    {
        valueNodes.push(node);
    }
    else if (type === Type.COMPONENT)
    {
        extractValueNodes(node.condition, valueNodes);
    }
    else if (type === Type.CONDITION || type === Type.OPERATION)
    {
        const {operands} = node;

        for (let i = 0; i < operands.length; i++)
        {
            extractValueNodes(operands[i], valueNodes);
        }
    }

    return valueNodes;
}


/**
 * Creates form value entries for a given column condition
 *
 * @param {String|function} filter      filter name or filter function
 * @param {Object} column               IQueryGrid column
 * @param columnCondition               condition map for the column
 * @return {Array<FormValueEntry>} 
 */
function createValues(filter, column, columnCondition)
{
    //console.log("createValues", {name, column, columnCondition});

    const valueNodes = extractValueNodes(columnCondition);

    //console.log("VALUE NODES", toJS(columnCondition), JSON.stringify(valueNodes, null, 4));

    const numValues = getConditionArgCount(filter);
    const list = new Array(numValues);
    for (let i=0; i < numValues; i++)
    {
        const valueNode = valueNodes[i];

        list[i] = {
            type: valueNode ? valueNode.scalarType : column.type,
            label: i === 0 ? i18n("Filter:" + name) : null,
            value: valueNode ? valueNode.value : null
        };
    }

    //console.log("VALUES = " , list);

    return list;
}


function allValuesSet(values)
{
    for (let i = 0; i < values.length; i++)
    {
        if (values[i].value === null)
        {
            return false;
        }

    }
    return true;
}


/**
 * IQueryGrid Internal Filter context
 */
export const FilterContext = React.createContext(null);

function findColumnCondition(componentId, name, currentCondition)
{
    if (currentCondition === null)
    {
        return null;
    }

    const componentNode = findComponentNode(currentCondition, componentId);
    if (!componentNode)
    {
        return null;
    }

    const { condition : cond } = componentNode;

    if (cond === null)
    {
        return null;
    }

    const { operands } = cond;

    for (let i = 0; i < operands.length; i++)
    {
        const candidate = operands[i];

        const { operands : fieldOrValues } = candidate;

        for (let j = 0; j < fieldOrValues.length; j++)
        {
            const fieldOrValue = fieldOrValues[j];
            if (fieldOrValue.type === Type.FIELD && fieldOrValue.name === name)
            {
                return candidate;
            }
        }
    }
    return null;
}


export function invokeForTemplate(filter)
{
    const { length } = filter;

    const args = new Array(length);
    for(let i = 0; i < length; i++)
    {
        args[i] = null;
    }

    return  filter.apply(null, args);
}


function findConditionByTemplate(componentId, template, currentCondition)
{
    if (currentCondition === null)
    {
        return null;
    }

    const componentNode = findComponentNode(currentCondition, componentId);
    if (!componentNode)
    {
        return null;
    }

    const { condition : cond } = componentNode;

    if (cond === null)
    {
        return null;
    }

    // cond assumed to be an and() condition
    

    const { operands } = cond;

    for (let i = 0; i < operands.length; i++)
    {
        const candidate = operands[i];

        if (compareConditions(template, candidate))
        {
            return candidate;
        }
    }
    return null;
}


function resolveFilters(columns, componentId, currentCondition)
{
    const filters = [];

    for (let i = 0; i < columns.length; i++)
    {
        const column = columns[i];
        const { filter } = column;
        if (filter)
        {
            if (typeof filter === "function")
            {
                const template = invokeForTemplate(filter);

                const columnCondition = findConditionByTemplate(
                    componentId,
                    template,
                    currentCondition
                );
                
                filters.push(
                    {
                        filter,
                        values: createValues(
                            filter,
                            column,
                            columnCondition || template
                        ),
                        columnIndex: i
                    }
                )

            }
            else
            {
                filters.push(
                    {
                        filter,
                        values: createValues(
                            filter,
                            column,
                            findColumnCondition(
                                componentId,
                                column.name,
                                currentCondition
                            )
                        ),
                        columnIndex: i
                    }
                )
            }


        }
    }
    return filters;
}

/**
 * Wrapper for filtered datagrids. Renders a form element around the whole table
 *
 * @param props
 * @return {boolean|*}
 * @constructor
 */
const GridStateForm = props => {

    const { iQuery, columns, componentId, filterTimeout, children } = props;

    //console.log("Render FilterRow", { iQuery, columns });

    const filterState = useMemo(
        () =>
            observable({
                filters: resolveFilters(
                    columns,
                    componentId,
                    iQuery.queryConfig.condition
                )
            }),
        [columns, componentId]
    );



    //
    // Run debounced update for iQuery, syncing it to filter state
    //
    useEffect(
        () => reaction(
            () => {

                //console.log("UPDATE FILTER EXPRESSION");

                const { filters } = filterState;
                const { length } = filters;

                const conditions = [];
                for (let i = 0; i < length; i++)
                {
                    const { filter, values, columnIndex } = filters[i];

                    //console.log("FILTER", { name, type, values, columnIndex })

                    if (allValuesSet(values))
                    {
                        let cond;
                        if (typeof filter === "function")
                        {
                            cond = filter(... values.map(v => v.value))
                        }
                        else
                        {
                            cond = condition(filter);
                            cond.operands = [
                                field(
                                    columns[columnIndex].name
                                ),
                                ... values.map( v => value(v.type, toJS(v.value)))
                            ];

                        }
                        conditions.push(cond);
                    }
                }

                if (conditions.length === 0)
                {
                    return null;
                }

                const cond = condition("and");
                cond.operands = conditions;

                //console.log("RUN EXPRESSION", JSON.stringify(cond, null, 4));

                return cond;

            },
            cond => {

                //console.log("UPDATE FILTER EFFECT");

                return iQuery.updateCondition(
                    cond,
                    componentId,
                    true
                );
            }
            ,{
                name: "Update on filter-change",
                delay: filterTimeout,
                equals: comparer.structural
            }
        ),
        [filterTimeout]
    );

    //
    // Synchronize external iQuery updates to inputs
    //
    useEffect(
        () => reaction(
            () => {

                const filters = resolveFilters(
                    columns,
                    componentId,
                    iQuery.queryConfig.condition
                );

                //console.log("SYNC FILTER EXPRESSION", filters);

                return filters;
            },
            filters => {

                //console.log("SYNC FILTER EFFECT", filters);

                filterState.filters.replace(filters);
            }
            ,{
                name: "Sync filter",
                equals: comparer.structural
            }
        ),
        []
    );

    return (
        <Form
            value={ filterState }
            options={{
                layout: FormLayout.INLINE
            }}
        >
            <FilterContext.Provider value={ filterState }>
            {
                children
            }
            </FilterContext.Provider>
        </Form>
   );
}

export default GridStateForm
