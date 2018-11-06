import React from "react";
import { createViewModel } from "mobx-utils";
import render from "./render";
import { get, keys, set, toJS, action, observable } from "mobx";

import QueryDeclaration from "./QueryDeclaration";
import FormConfigProvider from "domainql-form/lib/FormConfigProvider";
import config from "./config";
import Transition from "./Transition";
import uri from "./uri";
import i18n from "./i18n";


const NO_MATCH = {
    processName: null,
    moduleName: null,
    isComposite: null
};

const MODULE_REGEX = /^\.\/(processes\/(.*?)\/(composites\/)?)?(.*?).js$/;


function matchPath(path)
{
    const m = MODULE_REGEX.exec(path);
    if (!m)
    {
        return NO_MATCH;
    }

    return {
        processName: m[2],
        shortName: m[4],
        isComposite: !!m[3]
    }
}


const secret = Symbol("ProcessSecret");

export const AutomatonEnv = React.createContext({
    "_": "default context"
});

let currentProcess = null;
let unlistenHistory = null;
let processes = [];

export let navigationHistory = [];


function ProcessEntry(definition)
{
    this.definition = definition;
    this.initProcess = null;
    this.ScopeClass = null;
}


const processDefinitions = {};


/**
 * Loads the process scope, initProcess and components from the given initial data and webpack require context
 *
 * @param ctx       webpack require context
 *
 * @return {{process: *, initProcess: *, ScopeClass: *}}    infrastructural process objects
 */
export function loadProcessDefinitions(ctx)
{
    const keys = ctx.keys();

    //console.log("Modules: ", keys);

    for (let i = 0; i < keys.length; i++)
    {
        const moduleName = keys[i];

        const { processName, shortName, isComposite } = matchPath(keys[i]);

        if (!processName)
        {
            continue;
        }

        //console.log("loadProcessDefinitions", { moduleName, processName, shortName, isComposite });

        if (!shortName)
        {
            throw new Error("Module name '" + keys[i] + "' does not match " + MODULE_REGEX);
        }

        //console.log("-- Process", m[1]);

        let entry = processDefinitions[processName];
        if (!entry)
        {
            entry = new ProcessEntry(
                new ProcessDefinition(processName)
            );
            processDefinitions[processName] = entry;
        }

        const module = ctx(moduleName);
        if (isComposite)
        {
            //console.log("process", process);
            entry.definition.components[shortName] = module.default;
        }
    }

    for (let processName in processDefinitions)
    {
        if (processDefinitions.hasOwnProperty(processName))
        {
            const entry = processDefinitions[processName];

            const path = "./processes/" + processName + "/" + processName + ".js";
            const processModule = ctx(path);
            if (!processModule)
            {
                throw new Error("Could not find process exports module " + path);
            }

            const { default: ScopeClass, initProcess } = processModule;

            if (!initProcess)
            {
                throw new Error("No initProcess defined in " + processName);
            }

            entry.name = processName;
            entry.ScopeClass = ScopeClass;
            entry.initProcess = initProcess;
        }
    }

    return processDefinitions;
}


function getLayout(process, currentState)
{
    const { layout } = process;

    if (layout)
    {
        // if layout is not a react component
        if ((!layout.prototype || !layout.prototype.isReactComponent) && currentState)
        {
            // use it as lookup map
            const component = layout[currentState];
            if (component)
            {
                return component;
            }

            // we can't use the lookup map as react component, so we fall back to either
            // the "default" layout in the lookup or the global default
            return layout.default || config.layout
        }
        return layout;
    }
    return config.layout;
}


function renderViewState()
{
    // directly access secret process data
    const { definition, currentState } = currentProcess[secret];

    //console.log({ definition, currentState });

    const ViewComponent = definition.components[currentState];
    if (!ViewComponent)
    {
        throw new Error("No component '" + currentState + "' in process '" + currentProcess.name)
    }

    //console.log({ ViewComponent });

    const env = {
        config,
        state: currentState,
        scope: currentProcess.scope
    };

    Object.defineProperty(env, "process", {
        get: () => currentProcess,
        configurable: false,
        enumerable: true
    });

    const Layout = getLayout(currentProcess, currentState);

    //console.log("LAYOUT", Layout);

    return (
        <AutomatonEnv.Provider
            value={ env }
        >
            <FormConfigProvider
                schema={ config.inputSchema }
            >
                <Layout
                    env={ env }
                >
                    <ViewComponent
                        env={ env }
                    />
                </Layout>
            </FormConfigProvider>
        </AutomatonEnv.Provider>
    )
}


