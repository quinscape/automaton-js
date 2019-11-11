import { findNamed } from "./type-utils"
import unwrapAll from "./unwrapAll";


function followType(rawSchema, knownTypes, typeName)
{
    if (knownTypes.has(typeName))
    {
        return;
    }

    knownTypes.add(typeName);

    const typeDef = findNamed(rawSchema.types, typeName);
    if (!typeDef)
    {
        throw new Error("Type '" + typeName + "' not found");
    }

    const fields = typeDef.kind === "INPUT_OBJECT" ? typeDef.inputFields : typeDef.fields;

    for (let i = 0; i < fields.length; i++)
    {
        const field = fields[i];
        const fieldTypeRef = unwrapAll(field.type);

        if (fieldTypeRef.kind === "OBJECT" || fieldTypeRef.kind === "INPUT_OBJECT")
        {
            followType(rawSchema, knownTypes, fieldTypeRef.name);
        }
        else if (fieldTypeRef.kind === "SCALAR")
        {
            const typeDef = findNamed(rawSchema.types, fieldTypeRef.name);
            if (typeDef != null && !knownTypes.has(fieldTypeRef.name))
            {
                knownTypes.add(fieldTypeRef.name);
            }
        }
    }
}


/**
 * Filters a raw input schema JSON structure to only include the types reachable by a given list of type names
 * as starting points.
 *
 * @param {Object} rawSchema            raw input schema data  / introspection result
 * @param {Array<String>} typeNames     types to start at
 */
export default function pickSchemaTypes(rawSchema, typeNames)
{
    const knownTypes = new Set();

    for (let i = 0; i < typeNames.length; i++)
    {
        const typeName = typeNames[i];

        followType(rawSchema, knownTypes, typeName)
    }

    //console.log("TYPES:", [... knownTypes])

    return {
        types: rawSchema.types.filter( td => knownTypes.has(td.name) )
    }

}
