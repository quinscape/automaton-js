/**
 * Clones a given domain object by serializing and deserializing it.
 *
 * This ensures that the new object will use the exact same custom domain implementation classes as the original and
 * does not replace them with simple observables.
 *
 * @param {object} obj      object to be cloned

 * @returns {object} cloned object
 */
import { INPUT_OBJECT, LIST, NON_NULL, OBJECT, SCALAR } from "domainql-form/lib/kind";
import config from "../config";
import createDomainObject from "../createDomainObject";
import { observable } from "mobx";


function join(path, segment)
{
    if (path)
    {
        return path + "." + segment;
    }
    return segment;
}



function getTypeDef(obj)
{
    const name = obj._type;
    if (!name)
    {
        throw new Error("Object has no _type property: " + JSON.stringify(obj));
    }

    const typeDef = config.inputSchema.getType(name);
    if (!typeDef)
    {
        throw new Error("Could not find type '" + name + "' in schema");
    }

    return typeDef;
}


/**
 * Clones a list of domain objects instead of a single domain object.
 *
 * Each object must fulfill the requirements explained for clone()
 *
 * @param {Array<object>} array     observable object to clone deeply.
 * @param {Array<object>} update    observable array clone to update instaed of creating new clones
 *
 * @returns {Array<object>} cloned list
 */
export function cloneList(array, update)
{
    return cloneOrUpdate(
        {
            kind: LIST,
            ofType: getTypeDef(obj)
        },
        obj,
        update,
        ""
    );
}


/**
 * Clones or updates a domain object hierarchy. The given object must have a _type property specifying the domain type.
 * Only the fields of the corresponding GraphQL type are cloned.
 *
 * @param {object} obj      observable object to clone deeply, instancing custom implementations as needed
 * @param {object} update   observable clone to update instead of creating a new clone
 * 
 * @returns {object} cloned object
 */
export function clone(obj, update)
{
    return cloneOrUpdate(
        getTypeDef(obj),
        obj,
        update,
        ""
    );
}


function cloneOrUpdate(typeRef, value, update, path)
{
    if (typeRef.kind === NON_NULL)
    {
        if (value === null)
        {
            throw new Error("NON_NULL value is null: typeRef = " + JSON.stringify(typeRef) + ", value = " + JSON.stringify(value));
        }

        return cloneOrUpdate(typeRef.ofType, value, update, path);
    }

    if (typeRef.kind === SCALAR)
    {
        return value;
    }
    else if (typeRef.kind === OBJECT || typeRef.kind === INPUT_OBJECT)
    {
        if (!value)
        {
            return null;
        }

        const typeName = typeRef.name;

        const typeDef = config.inputSchema.getType(typeName);
        if (!typeDef)
        {
            throw new Error("Could not find type '" + typeName + "' in schema");
        }

        const fields = typeDef.fields || typeDef.inputFields;
        if (!fields)
        {
            throw new Error("Type '" + typeName + "' has no fields: " + JSON.stringify(typeDef));
        }

        const out = update || createDomainObject(typeName, null);

        for (let i = 0; i < fields.length; i++)
        {
            const { name, type } = fields[i];
            const pathForField = join(path, name);

            const fieldValue = value[name];
            if (fieldValue !== undefined)
            {
                out[name] = cloneOrUpdate(type, fieldValue, out[name], pathForField);
            }
        }
        return out;
    }
    else if (typeRef.kind === LIST)
    {
        if (value)
        {
            const elementType = typeRef.ofType;
            const out = new Array(value.length);

            for (let j = 0; j < value.length; j++)
            {
                out[j] = cloneOrUpdate(elementType, value[j], out[j], path);
            }
            return observable(out);
        }
        return null;
    }
}