function ensureInitialized(process)
{
    if (!process[secret].initialized)
    {
        throw new Error("Process not initialized");
    }
}

export class ProcessDefinition {
    constructor(name)
    {
        this.name = name;
        this.components = {};
    }
}

/**
 * Access the resolve and reject functions stored for a sub-process or throws an error when the process is not a sub-process
 *
 * @param process
 */
function subProcessPromiseFns(process)
{
    const { subProcessPromise } = process[secret];

    if (!subProcessPromise)
    {
        throw new Error(process[secret].name + " was not invoked as sub-process");
    }
    return subProcessPromise;
}


/**
 * Process facade exposing a limited set of getters and methods as process API
 */
export class Process {
    constructor(id, definition, scope, input, parent)
    {
        const { name } = definition;

        this[secret] = {
            id,
            name,
            definition,
            input,
            parent,
            scope,

            states: null,
            currentState: null,
            layout: null,

            subProcessPromise: null,

            initialized: false
        };
    }


    /**
     * Current process object
     * @type {*}
     */
    @observable currentObject = null;


    get name()
    {
        return this[secret].name;
    }


    get startState()
    {
        return this[secret].startState;
    }


    get states()
    {
        return this[secret].states;
    }


    get scope()
    {
        return this[secret].scope;
    }


    get layout()
    {
        return this[secret].layout;
    }


    set layout(layout)
    {
        if ((layout.prototype && layout.prototype.isReactComponent) || (layout && typeof layout === "object"))
        {
            this[secret].layout = layout;
        }
        else
        {
            throw new TypeError("Invalid layout: " + layout);
        }
    }

    get input()
    {
        return this[secret].input;
    }


    getComponent(name)
    {
        const component = this[secret].components[name];
        if (!component)
        {
            throw new Error("Could not find component '" + name + "'");
        }
        return component;
    }


    transition(name, context)
    {
        //console.log("process.transition" , name, context);

        ensureInitialized(this);

        const access = this[secret];

        const transition = access.states[access.currentState][name];
        if (!transition)
        {
            throw new Error("Could not find transition '" + name + "' in Process '" + this.name + "'")
        }

        console.log("TRANSITION", transition);

        return (
            Promise.resolve(
                transition.action ?
                    executeTransition(name, transition.action, transition.to, context) :
                    transition.to
            )
                .then(currentState => {

                    if (currentState)
                    {
                        access.currentState = currentState;
                        pushProcessState();
                    }

                    return render(
                        renderViewState(currentState)
                    )
                })
        );
    }


    back()
    {
        // TODO: implement
    }


    /**
     * Runs the process with the given name as sub-process.
     *
     * @param processName   process name
     * @param input         input object for the sub-process
     *
     * @return {Promise<any>} resolves to the sub-process result or is rejected when the sub-process is aborted.
     */
    runSubProcess(processName, input)
    {
        return new Promise((resolve, reject) => {

            return fetchProcessInjections(config.appName, processName, input)
                .then(injections => {

                    //console.log("INJECTIONS", injections);

                    return (
                        renderSubProcess(processName, input, injections.injections)
                            .then(elem => {

                                //console.log("RENDER SUB-PROCESS VIEW", elem);

                                // store for subProcessPromiseFns
                                currentProcess[secret].subProcessPromise = {
                                    resolve,
                                    reject
                                };

                                render(elem);
                            })
                    );
                })
        })
            .then(result => {

                pushProcessState();

                render(
                    renderViewState()
                );

                return result;
            })
            .catch(err => console.error("ERROR IN SUB-PROCESS", err))
    }


