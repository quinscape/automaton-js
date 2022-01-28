/**
 * Replacement for the old toJS(..., { recurseEverything: true }).
 *
 * It tolerates a mix of intermediary non-observable objects and observable objects
 */
import { isObservable, toJS } from "mobx";

export default function toJSEveryThing(value)
{
    if (isObservable(value))
    {
        return toJS(value)
    }
    else if (Array.isArray(value))
    {
        const out = [];
        for (let i = 0; i < value.length; i++)
        {
            out.push(toJSEveryThing(value[i]));
        }
        return out
    }
    else if (value && typeof value === "object")
    {
        const out = {}
        for (let name in value)
        {
            if (value.hasOwnProperty(name))
            {
                out[name] = toJSEveryThing(value[name]);
            }
        }
        return out
    }
    return value
}
