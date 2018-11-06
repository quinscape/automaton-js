import React from "react"
import DefaultLayout from "./ui/DefaultLayout";
import {
    APP_SCOPE,
    LOCAL_SCOPE,
    SESSION_SCOPE,
    USER_SCOPE
} from "./scopeNames";


export const DEFAULT_OPTS = {

    contextPath: "",
    appName: null,
    rootProcess: null,

    csrfToken: null,
    auth: null,

    locale: null,
    translations: {},

    layout: DefaultLayout,
    inputSchema: null,

    history: null,

    scopeSyncTimeout: 1500,

    // standard scopes, might not exist in application
    [APP_SCOPE]: null,
    [USER_SCOPE]: null,
    [SESSION_SCOPE]: null,
    [LOCAL_SCOPE]: null,
};


function ensureValid(property)
{
    if (!property instanceof Symbol)
    {

        if (!DEFAULT_OPTS.hasOwnProperty(property))
        {
            throw new Error("Invalid config key: " + property);
        }
    }
}


const VALID_KEYS = Object.keys(DEFAULT_OPTS);

/**
 * Configuration object
 *
 * @type {{scopeSyncTimeout: number, layout: React.Component, translations: object, contextPath: String}}
 */
export default new Proxy(
    function () {

    },
    {
        get: function (config, property) {
            if (property === "keys")
            {
                return VALID_KEYS;
            }

            return config[property];
        },
        set: function (config, property, value) {

            config[property] = value;

            return true;
        },
        apply: function (target, thisArg, argumentsList) {
            //console.log("apply",target, thisArg, argumentsList);
            return VALID_KEYS;
        }
    }
);