    /**
     * Ends the sub-process successfully and returns the given output object
     * @param {*} [output]      sub-process output object
     */
    endSubProcess(output)
    {
        const fns = subProcessPromiseFns(this);

        currentProcess = this[secret].parent;

        fns.resolve(output);
    }


    /**
     * Aborts the sub-process with an error object
     *
     * @param {*} [err]     error object
     */
    abortSubProcess(err)
    {
        subProcessPromiseFns(this).reject(err);
    }

}


function inject(scope, injections)
{
    //console.log("INJECTIONS", injections);

    const scopeKeys = keys(scope);

    for (let i = 0; i < scopeKeys.length; i++)
    {
        const name = scopeKeys[i];

        const prop = get(scope, name);
        if (prop instanceof QueryDeclaration)
        {
            const result = injections[prop.query];
            if (result === undefined)
            {
                throw new Error("Could not find query for prop '" + name + "'");
            }

            //console.log("inject", name, "with", result);

            set(scope, name, result);
        }
    }
}


export function fetchProcessInjections(appName, processName, input)
{
    //console.log("fetchProcessInjections", { appName, processName, input });

    const { csrfToken } = config;

    return fetch(
        window.location.origin + uri("/_auto/process/{appName}/{processName}", {
                                   appName,
                                   processName
                               }),
        {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "text/plain",

                // spring security enforces every POST request to carry a csrf token as either parameter or header
                [csrfToken.header]: csrfToken.value
            },
            body: JSON.stringify(input || {})
        }
    )
        .then(response => response.json())
        .then(
            (data) => {
                if (data.error)
                {
                    return Promise.reject(data.error);
                }

                return data;
            }
        )
        .catch(err => console.error("ERROR FETCHING PROCESS INJECTIONS", err));
}


/**
 * Executes the given transition action function
 *
 * @param {String} name                     Transition name
 * @param {Function<Transition>} actionFn   Transition action function
 * @param {String} [target]                 transition target
 * @param {object} [context]                domain object context
 * @return {Promise<any | never>}
 */
function executeTransition(name, actionFn, target, context)
{
    let viewModel;
    const transition = new Transition(currentProcess, currentProcess[secret].currentState, target, context);

    const access = currentProcess[secret];
    const origScope = access.scope;
    if (origScope)
    {
        viewModel = createViewModel(origScope);
        access.scope = viewModel;
    }

    const mobXActionKey = "mobxAction-" + name;

    let mobxAction = currentProcess[secret][mobXActionKey];
    if (!mobxAction)
    {
        mobxAction = action(
            currentProcess.name + "." + name,
            actionFn
        );
        currentProcess[secret][mobXActionKey] = mobxAction;
    }

    return new Promise(
        (resolve, reject) => {
            try
            {
                resolve(
                    mobxAction(
                        transition
                    )
                );
            }
            catch (e)
            {
                reject(e);
            }
        }
    )
        .then(
            () => {

                if (!transition.isCanceled)
                {
                    if (origScope)
                    {
                        if (viewModel.isDirty)
                        {
                            viewModel.submit();
                        }
                        access.scope = origScope;
                    }

                    const { context } = transition;
                    if (context)
                    {
                        currentProcess.currentObject = context;
                    }

                    return transition.target
                }
            }
        )
        .catch(
            err => {
                if (origScope)
                {
                    access.scope = origScope;
                }
                console.error("ERROR IN TRANSITION", err);
            }
        );
}


