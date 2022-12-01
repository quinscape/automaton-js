import React from "react"
import DefaultLayout from "./ui/DefaultLayout";
import {
    APP_SCOPE,
    LOCAL_SCOPE,
    SESSION_SCOPE,
    USER_SCOPE,
    COMMON_SCOPE
} from "./scopeNames"
import i18n from "./i18n";
import { observable } from "mobx";

export const DEFAULT_OPTS = {

    contextPath: "",
    appName: null,
    rootProcess: null,

    csrfToken: null,
    auth: null,

    locale: null,
    translations: observable({}),
    markUntranslated: true,

    mergeOptions: {
        versionField: "version",
        allowAutoMerge: true
    },

    layout: DefaultLayout,
    inputSchema: null,

    history: null,

    scopeSyncTimeout: 1500,

    subProcessAsDialog: true,

    navigationHistoryLimit: 30,

    /**
     * TMP: Extra logging for history
     */
    logHistory: false,

    /**
     * Config for process dialogs
     */
    processDialog: {

        /**
         * Function to produce the dialog header title or a constant header title string. If the title is an empty string,
         * the header is not rendered.
         */
        title: name => i18n("Sub-Process {0}", name),

        /**
         * If set to true, remove all sub process states from the browser history on exit.
         */
        nukeOnExit: false,
        
        /** props to apply to the <Modal/> component */
        props: {
            size: "lg",
            fade: false
        },
        /** Additional classes for the <ModalBody/> component */
        bodyClass: ""
    },

    /**
     * Optional information about alternate styles provided by
     * de.quinscape.automaton.runtime.provider.AlternateStyleProvider if present
     */
    alternateStyles: null,
    // standard scopes, might not exist in application
    [APP_SCOPE]: null,
    [USER_SCOPE]: null,
    [SESSION_SCOPE]: null,
    [LOCAL_SCOPE]: null,
    [COMMON_SCOPE]: null,

    userInfo: null,

    timestampFormat: "d.M.yyyy H:mm:ss.SSS",
    dateFormat: "d.M.yyyy",

    ui: {
        stickyTopPadding: 21,
        stickyBottomPadding: 21
    },

    // XXX: experimental dev setting. Should be decided one way or the other in the end
    skipIndexTreeCloning: false
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
const OBSERVABLE_PROPERTIES = ["translations"];

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
 * @category config
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

            if (OBSERVABLE_PROPERTIES.includes(property)) {
                config[property] = observable(value);
            } else {
                config[property] = value;
            }

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

