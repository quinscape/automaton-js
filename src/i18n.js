import { configuration } from "./configuration";

function format(tag, arg)
{
    return tag.replace(/{([0-9]+)}/g, function (m, nr)
    {
        return arg[+nr];
    });
}

/**
 * Returns a translation of the given translation key with additional optional arguments
 * @param {string} s translation tag/key
 * @param {...string} args optional translation parameters
 * @returns {string}
 */
export default function(s, ... args)
{
    const result = configuration().translations[s];
    if (result !== undefined)
    {
        return format(result, args);
    }

    const colonPos = s.indexOf(':');
    if (colonPos >= 0)
    {
        s = s.substr( colonPos + 1);
    }

    if (args.length > 0)
    {
        return "[" + format(s, args) + "]"
    }
    return "[" + s + "]";
};
