import React from "react";
import { toast } from "react-toastify";
import i18n from "../i18n";
import { getGenericType } from "../domain";
import { toJS } from "mobx";


let resultTypes = {};
let configuredResultType = false;

/**
 * Registers a converter function that converts the generic result data based on types originating from a given generic java-type or GraphQL type.
 *
 * @param {String} type      Fully qualified generic type or GraphQL type to register the option converter for
 * @param {Function} converterFn    options converter converting instance of the type to react-toastify options
 */
export function configurePromiseUI(type, converterFn)
{
    if (typeof type !== "string" || !type.length)
    {
        throw new Error("Need type (full qualified java class name or valid GraphQL type)");
    }
    if (typeof converterFn !== "function")
    {
        throw new Error("Need converter function");
    }

    resultTypes[type] = converterFn;
    configuredResultType = true;
}


/**
 * Collects notifications by running the option converters registered for the matching generic types
 * @param notifications
 * @param value
 */
function runOptionConverters(notifications, value)
{
    const genericType = getGenericType(value._type)
    const converterFn = resultTypes[genericType] || resultTypes[value._type];
    if (converterFn)
    {
        notifications.push(converterFn(value))
    }
}


/**
 * Extracts the generic result of the configured type contained in the potential multi-method result document.
 *
 * @param {object} result   GraphQL result
 * @return {array<object>} array of responses of the given generic type
 */
function findGenericResults(result)
{
    const notifications = [];

    if (result && configuredResultType)
    {
        if (typeof result === "object" && result._type)
        {
            runOptionConverters(notifications, result);
        }
        else
        {
            for (let graphQLMethod in result)
            {
                if (result.hasOwnProperty(graphQLMethod))
                {
                    const value = result[graphQLMethod];

                    if (value && typeof value === "object" && value._type)
                    {
                        runOptionConverters(notifications, value);
                    }
                }
            }
        }
    }

    return notifications;
}

const resetLoadingParams = {
    isLoading: null,
    autoClose: null,
    closeOnClick: null,
    closeButton: null,
    draggable: null
};


const DEFAULT_OPTIONS = {
    loadingText: i18n("promiseUI:Loading..."),
    defaultResolve: {
        type: "success",
        render: i18n("promiseUI:Ok")
    },
    defaultReject: {
        autoClose: false,
        type: "error",
        render: i18n("promiseUI:Request failed")
    }
}

/**
 * Wrapper for GraphQL-data promises that renders UI messages/"toasts" for a given promise.
 *
 * Allows for control of messages by registering option converter functions for generic types.
 *
 * @param {Promise} promise                     promise, usually a graphql query
 * @param {Object} [options]                    options
 * @param {String} [options.loadingText]        Text to display while the promise is pending
 * @param {String} [options.defaultResolve]     toast to use on resolve when none of the option converters apply
 * @param {String} [options.defaultReject]      toast to use on reject when none of the option converters apply
 *
 * @return {Promise<*>} resolves/rejects to the same value as the initial promise
 */
export default function promiseUI(promise, options)
{
    const { loadingText, defaultResolve, defaultReject } = {
        ... DEFAULT_OPTIONS,
        ... options
    }

    //console.log("promiseUI: start", loadingText);

    const toastId = toast.loading(loadingText);

    return Promise.resolve(promise).then(
        result => {

            return new Promise((resolve, reject) => {
                const notifications = findGenericResults(result);

                if (!notifications.length)
                {
                    if (defaultResolve)
                    {
                        toast.update(
                            toastId,
                            {
                                ... resetLoadingParams,
                                ... defaultResolve
                            }
                        )
                    }
                    else {
                        toast.dismiss(toastId)
                    }
                    resolve(result);
                    return;
                }

                let hasFailed = false;

                for (let i = 0; i < notifications.length; i++)
                {
                    const notification = notifications[i];
                    if (notification)
                    {
                        const { type : typeFromConverter, render, ...optsFromConverter } = notification;
                        const type = typeFromConverter ? typeFromConverter.toLowerCase() : "default";

                        const options = {
                            ... resetLoadingParams,
                            ... optsFromConverter,
                            type,
                            render
                        };

                        if (i === 0)
                        {
                            toast.update(
                                toastId,
                                options
                            )
                        }
                        else {
                            toast(render, options)
                        }

                        if (type === "error")
                        {
                            hasFailed = true;
                        }
                    }
                    else
                    {
                        if (i === 0)
                        {
                            toast.dismiss(toastId);
                        }
                    }
                }

                if (hasFailed)
                {
                    reject(toJS(result));
                }
                else
                {
                    resolve(result);
                }

            })
        },
        err => {
            const clonedDefaultRejectOptions = {...defaultReject};
            if (typeof defaultReject.render === "function")
            {
                clonedDefaultRejectOptions.render = defaultReject.render(err);
            }

            toast.update(
                toastId,
                {
                    ... resetLoadingParams,
                    ... clonedDefaultRejectOptions
                }
            )
            return Promise.reject(err);
        }
    )
}
