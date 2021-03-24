import { findNamed, getFields, unwrapAll } from "./type-utils"

import { INPUT_OBJECT, OBJECT, SCALAR } from "domainql-form/lib/kind"


function followField(field, rawSchema, knownTypes)
{
    const fieldTypeRef = unwrapAll(field.type);

    if (fieldTypeRef.kind === OBJECT || fieldTypeRef.kind === INPUT_OBJECT)
    {
        followType(rawSchema, knownTypes, fieldTypeRef.name);
    }
    else if (fieldTypeRef.kind === SCALAR)
    {
        const typeDef = findNamed(rawSchema.types, fieldTypeRef.name);
        if (typeDef != null && !knownTypes.has(fieldTypeRef.name))
        {
            knownTypes.add(fieldTypeRef.name);
        }
    }
}


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

    const fields = getFields(typeDef);
    if (fields)
    {
        for (let i = 0; i < fields.length; i++)
        {
            const field = fields[i];
            followField(field, rawSchema, knownTypes);
        }
    }
}


const filterObject = (obj, knownTypes) => {
    const out = {};
    for (let key in obj)
    {
        if (obj.hasOwnProperty(key) && knownTypes.has(key))
        {
            out[key] = obj[key];
        }
    }
    return out;
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

    const queryType = { ... findNamed(rawSchema.types, "QueryType") };
    const mutationType = { ... findNamed(rawSchema.types, "MutationType") };

    const knownQueries = new Set();
    const knownMutations = new Set();

    for (let i = 0; i < typeNames.length; i++)
    {
        const typeName = typeNames[i];

        const isQueryRef = typeName.indexOf("q:") === 0;
        const isMutationRef = typeName.indexOf("m:") === 0;
        if (isQueryRef || isMutationRef)
        {
            const fields = isQueryRef ? queryType.fields : mutationType.fields;
            const { name, args, type} = findNamed( fields, typeName.substring(2));

            for (let j = 0; j < args.length; j++)
            {
                followType(rawSchema, knownTypes, unwrapAll(args[j].type).name)
            }

            followType(rawSchema, knownTypes, unwrapAll(type).name)

            if (isQueryRef)
            {
                knownQueries.add(name);
            }
            else if (isMutationRef)
            {
                knownMutations.add(name);
            }

        }
        else
        {
            followType(rawSchema, knownTypes, typeName)
        }

    }

    //console.log("TYPES:", [... knownTypes])

    const schema = {
        types: rawSchema.types.filter( td => knownTypes.has(td.name) ),
        relations: rawSchema.relations.filter( r => knownTypes.has(r.sourceType) && knownTypes.has(r.targetType)),
        nameFields: filterObject(rawSchema.nameFields, knownTypes),
        genericTypes: rawSchema.genericTypes.filter( gt => knownTypes.has(gt.type))
    };

    queryType.fields = queryType.fields.filter( f => knownQueries.has(f.name));
    mutationType.fields = mutationType.fields.filter( f => knownMutations.has(f.name));

    schema.types.push(queryType);
    schema.types.push(mutationType);

    return schema

}
