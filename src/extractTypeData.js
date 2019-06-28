import config from "./config"

export default function extractTypeData(typeName, obj)
{
    const typeDef = config.inputSchema.getType(typeName);

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
