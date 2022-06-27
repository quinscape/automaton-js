import { isPropertyWritable } from "domainql-form"

/**
 * Clone function for JSON object graphs
 * 
 * @param {Object|Array|string|number|boolean} value value to clone
 */
export default function clone(value)
{
    if (Array.isArray(value))
    {
        const out = []
        for (let i = 0; i < value.length; i++)
        {
            out[i] = clone(value[i])
        }
        return out
    }
    else if (value && typeof value === "object")
    {
        const out = {}
        for (let prop in value)
        {
            if (value.hasOwnProperty(prop))
            {
                if(isPropertyWritable(out, prop)) {
                    out[prop] = clone(value[prop])
                }
            }
        }
        return out
    }
    return value
}
