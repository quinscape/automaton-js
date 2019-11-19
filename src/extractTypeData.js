import config from "./config"
import { INPUT_OBJECT } from "domainql-form/lib/kind";


export default function extractTypeData(typeName, obj)
{
    const typeDef = config.inputSchema.getType(typeName);

    if (!typeDef)
    {
        throw new Error("Cannot extract data of type '" + typeName + "': Type not found in schema.")
    }

    const fields = typeDef.kind === INPUT_OBJECT ? typeDef.inputFields : typeDef.fields;

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
