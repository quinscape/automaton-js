
import config from "../config";
import unwrapAll from "./unwrapAll";

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
export default function lookupType(name, path)
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
        const fields = type.kind === "INPUT_OBJECT" ? type.inputFields : type.fields;
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
