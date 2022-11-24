import React, { useEffect, useMemo } from "react"
import { comparer, observable, reaction, toJS } from "mobx"
import {
    and,
    condition,
    field,
    findComponentNode,
    getConditionArgCount,
    isLogicalCondition,
    Type,
    value
} from "../../FilterDSL";
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


export function extractValueNodes(node, valueNodes = [])
{
    if (node == null)
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
    const valueNodes = extractValueNodes(columnCondition);

    const numNodes = valueNodes.length;

    const numValues = getConditionArgCount(filter);
    const list = new Array(numValues);
    for (let i=0; i < numValues; i++)
    {
        const valueNode = numNodes >= numValues ? valueNodes[numNodes - numValues + i] : null;

        list[i] = {
            type: valueNode ? valueNode.scalarType : column.type,
            label: i === 0 ? i18n("Filter:" + column.name) : null,
            value: valueNode ? valueNode.value : null
        };
    }

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

let stateCounter = 0;

/**
 * IQueryGrid Internal Filter context
 */
export const FilterContext = React.createContext(null);

function findFieldRef(state, condition, name)
{
    if (state.disqualified)
    {
        return state;
    }
    
    const { type } = condition;
    if (type === Type.CONDITION || type === Type.OPERATION)
    {
        const {operands} = condition;
        for (let i = 0; i < operands.length; i++)
        {
            findFieldRef(state, operands[i], name);
        }

        return state;
    }
    else if (type === Type.FIELD)
    {
        if (!state.name && !state.disqualified && condition.name === name)
        {
            state.name = name;
        }
        else if (state.name !== condition.name)
        {
            state.name = null;
            state.disqualified = true;
        }
        
        return state;
    }
    return state;
}


function findColumnCondition(componentId = null, name, currentCondition)
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

    if (isLogicalCondition(cond))
    {
        const { operands } = cond;

        for (let i = 0; i < operands.length; i++)
        {
            const candidate = operands[i];

            const result = findFieldRef(
                {
                    name: null,
                    disqualified: false,
                    id: stateCounter++
                },
                candidate,
                name
            );

            if (result.name && !result.disqualified)
            {
                return candidate;
            }
        }
    }
    else
    {
        const result = findFieldRef(
            {
                name: null,
                disqualified: false,
                id: stateCounter++
            },
            cond,
            name
        );
        if (result.name && !result.disqualified)
        {
            return cond;
        }

    }
    
    return null;
}


export function invokeForTemplate(fieldName, filter)
{
    const { length } = filter;

    const args = new Array(length - 1);
    for(let i = 0; i < length - 1; i++)
    {
        args[i] = null;
    }

    return  filter.call(null, fieldName, ...args);
}


function findConditionByTemplate(componentId = null, template, currentCondition)
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


    if (isLogicalCondition(cond))
    {
        const { operands } = cond;

        for (let i = 0; i < operands.length; i++)
        {
            const candidate = operands[i];
            if (compareConditions(template, candidate))
            {
                return candidate;
            }
        }
    }
    else
    {
        if (compareConditions(template, cond))
        {
            return cond;
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
        const { name, filter, filterIndex, getValue } = column;
        if (filter)
        {
            if (typeof filter === "function")
            {
                const template = invokeForTemplate(name, filter);

                const columnCondition = findConditionByTemplate(
                    componentId,
                    template,
                    currentCondition
                );

                const values = typeof getValue === "function" ?
                    getValue(
                        column,
                        columnCondition || template
                    ) :
                    createValues(
                        filter,
                        column,
                        columnCondition || template
                    );

                filters[filterIndex] = {
                    filter,
                    values,
                    columnIndex: i
                };

            }
            else
            {
                const columnCondition = findColumnCondition(
                    componentId,
                    column.name,
                    currentCondition
                );

                const values = createValues(
                    filter,
                    column,
                    columnCondition
                );
                
                filters[filterIndex] = {
                    filter,
                    values,
                    columnIndex: i
                };
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
                const { filters } = filterState;
                const { length } = filters;

                const conditions = [];
                for (let i = 0; i < length; i++)
                {
                    if (filters[i] == null) {
                        continue;
                    }
                    const { filter, values, columnIndex } = filters[i];

                    if (allValuesSet(values))
                    {
                        let cond;
                        const fieldName = columns[columnIndex].name;
                        if (typeof filter === "function")
                        {
                            cond = filter(fieldName, ... values.map(v => v.value))
                        }
                        else
                        {
                            cond = condition(filter);
                            cond.operands = [
                                field(fieldName),
                                ... values.map( v => value(toJS(v.value), v.type))
                            ];

                        }
                        if (cond != null) {
                            conditions.push(cond);
                        }
                    }
                }

                if (conditions.length === 0)
                {
                    return null;
                }

                const cond = condition("and");
                cond.operands = conditions;

                return cond;
            },
            cond => {
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
                
                return filters;
            },
            filters => {
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
                layout: FormLayout.INLINE,
                isolation: false
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
