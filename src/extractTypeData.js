import config from "./config"
import { INPUT_OBJECT } from "domainql-form/lib/kind";
import { getFields } from "./util/type-utils";


/**
 * Extracts type data of a specified type from the given object. The method will return a plain object containing
 * only the properties of the specified type.
 *
 * @category domain
 *
 * @param {String} typeName         GraphQL type name
 * @param {Observable|object} obj   object.
 * @return {{_type: *}}
 */
export default function extractTypeData(typeName, obj)
{
    const typeDef = config.inputSchema.getType(typeName);

    if (!typeDef)
    {
        throw new Error("Cannot extract data of type '" + typeName + "': Type not found in schema.")
    }

    const fields = getFields(typeDef);

    const out = {
        _type: typeName,
    };

    for (let i = 0; i < fields.length; i++)
    {
        const { name } = fields[i];
        const value = obj[name];
        if (value !== undefined)
        {
            out[name] = value;
        }
    }

    return out;
}
