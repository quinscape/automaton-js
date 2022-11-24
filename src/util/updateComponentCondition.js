import { component, and, condition, isLogicalCondition, Type, isComposedComponentExpression } from "../FilterDSL";
import compareConditions from "./compareConditions";


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

const UNCHANGED = "UNCHANGED";
const CHANGED = "CHANGED";
const NO_MATCH = "NO_MATCH";

function processComponentCondition(compositeCondition, componentNode, newComponentNode, compareUpdate)
{
    if (componentNode.type !== Type.COMPONENT)
    {
        throw new Error(
            "Invalid component condition structure: " +
            JSON.stringify(compositeCondition, null, 4)
        );
    }

    // is it the id we're updating?
    if (componentNode.id === newComponentNode.id)
    {
        if (
            compareUpdate &&
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

            // component condition is actually the exact same as it was before, return the original object
            return UNCHANGED;
        }
        return CHANGED;
    }
    return NO_MATCH;
}


/**
 * Updates a logical condition composed of component conditions with a new condition for one of the components.
 *
 * @category iquery
 *
 * @param {Object} compositeCondition   logical condition composed of component conditions.
 * @param {Object} componentCondition   new component condition
 * @param {String} [componentId]        optional component id to update
 * @param {Boolean} [compareUpdate]     if true, check the component update for equality with the existing condition and
 *                                      return the exact same composite condition if nothing changed.
 * @returns {Object} merged condition (might be the exact same composite condition object if compareUpdate is true)
 */
export default function updateComponentCondition(
    compositeCondition,
    componentCondition,
    componentId = null,
    compareUpdate = true
)
{
    const newComponentNode = component(componentId);
    newComponentNode.condition = componentCondition;

    let newCondition;
    if (compositeCondition == null)
    {
        newCondition = componentId ? newComponentNode : componentCondition;
    }
    else
    {
        if (compositeCondition.type === Type.COMPONENT)
        {
            const result = processComponentCondition(compositeCondition, compositeCondition, newComponentNode, compareUpdate);

            if (result === UNCHANGED)
            {
                // we found the component with our id, but it's the exact same component expression, so we just
                // return the original condition instance
                return compositeCondition;
            }
            else if (result === CHANGED)
            {
                // the id matched and the condition actually changed
                return newComponentNode;
            }
            else
            {
                // id did not match, we join both conditions to a new composite condition
                newCondition = condition("and");
                newCondition.operands = [ compositeCondition, newComponentNode ];

                return newCondition;
            }

        }
        else
        {
            const isComplexComponentLogical = isComposedComponentExpression(compositeCondition);

            if (!isComplexComponentLogical)
            {
                if (!componentId)
                {
                    return componentCondition;
                }
                else
                {
                    return and(
                        component(null, compositeCondition),
                        newComponentNode
                    );
                }

            }

        }
        const componentConditions = [];

        const {operands} = compositeCondition;

        let found = false;
        for (let i = 0; i < operands.length; i++)
        {
            const existingNode = operands[i];

            const result = processComponentCondition(compositeCondition, existingNode, newComponentNode, compareUpdate);

            if (result === UNCHANGED)
            {
                // we found the component with our id, but it's the exact same component expression, so we just
                // return the original condition instance
                return compositeCondition;
            }
            else if (result === CHANGED)
            {
                componentConditions.push(
                    newComponentNode
                );
                found = true;
            }
            else
            {
                componentConditions.push(
                    existingNode
                );
            }
        }

        if (!found)
        {
            componentConditions.push(
                newComponentNode
            );
        }
        
        newCondition = condition(compositeCondition.name);
        newCondition.operands = componentConditions;
    }

    return newCondition;
}
