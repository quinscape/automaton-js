import { Type } from "../FilterDSL";


/**
 * Returns a string description of the given filter condition.
 *
 * @param {*} condition    JSON condition graph
 * 
 * @return {string} description
 */
export default function describeFilter(condition)
{
    if (!condition)
    {
        return "---";
    }

    const { type, name } = condition;

    if (type === Type.FIELD)
    {
        return "field(" + name + ")";
    }
    else if (type === Type.CONDITION || type === Type.OPERATION)
    {
        const { operands } = condition;
        return name+ "(" + operands.map( o => describeFilter(o)).join(",") + ")";
    }
    else if (type === Type.VALUE)
    {
        const { value, scalarType } = condition;
        return "value(" +  value + ":" + scalarType +")";

    }
    else if (type === Type.VALUES)
    {
        const { values, scalarType } = condition;
        return "value(" +  values + ":" + scalarType +")";

    }
    else if (type === Type.COMPONENT)
    {
        const { id, component } = condition;
        return "component(" + id + ":" + describeFilter(component) + ")";
    }
    else
    {
        throw new Error("Unhandled type: " + type);
    }
}
