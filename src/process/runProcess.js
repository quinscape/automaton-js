import {
    fetchProcessInjections,
    renderProcess,
    ErrorView,
    confirmDestructiveTransition,
    findProcessScopeWithWorkingSet, getCurrentProcess
} from "./Process"
import config from "../config";
import render from "../render";
import React from "react";
import searchParams from "../util/searchParams";
import i18n from "../i18n"
import {FormContext} from "domainql-form";

const NUMBER_RE = /^-?[0-9]{1-15}$/;


function prepare(s)
{
    if (NUMBER_RE.test(s))
    {
        return +s;
    }
    else
    {
        return s;
    }
}


function prepareInput(query)
{
    const input = {};
    for (let name in query)
    {
        if (query.hasOwnProperty(name))
        {
            const v = query[name];

            if (Array.isArray(v))
            {
                const len = v.length;
                const out = new Array(len);
                for (let i = 0; i < len; i++)
                {
                    out[i] = prepare(v[i]);
                }

                input[name] = out;
            }
            else
            {
                input[name] = prepare(v);
            }

        }
    }

    return input;
}


function uriPath(uri)
{
    const pos = uri.indexOf("?");
    if (pos >= 0)
    {
        return uri.substring(0, pos);
    }
    return uri;
}


/**
 * High-level entry point to execute a process based on a local URI.
 *
 * @category process
 *
 */
export function runProcessURI(uri)
{
    const pathname = uriPath(uri);
    const query = searchParams(uri);

    const {appName, contextPath} = config;

    if (contextPath && pathname.indexOf(contextPath) !== 0)
    {
        // if we have a context path, we only intercept when the link starts with the context path.
        return false;
    }

    const baseSegment = contextPath + "/" + appName + "/";
    if (pathname.indexOf(baseSegment) !== 0)
    {
        // we don't intercept if the link goes to another end-point
        return false;
    }

    let processName;
    const baseLen = baseSegment.length;
    const lastHrefPos = pathname.length - 1;
    if (pathname[lastHrefPos] === "/")
    {
        processName = pathname.substr(baseLen, lastHrefPos - baseLen);
    }
    else
    {
        processName = pathname.substr(baseLen)
    }

    return runProcess(processName, prepareInput(query))
}


/**
 * High-level entry point to execute a process. Performs the whole initialization procedure and then triggers
 * a rendering of the first view-state.
 *
 * @category process
 *
 * @param {String} processName     process name
 * @param {object} [input]         input map (processed format with single strings and numbers)
 *
 * @return {Promise}    promise that resolves after the new process has finished rendering.
 */
export default function runProcess(processName, input) {

    if (!confirmDestructiveTransition())
    {
        return Promise.reject(
            new Error(
                i18n("User canceled")
            )
        )
    }


    // XXX: We need to clear our errors as a makeshift solution for the problem that we might start a new process while
    //      there is an error. The process is technically not dead because the user can navigate via browser history
    //      To leave everything in the best possible state, we undo working set changes after the user has agreed to the
    //      data loss and remove all form errors. The user changes are in fact lost now and errors that may still exist
    //      independent of the working set will be rediscovered on revalidate() *if* the user should ever return

    const scope = findProcessScopeWithWorkingSet(getCurrentProcess())
    if (scope && scope.workingSet)
    {
        scope.workingSet.undo()
    }
    FormContext.getDefault().removeAllErrors()

    return fetchProcessInjections(config.appName, processName, input)
        .then(
            ({input, injections}) =>
                renderProcess(
                    processName,
                    input,
                    injections
            )
        , err => <ErrorView title="Error running Process" info={ err } />)
        .then(elem => render(elem))
        .catch(err => console.error("ERROR RUNNING PROCESS", err))
}

