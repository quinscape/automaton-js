import { fetchProcessInjections, renderProcess, ErrorView } from "./Process";
import config from "../config";
import render from "../render";
import url from "url";
import React from "react";

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


/**
 * High-level entry point to execute a process based on a local URI.
 *
 * @category process
 *
 */
export function runProcessURI(uri)
{

    const {pathname, query} = url.parse(uri, true);

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

