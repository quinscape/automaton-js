import config from "../config";
import { LIST, SCALAR, INPUT_OBJECT, NON_NULL } from "domainql-form/lib/kind";
import { INTERACTIVE_QUERY } from "../domain";

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
 * Returns an array of fields for the given type. Supports both input types and output types.
 * @param {Object} type     GraphQL type definition
 *
 * @returns {array<object>} array of fields
 */
export function getFields(type)
{
    return type.kind === INPUT_OBJECT ? type.inputFields : type.fields;
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
    const { field } = lookupTypeContext(name, path);
    return unwrapAll(field.type);
}


/**
 * Resolves the type context of a given path expression relative to given base domain type.
 *
 * In contrast to the paths InputSchema uses, it handles List constructs differently, that is it ignores
 * them like GraphQL does internally.
 *
 * @param {String} name     base domain type
 * @param {String} path     path separated by dots, ignoring lists
 */
export function lookupTypeContext(name, path)
{
    let type = config.inputSchema.getType(name);
    if (!type)
    {
        throw new Error("No base type with name '" + name + "' found");
    }

    const pathArray = path.split("\.");

    const { length } = pathArray;
    const last = length - 1;

    let fieldTypeRef, field;
    for (let i = 0; i < length; i++)
    {
        let segment = pathArray[i];
        const fields = getFields(type);
        field = findNamed(fields, segment);
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
    return {
        domainType: type.name,
        field
    };
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
    const pos = s.lastIndexOf(INPUT);
    return pos > 0 && pos === s.length - INPUT.length;
}

export function unwrapAll(type) {
    if (type.kind === NON_NULL || type.kind === LIST)
    {
        return unwrapAll(type.ofType);
    }
    return type;
}

export function unwrapNonNull(type)
{
    if (type.kind === NON_NULL)
    {
        return type.ofType;
    }
    return type;
}

/**
 * Returns true if the given type definition is a list or non-null list.
 *
 * @param {Object} type     GraphQL type definition
 * @returns {boolean}   true if list
 */
export function isListType(type)
{
    return unwrapNonNull(type).kind === LIST;
}


/**
 * Returns true if the given type definition is, after unwrapping all non-null and list types, is a scalar type.
 *
 * @param {Object} type     GraphQL type definition
 * @returns {boolean}   true if (wrapped) scalar
 */
export function isWrappedScalarType(type)
{
    return unwrapAll(type).kind === SCALAR;
}


/**
 * Looks up the payload type for a given iQuery type
 *
 * @param {String} iQueryType   type of the iQuery container
 * 
 * @return {String} payload type
 */
export function getIQueryPayloadType(iQueryType)
{
    const genericTypes = config.inputSchema.getGenericTypes().filter(
        genericType => genericType.type === iQueryType
    );

    if (genericTypes.length && genericTypes[0].genericType === INTERACTIVE_QUERY)
    {
        return genericTypes[0].typeParameters[0];
    }

    return null;
}