function noViewState()
{
    return (
        <div className="container">
            <div className="row">
                <div className="col">
                    <div className="alert alert-secondary">
                        <h3>
                            {
                                i18n("View State Gone")
                            }
                        </h3>
                        <hr/>
                        <p className="text-muted">
                            {
                                i18n("View State Gone Desc")
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}


export function onHistoryAction(location, action)
{
    const {state} = location;
    if (action === "POP")
    {
        if (state)
        {
            //console.log("POP", state);

            const { navigationId } = state;
            const entry = navigationHistory[navigationId];

            if (!entry)
            {
                render(
                    noViewState()
                )
            }

            const { processId, currentState, currentObject } = entry;

            currentProcess = processes[processId];
            currentProcess.currentObject = currentObject;

            currentProcess[secret].currentState = currentState;

            render(
                renderViewState()
            )
        }
        // else
        // {
        //     console.log("POP no state");
        // }
    }
}


function getObjectInfo(obj)
{
    if (!obj)
    {
        return "";
    }

    return encodeURIComponent(obj.number || obj.name || obj.id);
}


function pushProcessState(replace = false)
{
    const { id, currentState } = currentProcess[secret];

    const { currentObject } = currentProcess;

    const navigationId = navigationHistory.length;

    navigationHistory.push({
        processId: id,
        currentState: toJS(currentState),
        currentObject: toJS(currentObject)
    });

    const op = replace ? "replace" : "push";

    //console.log("pushProcessState", op);

    config.history[op](
        uri("/{appName}/{processName}/{stateName}/{info}",
            {
                appName: config.appName,
                processName: currentProcess.name,
                stateName: currentState,
                info: getObjectInfo(currentObject)
            }, true), {
            navigationId
        });
}


/**
 * Internal process render start function
 *
 * @param {String} processName      process name
 * @param {object} input            input map
 * @param {object} injections       injections maps
 * @param {boolean} asSubProcess    launch process as sub-process
 * @return {{Promise<ReactElement>}}
 */
function renderProcessInternal(processName, input, injections, asSubProcess)
{
    let process;
    let access;

    const entry = processDefinitions[processName];
    if (!entry)
    {
        throw new Error("Could not find process '" + processName + "'");
    }
    //console.log("PROCESS-ENTRY", entry);

    const { initProcess, ScopeClass } = entry;

    let scope;
    if (ScopeClass)
    {
        scope = new ScopeClass();
        inject(scope, injections);
    }
    else
    {
        scope = null;
    }

    const noPriorProcess = !currentProcess;
    if (noPriorProcess)
    {
        if (asSubProcess)
        {
            throw new Error("Cannot launch sub-process without root process");
        }
        config.rootProcess = processName;
    }

    const processesLen = processes.length;
    let newProcessId = 0;
    if (!noPriorProcess)
    {
        newProcessId = currentProcess[secret].id + 1;
        if (newProcessId < processesLen)
        {
            // if we are inserting below the maximum available
            processes = processes.slice(0, newProcessId);
        }
    }

    process = new Process(newProcessId, entry.definition, scope, input, asSubProcess ? currentProcess : null);
    processes.push(process);

    access = process[secret];

    return Promise.resolve(
        initProcess(process, scope)
    )
        .then(
            ({ startState, states }) => {

                access.states = states;

                access.initialized = true;

                currentProcess = process;

                if (typeof startState === "function")
                {
                    const startTransitionName = process.name + ".start";
                    return executeTransition(
                        startTransitionName,
                        action(
                            startTransitionName,
                            startState
                        )
                    );
                }
                else
                {
                    return String(startState)
                }
            }
        )
        .then(
            currentState => {

                if (!currentState)
                {
                    throw new Error("No initial state");
                }
                access.currentState = currentState;

                pushProcessState(noPriorProcess);

                return renderViewState();
            }
        )
        .catch(err => console.error("ERROR IN START PROCESS", err))
}


/**
 * Starts a new root process and renders the first React element tree.
 * The states of the old root process remain in-memory for the user to navigate back.
 *
 * @param {String} processName      process name
 * @param {object} input            input data
 * @param {object} injections       injections for the process
 *
 * @return {Promise<ReactElement>}   rendered elements of the first view.
 */
export function renderProcess(processName, input, injections)
{
    return renderProcessInternal(processName, input, injections, false)
}


/**
 * Starts the process with the given name as sub-process and renders the first React element tree.
 * Ending the subprocess will resume the parent process
 *
 * @param {String} processName      name of process to start as sub-process
 * @param {object} input            input data
 * @param {object} injections                injections for the sub-process
 *
 * @return {Promise<ReactElement>}   rendered elements of the first view.
 */
export function renderSubProcess(processName, input, injections)
{
    return renderProcessInternal(processName, input, injections, true)
}


