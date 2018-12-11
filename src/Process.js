import React from "react";
import { createViewModel } from "mobx-utils";
import render from "./render";
import { action, get, keys, set } from "mobx";

import GraphQLQuery from "./GraphQLQuery";
import { FormConfigProvider, WireFormat } from "domainql-form";
import config from "./config";
import Transition from "./Transition";
import uri from "./uri";
import i18n from "./i18n";
import Dialog from "./Dialog";
import { getWireFormat } from "./domain";

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
    const { layout } = process.options;

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


function findRootProcess(process)
{
    while (process && process[secret].options.asDialog)
    {
        process = process[secret].parent;
    }
    return process;
}


function findViewComponent(rootProcess)
{
    // directly access secret process data
    const { definition, currentState } = rootProcess[secret];

    //console.log({ definition, currentState });

    const ViewComponent = definition.components[currentState];
    if (!ViewComponent)
    {
        throw new Error("No component '" + currentState + "' in process '" + rootProcess.name)
    }

    return ViewComponent;
}


function createEnv(process)
{
    return {
        processName: process && process.name,
        config: config,
        state: process && process[secret].currentState,
        scope: process && process.scope,
        process: process
    };
}


function renderCurrentView()
{
    const rootProcess = findRootProcess(currentProcess);

    const ViewComponent = findViewComponent(rootProcess);
    const Layout = getLayout(rootProcess, rootProcess[secret].currentState);

    const env = createEnv(rootProcess);

    let dialogStack = false;

    let process = currentProcess;

    while (process !== rootProcess)
    {
        const subProcessEnv = createEnv(process);
        const SubProcessViewComponent = findViewComponent(process);

        dialogStack = (
            <Dialog process={ process }>
                <AutomatonEnv.Provider
                    value={ subProcessEnv }
                >
                    <SubProcessViewComponent env={ subProcessEnv }/>
                    {
                        dialogStack
                    }
                </AutomatonEnv.Provider>
            </Dialog>
        );

        process = process[secret].parent;
    }

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
                    {
                        ViewComponent && (
                            <ViewComponent
                                env={ env }
                            />
                        )
                    }
                </Layout>
                {
                    dialogStack
                }
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

function ensureNotInitialized(process)
{
    if (process[secret].initialized)
    {
        throw new Error("Process is already initialized");
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

const PROCESS_DEFAULT_OPTIONS = {

    /**
     * {React.Element|Object<React.Element>} layout component or map of layout components.
     *
     * If element, that element is used as layout for the process.
     *
     * If it is a map object, the view name will be used to look up the layout. If layout
     * is registered for the view name, the `"default"` key is used. If neither is set,
     * the global default layout used ( see config.js)
     *
     */
    layout: null,

    /**
     * {boolean} true to open a sub-process as dialog
     */
    asDialog: true,

    /**
     * If `true` force the process to be used as a sub-process. Throw an error if it is used as root process.
     */
    forceSubProcess: false
};

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

            options: {
                ... PROCESS_DEFAULT_OPTIONS,
                asDialog:  parent ? config.subProcessAsDialog : false
            },

            subProcessPromise: null,

            initialized: false
        };

        //console.log("PROCESS '" + name +"'", this);
    }

    get name()
    {
        return this[secret].name;
    }

    get currentState()
    {
        return this[secret].currentState;
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


    get options()
    {
        return this[secret].options;
    }


    /**
     * Merges the given object into the options object.
     *
     * @param {Object} newOpts   new options
     */
    set options(newOpts)
    {
        ensureNotInitialized(this);

        if (!newOpts || typeof newOpts !== "object")
        {
            throw new Error("newOpts must be an map object");
        }

        this[secret].options = {
            ... this[secret].options,
            newOpts
        };
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


    /**
     * Returns the composite component with the given name.
     *
     * @param name      composite name
     * @return {?React.Element} composite component or null
     */
    getComponent(name)
    {
        const component = this[secret].components[name];
        if (!component)
        {
            throw new Error("Could not find component '" + name + "'");
        }
        return component || null;
    }


    /**
     * Executes the transition with the given name.
     *
     * @param name          transition name
     * @param context       transition context object
     * @return {Promise<any | never>}
     */
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

        //console.log("TRANSITION", transition);

        const { confirmation } = transition;

        if (confirmation)
        {
            const message = confirmation(context);

            if (message && !confirm(message))
            {
                return Promise.resolve(null);
            }
        }
        
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
                        renderCurrentView()
                    )
                })
        );
    }


    /**
     * Returns the transition with the given name from the current state map
     * 
     * @return {Object} transition entry or null if there is no such transition
     */
    getTransition(name)
    {
        const access = this[secret];

        //console.log("getTransition", access.currentState, access.states);

        return access.states[access.currentState][name] || null;
    }


    back()
    {
        // TODO: implement
    }


    /**
     * Runs the process with the given name as sub-process.
     *
     * @param {String} processName     process name
     * @param {Object} [input]         input object for the sub-process
     *
     * @return {Promise<any>} resolves to the sub-process result or is rejected when the sub-process is aborted.
     */
    runSubProcess(processName, input)
    {
        // create new promise that will resolve when the sub-process ends
        return new Promise(
            (resolve, reject) => fetchProcessInjections(config.appName, processName, input)
                .then(injections => {

                    //console.log("INJECTIONS", injections);

                    return (
                        renderSubProcess(processName, input, injections.injections)
                    );
                }, err => <ErrorView title="Error starting Process" info={ err } />)
                .then(element => {

                    //console.log("RENDER SUB-PROCESS VIEW", elem);

                    // store for subProcessPromiseFns
                    const access = currentProcess[secret];
                    access.subProcessPromise = {
                        resolve,
                        reject
                    };

                    return render(element);
                })
        )
        .then(result => {

            pushProcessState();

            return render(
                renderCurrentView()
            )
            // make sure to resolve the sub-process result only after the parent view is restored.
            .then( () => result);
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


function getFieldTypeByName(fields, gqlMethod)
{
    for (let i = 0; i < fields.length; i++)
    {
        const field = fields[i];
        if (field.name === gqlMethod)
        {
            return field.type;
        }
    }
    return null;
}


export function getGraphQLMethodType(gqlMethod)
{
    if (!gqlMethod)
    {
        throw new Error("Need gqlMethod");
    }

    const queryType = config.inputSchema.getType("QueryType");

    const queryFieldType = getFieldTypeByName(queryType.fields, gqlMethod);
    if (queryFieldType)
    {
        return queryFieldType;
    }
    
    const mutationType = config.inputSchema.getType("MutationType");

    const mutationFieldType = getFieldTypeByName(mutationType.fields, gqlMethod);
    if (mutationFieldType)
    {
        return mutationFieldType;
    }

    throw new Error("Could not find type of GraphQL method '" + gqlMethod + "'");
}


function inject(scope, injections)
{
    //console.log("INJECTIONS", injections);

    const scopeKeys = keys(scope);

    for (let i = 0; i < scopeKeys.length; i++)
    {
        const name = scopeKeys[i];

        const prop = get(scope, name);
        if (prop instanceof GraphQLQuery)
        {
            const result = injections[prop.query];
            if (result === undefined)
            {
                throw new Error("Could not find query for prop '" + name + "'");
            }

            const names = Object.keys(result);
            if (names.length !== 1)
            {
                throw new Error("Injection result must have exactly one key: has " + names.join(", "))
            }
            const [ gqlMethod ] = names;

            const type = getGraphQLMethodType(gqlMethod);

            const injectionValue = result[gqlMethod];
            //console.log("inject", name, "with", gqlMethod, injectionValue, "type = ", JSON.stringify(type));

            try
            {
                const converted = getWireFormat().convert(type, injectionValue, true);

                //console.log("SCOPE:" + name , "=", converted);

                set(scope, name, converted);
            }
            catch(e)
            {
                const msg = "Error converting '" + name + "'";
                console.error(msg, e);
                throw new Error(msg + " = " + JSON.stringify(injectionValue) + ": " + e);
            }
        }
    }
}

export function fetchProcessInjections(appName, processName, input = {})
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
            body: JSON.stringify(input)
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
        .catch(err => {
            console.error("ERROR FETCHING PROCESS INJECTIONS", err)

            return Promise.reject(err);
        });
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
    //console.log("executeTransition", {name, actionFn, target, context});

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
                //console.log("EXECUTE MOB-X TRANSITION", mobxAction, transition);

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


export function ErrorView(props)
{
    const {title, info} = props;

    const Layout = config.layout;

    return (
        <Layout env={ createEnv(null) }>
            <div className="row">
                <div className="col">
                    <div className="alert alert-secondary">
                        <h3>
                            {
                                title
                            }
                        </h3>
                        <hr/>
                        <p className="text-muted">
                            {
                                info
                            }
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    )

}

function noViewState()
{
    return (
        <ErrorView
            title={ i18n("View State Gone") }
            info={ i18n("View State Gone Desc") }
        />
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

            const { processId, currentState } = entry;

            currentProcess = processes[processId];

            currentProcess[secret].currentState = currentState;

            render(
                renderCurrentView()
            )
        }
        // else
        // {
        //     console.log("POP no state");
        // }
    }
}


function getURIInfo(obj)
{
    /// XXX: info?
    return "";
}


function pushProcessState(replace = false)
{
    const { id, currentState } = currentProcess[secret];

    const navigationId = navigationHistory.length;

    navigationHistory.push({
        processId: id,
        currentState
    });

    const op = replace ? "replace" : "push";

    //console.log("pushProcessState", op);

    config.history[op](
        uri("/{appName}/{processName}/{stateName}/{info}",
            {
                appName: config.appName,
                processName: currentProcess.name,
                stateName: currentState,
                info: getURIInfo()
            }, true), {
            navigationId
        });
}


function finishInitialization(process)
{
    //console.log("finishInitialization", process.name);

    const access = process[secret];
    const { options } = access;

    const keys = Object.keys(options);

    for (let i = 0; i < keys.length; i++)
    {
        if (!PROCESS_DEFAULT_OPTIONS.hasOwnProperty(keys[i]))
        {
            throw new Error("'" + process.name + ": '" + name + "' is not a valid process option");
        }
    }

    access.options = Object.freeze(options);
    access.initialized = true;
}


/**
 * Internal process render start function
 *
 * @param {String} processName      process name
 * @param {object} input            input map
 * @param {object} injections       injections maps
 * @param {boolean} asSubProcess    launch process as sub-process
 * @return {Promise<React.Element>}
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

                if (process.options.forceSubProcess && !asSubProcess)
                {
                    throw new Error("Process '" + process.name + "' must be run as sub-process");
                }

                access.states = states;

                finishInitialization(process);

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

                return renderCurrentView();
            }
        )
        .catch(err => {
            console.error("ERROR IN START PROCESS", err)
            return (
                <ErrorView
                    title={ i18n("Process Startup Error ") }
                    info={ String(err) }
                />
            );
        })
}

/**
 * Starts a new root process and renders the first React element tree.
 * The states of the old root process remain in-memory for the user to navigate back.
 *
 * @param {String} processName      process name
 * @param {object} input            input data
 * @param {object} injections       injections for the process
 *
 * @return {Promise<React.Element>}   rendered elements of the first view.
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
 * @return {Promise<React.Element>}   rendered elements of the first view.
 */
export function renderSubProcess(processName, input, injections)
{
    return renderProcessInternal(processName, input, injections, true)
}

export function getCurrentProcess()
{
    return currentProcess;
}


