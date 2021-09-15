import React from "react";
import { toast } from "react-toastify";
import i18n from "../i18n";
import { getGenericType } from "../index";


let configuredConverter;
let configuredResultType;

export function configurePromiseUI(genericType, converterFn)
{
    if (typeof genericType !== "string" || !genericType.length)
    {
        throw new Error("Need genericType (full qualified java class name)");
    }
    if (typeof converterFn !== "function")
    {
        throw new Error("Need converter function");
    }
    configuredResultType = genericType;
    configuredConverter = converterFn;
}


/**
 * Extracts the generic result of the configured type contained in the potential multi-method result document
 * @param {object} result   GraphQL result
 * @return {array<object>} array of responses of the given generic type
 */
function findGenericResults(result)
{
    const notifications = [];

    if (configuredResultType)
    {
        for (let graphQLMethod in result)
        {
            if (result.hasOwnProperty(graphQLMethod))
            {
                const value = result[graphQLMethod];

                if (value && typeof value === "object" && value._type && getGenericType(value._type) === configuredResultType)
                {
                    notifications.push(configuredConverter(value))
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

export default function promiseUI(promise, loadingText = i18n("Loading..."))
{
    //console.log("promiseUI: start", loadingText);

    const toastId = toast.loading(loadingText);

    return Promise.resolve(promise).then(
        result => {

            return new Promise((resolve, reject) => {
                const notifications = findGenericResults(result);

                if (!notifications.length)
                {
                    toast.update(
                        toastId,
                        {
                            ... resetLoadingParams,
                            type: "success",
                            render: i18n("promiseUI:Ok")
                        }
                    )
                    resolve(result);
                    return;
                }

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

                            if (type === "error")
                            {
                                reject(result);
                            }
                            else
                            {
                                resolve(result);
                            }
                        }
                        else {
                            toast(render, options)
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
            })
        },
        err => {
            toast.update(
                toastId,
                {
                    ... resetLoadingParams,
                    autoClose: false,
                    type: "error",
                    render: i18n("promiseUI:Request failed")
                }
            )
            return Promise.reject(err);
        }
    )
}
