import config from "./config"

export default function extractTypeData(typeName, obj)
{
    const typeDef = config.inputSchema.getType(typeName);

    if (!typeDef)
    {
        throw new Error("Cannot extract data of type '" + typeName + "': Type not found in schema.")
    }
    
    const isInputType = !!typeDef.inputFields;

    const fields = isInputType ? typeDef.inputFields : typeDef.fields;

    const out = {
        _type: typeName,
    };

    for (let i = 0; i < fields.length; i++)
    {
        const { name } = fields[i];
        out[name] = obj[name];
    }

    return out;
}
