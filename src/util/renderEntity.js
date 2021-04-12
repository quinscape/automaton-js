import React from "react";
import config from "../config"

const renderers = new Map();


export function registerEntityRenderer(type, fn)
{
    renderers.put(type, fn);
}


/**
 * The default renderer concatenates all name fields of the type of the given domain objects to a string or span with
 * type data type annotation, depending on textOnly mode.
 *
 * If no name fields are registered, it will use "type@id" as output.
 *
 * @param domainObject
 * @param textOnly
 * @return {string|*}
 */
function defaultRenderer(domainObject, textOnly)
{
    const { nameFields } = config.inputSchema.schema
    const { _type : type } = domainObject;

    const fields = nameFields[type];
    if (!fields)
    {
        return type + "@" + domainObject.id;
    }

    let s = domainObject[fields[0]];
    for (let i = 1; i < fields.length; i++)
    {
        s += " " + domainObject[fields[i]];
    }
    return textOnly ? s : <span data-type={ type }>{ s }</span>;
}


export default function renderEntity(domainObject, textOnly = true)
{
    const { _type : type } = domainObject;

    const fn = renderers.get(type);

    if (fn)
    {
        const result = fn(domainObject, textOnly);

        if (__DEV)
        {
            if (textOnly && typeof result === "object")
            {
                console.warn("Entity renderer ", fn, " returned an object in textOnly mode.");
            }
        }

        return result;
    }
    return defaultRenderer(domainObject, textOnly);
}
