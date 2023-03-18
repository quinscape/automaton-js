import { COMPUTED_VALUE_TYPE, Type } from "../FilterDSL"
import config from "../config";

function convert(value, scalarType)
{
    if (scalarType === "Timestamp" || scalarType === "Date")
    {
        return "DateTime.fromISO(" + JSON.stringify(value)+ ")"
    }

    return JSON.stringify(value)
}

function indent(level)
{
    let s = ""
    if (level <= 0)
    {
        return s
    }
    for (let i = 0; i < level; i++)
    {
        s += "    "
    }
    return s;
}

const topLevelConditions = {
    or: true,
    and: true,
    not: true
}

const simplifiedValues = {
    "Boolean": true,
    "String": true,
    "Int": true,
    "Timestamp": true
}

export default function decompileFilter(condition, level = 0, invert = true)
{
    if (!condition)
    {
        return indent(level) + "null";
    }

    if (condition.type === Type.VALUE && condition.scalarType === COMPUTED_VALUE_TYPE)
    {
        if (condition.value.name === "now")
        {
            return indent(level) + "now()"
        }
        else if (condition.value.name === "today")
        {
            return indent(level) + "today()"
        }
    }

    const { type, name } = condition;

    const nextLevel = level >= 0 ? level + 1 : level

    if (type === Type.FIELD)
    {
        return indent(level) + "field(" + JSON.stringify(name) + ")";
    }
    else if (type === Type.CONDITION || type === Type.OPERATION)
    {
        const { name, operands } = condition;
        if (invert && !topLevelConditions.hasOwnProperty(name))
        {
            return decompileFilter( operands[0], level, true) + "." + name + (level >= 0 && operands.length > 1 ? "(\n" : "(") + operands.slice(1).map(o => decompileFilter(o, nextLevel, invert)).join((level >= 0 && operands.length > 1? ",\n" : ",")) + (level >= 0 && operands.length > 1 ? "\n" : "") + indent(level) + ")";
        }
        return indent(level) + name + (level >= 0 && operands.length > 0 ? "(\n" : "(") + operands.map( o => decompileFilter(o, nextLevel, invert)).join((level >= 0 && operands.length > 1 ? ",\n" : ",")) + (level >= 0 && operands.length > 0? "\n" : "") + indent(level) + ")";
    }
    else if (type === Type.VALUE)
    {
        const { value, scalarType } = condition;
        if (value !== null && simplifiedValues[scalarType])
        {
            return indent(level) + "value(" + convert(value, scalarType) + ")";
        }
        return indent(level) + "value(" + JSON.stringify(value) + ", " + JSON.stringify(scalarType) +")";

    }
    else if (type === Type.VALUES)
    {
        const { values, scalarType } = condition;
        return indent(level) + "values(" + JSON.stringify(scalarType) + ", " + JSON.stringify(values)+ ")";

    }
    else if (type === Type.COMPONENT)
    {
        const { id, condition : component } = condition;
        return indent(level) + "component(" + JSON.stringify(id) + ", " + (level >= 0 ? "\n" : "") + decompileFilter(component, nextLevel) + (level >= 0 ? "\n" : "") + indent(level) + ")";
    }
    else
    {
        throw new Error("Unhandled type: " + type);
    }
}
