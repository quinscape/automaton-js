import url from "url";

import config from "./config";


function evaluateParams(params, usedInPath)
{
    let p = "";
    if (params)
    {
        let sep = "?";
        for (let name in params)
        {
            if (params.hasOwnProperty(name) && !usedInPath[name])
            {
                const value = params[name];
                if (value !== undefined)
                {
                    p += sep + encodeURIComponent(name) + "=" + encodeURIComponent(value);
                    sep = "&";
                }
            }
        }
    }
    return p;
}


function replacePathVariables(location, params, usedInPath)
{
    return location.replace(/{([0-9a-z_]+)\??}/gi, function (match, name) {
        const value = params && params[name];
        if (value === undefined)
        {
            throw new Error("Undefined path variable '" + name + "' in '" + location + "'");
        }
        usedInPath[name] = true;
        return value;
    });
}


/**
 * Formats a local URI with path patterns and parameters.
 *
 * @param {String} location                 local location e.g. "/app/process/{name}"
 * @param {Object} [params]                   path variable or HTTP parameter to add to the URI. If a parameter name is not present as a path variable, it is used as HTTP parameter.
 * @param {boolean} [containsContextPath]   if set to true, `location` will be assumed to already contain the context path
 * @return {string}
 */
export default function uri(location, params, containsContextPath) {
    const usedInPath = {};

    location = replacePathVariables(location, params, usedInPath);

    const hPos = location.indexOf("#");
    if (hPos >= 0)
    {
        location = location.substring(0, hPos);
    }
    const qPos = location.indexOf("?");
    if (qPos >= 0)
    {
        const current = url.parse(location, true);
        params = Object.assign(current.query, params);
        location = location.substring(0, qPos);
    }

    const result = (containsContextPath ? "" : config.contextPath) + location + evaluateParams(params, usedInPath);

    //console.log("URI:", result);

    return result;
}

