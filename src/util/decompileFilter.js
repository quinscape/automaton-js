import { COMPUTED_VALUE_TYPE, Type } from "../FilterDSL"

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


/**
 * Converts the given FilterDSL condition graph into a pretty-formatted source
 * form using the FilterDSL API (and DateTime.fromIso() expressions)
 *
 * @param {Object} condition        condition graph
 * @param {Number} level            starting indentation level
 * @param {Object} match            Optional object to mark. The given node is assumed to an instance in the graph and
 *                                  the source output of that object is marked is enclosed in \/*>>*\/ \/*<<*\/ to mark the object
 * @param {boolean} invert          inverts condition output (mostly internal usage)
 *
 * @return {string} pretty-printed source string. If match was used, the >> << might prevent it from being valid JavaScript
 */
export default function decompileFilter(condition, level = 0, match = null, invert = true) {
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

    const markerL = match === condition ? "/*>>*/ " : "";
    const markerR = match === condition ? " /*<<*/" : "";

    if (type === Type.FIELD)
    {
        return indent(level) + markerL + "field(" + JSON.stringify(name) + ")" + markerR;
    }
    else if (type === Type.CONDITION || type === Type.OPERATION)
    {
        const { name, operands } = condition;
        if (invert && !topLevelConditions.hasOwnProperty(name))
        {
            return decompileFilter(operands[0], level, match, true) + "." + markerL + name + (level >= 0 && operands.length > 1 ? "(\n" : "(") + operands.slice(1).map(o => decompileFilter(o, nextLevel, match, invert)).join((level >= 0 && operands.length > 1? ",\n" : ",")) + (level >= 0 && operands.length > 1 ? "\n" : "") + indent(level) + ")" + markerR;
        }
        return indent(level) + markerL + name + (level >= 0 && operands.length > 0 ? "(\n" : "(") + operands.map( o => decompileFilter(o, nextLevel, match, invert)).join((level >= 0 && operands.length > 1 ? ",\n" : ",")) + (level >= 0 && operands.length > 0? "\n" : "") + indent(level) + ")" + markerR;
    }
    else if (type === Type.VALUE)
    {
        const { value, scalarType } = condition;
        if (value !== null && simplifiedValues[scalarType])
        {
            return indent(level) + markerL +"value(" + convert(value, scalarType) + ")" + markerR;
        }
        return indent(level) + markerL +"value(" + JSON.stringify(value) + ", " + JSON.stringify(scalarType) +")" + markerR;

    }
    else if (type === Type.VALUES)
    {
        const { values, scalarType } = condition;
        return indent(level) + markerL +"values(" + JSON.stringify(scalarType) + ", " + JSON.stringify(values)+ ")" + markerR;

    }
    else if (type === Type.COMPONENT)
    {
        const { id, condition : component } = condition;
        return indent(level) + markerL + "component(" + JSON.stringify(id) + ", " + (level >= 0 ? "\n" : "") + decompileFilter(component, nextLevel, match, true) + (level >= 0 ? "\n" : "") + indent(level) + ")" + markerR;
    }
    else
    {
        throw new Error("Unhandled type: " + type);
    }
}
