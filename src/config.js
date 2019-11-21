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
    genericTypes: null,

    history: null,

    scopeSyncTimeout: 1500,

    subProcessAsDialog: true,

    /**
     * Config for process dialogs
     */
    processDialog: {
        /** props to apply to the <Modal/> component */
        props: {
            size: "lg",
            fade: false
        },
        /** Additional classes for the <ModalBody/> component */
        bodyClass: ""
    },

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

function applyDefaults(theConfig)
{
    for (let name in DEFAULT_OPTS)
    {
        if (DEFAULT_OPTS.hasOwnProperty(name))
        {
            theConfig[name] = DEFAULT_OPTS[name];
        }
    }
}


const VALID_KEYS = Object.keys(DEFAULT_OPTS);


/**
 * Adds a new config name and value to the global config object and also adds that name to the list of valid option
 * names
 * @param name
 * @param value
 */
export function addConfig(name, value)
{
    VALID_KEYS.push(name);
    theConfig[name] = value;
}

/**
 * Configuration object
 *
 */
const theConfig = new Proxy(
    function () {

    },
    {
        get: function (config, property) {
            if (property === "keys")
            {
                return VALID_KEYS;
            }

            ensureValid(property);

            return config[property];
        },
        set: function (config, property, value) {

            ensureValid(property);

            config[property] = value;

            return true;
        },
        apply: function (target, thisArg, argumentsList) {
            //console.log("apply",target, thisArg, argumentsList);
            return VALID_KEYS;
        }
    }
);

applyDefaults(theConfig);
export default theConfig;

