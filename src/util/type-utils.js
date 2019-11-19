import config from "../config";
import unwrapAll from "./unwrapAll";

const {INPUT_OBJECT} = require("domainql-form/lib/kind");

export function findNamed(array, name)
{
    for (let i = 0; i < array.length; i++)
    {
        const elem = array[i];
        if (elem.name === name)
        {
            return elem;
        }
    }
    return null;
}




/**
 * Resolves the type of a given path expression relative to given base domain type.
 *
 * In contrast to the paths InputSchema uses, it handles List constructs differently, that is it ignores
 * them like GraphQL does internally.
 *
 * @param {String} name     base domain type
 * @param {String} path     path separated by dots, ignoring lists
 */
export function lookupType(name, path)
{
    let type = config.inputSchema.getType(name);
    if (!type)
    {
        throw new Error("No base type with name '" + name + "' found");
    }

    const pathArray = path.split("\.");

    const { length } = pathArray;
    const last = length - 1;

    let fieldTypeRef;
    for (let i = 0; i < length; i++)
    {
        let segment = pathArray[i];
        const fields = type.kind === INPUT_OBJECT ? type.inputFields : type.fields;
        const field = findNamed(fields, segment);
        if (!field)
        {
            throw new Error("Cannot find field '" + segment + "' in type '" + type.name + "'");
        }


        fieldTypeRef = unwrapAll(field.type);

        if (i < last)
        {
            if (fieldTypeRef.kind !== "OBJECT" && fieldTypeRef.kind !== "INPUT_OBJECT")
            {
                throw new Error("Cannot find '" + segment[last] + "' in " + JSON.stringify(fieldTypeRef) + ": path = " + pathArray.slice(0, i).join("."));
            }

            type = config.inputSchema.getType(fieldTypeRef.name);
            if (!type)
            {
                throw new Error("No type with name '" + fieldTypeRef.name + "' found");
            }
        }
    }
    return fieldTypeRef;
}

export const INPUT = "Input";


/**
 * Returns the output type name without input suffix for the given type name.
 *
 * @param {String} type      type name
 * @returns {string} output type name
 */
export function getOutputTypeName(type)
{
    if (endsWithInput(type))
    {
        return type.substr(0, type.length - INPUT.length)
    }
    return type;
}

/**
 * Returns the input type name with input suffix for the given type name.
 *
 * @param {String} type      type name
 * @returns {string} input type name
 */
export function getInputTypeName(type)
{
    if (!endsWithInput(type))
    {
        return type + INPUT;
    }
    return type;
}

function endsWithInput(s)
{
    return s.lastIndexOf(INPUT) === s.length - INPUT.length;
}
