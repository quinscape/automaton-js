import { component, and, condition, findComponentNode, Type, isComposedComponentExpression, operation } from "../FilterDSL";
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
) {
    const newComponentNode = wrapConditionIntoComponent(componentCondition, componentId);

    if (compositeCondition == null) {
        return newComponentNode;
    }
    
    const targetNode = findComponentNode(compositeCondition, componentId);

    if (targetNode == null) {
        const newCondition = condition("and");
        newCondition.operands = [ compositeCondition, newComponentNode ];
        return newCondition;
    }

    const result = processComponentCondition(compositeCondition, targetNode, newComponentNode, compareUpdate);
    if (result === UNCHANGED) {
        // we found the component with our id, but it's the exact same component expression, so we just
        // return the original condition instance
        return compositeCondition;
    }

    return updateComponentConditionRecursive(
        compositeCondition,
        newComponentNode,
        componentId,
        compareUpdate
    );
}

function updateComponentConditionRecursive(
    compositeCondition,
    componentCondition,
    componentId = null,
    compareUpdate = true
) {
    
    if (
        compositeCondition.type === Type.FIELD ||
        compositeCondition.type === Type.VALUE ||
        compositeCondition.type === Type.VALUES
    ) {
        return compositeCondition;
    }

    if (compositeCondition.type === Type.COMPONENT) {
        if (compositeCondition.id === componentId) {
            return componentCondition;
        }

        if (compositeCondition.condition == null) {
            return compositeCondition;
        }

        const updatedCondition = updateComponentConditionRecursive(
            compositeCondition.condition,
            componentCondition,
            componentId,
            compareUpdate
        );
        return wrapConditionIntoComponent(updatedCondition, compositeCondition.id);
    }

    const oldOperands = [...compositeCondition.operands];
    const newOperands = [];

    while (oldOperands.length) {
        const existingNode = oldOperands.shift();

        if (existingNode.type === Type.COMPONENT) {
            if (existingNode.id === componentId) {
                newOperands.push(componentCondition);
                break;
            }
        }

        const updatedCondition = updateComponentConditionRecursive(
            existingNode,
            componentCondition,
            componentId,
            compareUpdate
        );
        newOperands.push(updatedCondition);
        
    }
    
    if (compositeCondition.type === Type.OPERATION) {
        const newOperation = operation(compositeCondition.name);
        newOperation.operands = [
            ...newOperands,
            ...oldOperands
        ];
        return newOperation;
    }

    const newCondition = condition(compositeCondition.name);
    newCondition.operands = [
        ...newOperands,
        ...oldOperands
    ];
    return newCondition;

}

function wrapConditionIntoComponent(componentCondition, componentId) {
    if (componentId == null ||
        (
            componentCondition != null &&
            componentCondition.type === Type.COMPONENT &&
            componentCondition.id === componentId
        )
    ) {
        return componentCondition;
    }
    const newComponentNode = component(componentId);
    newComponentNode.condition = componentCondition;
    return newComponentNode;
}
