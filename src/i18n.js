import config from "./config";


function format(tag, args)
{
    return tag.replace(/{([0-9]+)}/g, function (m, nr) {
        return args[+nr];
    });
}


function wrap(s)
{
    if (config.markUntranslated)
    {
        return "[" + s + "]";
    }
    return s;
}

/**
 * Returns a translation of the given translation key with additional optional arguments
 * @param {string} key translation tag/key
 * @param {...string} args optional translation parameters
 * @returns {string}
 */
export default function (key, ...args) {
    const result = config.translations[key];

    if (typeof result === "function")
    {
        return result(key, args);
    }

    if (result !== undefined)
    {
        return format(result, args);
    }

    const colonPos = key.indexOf(":");
    if (colonPos >= 0)
    {
        key = key.substr(colonPos + 1);
    }

    if (args.length > 0)
    {
        return wrap(format(key, args))
    }
    return wrap(key);
};
