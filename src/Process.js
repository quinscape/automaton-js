import React from "react";
import render from "./render";
import { action, get, keys, set } from "mobx";

import GraphQLQuery from "./GraphQLQuery";
import { FormConfigProvider } from "domainql-form";
import config from "./config";
import Transition from "./Transition";
import uri from "./uri";
import i18n from "./i18n";
import ProcessDialog from "./ProcessDialog";
import { getWireFormat } from "./domain";
import ProcessHistory from "./ProcessHistory";
import matchPath from "./matchPath";


const secret = Symbol("ProcessSecret");

export const AutomatonEnv = React.createContext({
    "_": "default context"
});

let currentProcess = null;
let processes = [];

let processHistory = [];
let currentHistoryPos = -1;

let processIdCounter = 0;

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
        if (typeof layout !== "function" && currentState)
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

function getParents(process)
{
    const parents = [];
    do
    {
        parents.push(process);
        process = process[secret].parent;
    } while (process);
    return parents.reverse();
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
            <ProcessDialog process={ process }>
                <AutomatonEnv.Provider
                    value={ subProcessEnv }
                >
                    <SubProcessViewComponent env={ subProcessEnv }/>
                    {
                        dialogStack
                    }
                </AutomatonEnv.Provider>
            </ProcessDialog>
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
 * @param {Process} process       process instance
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
 * Default versioning strategy which versions all fields whose name starts with "current"
 *
 * @param name          property name
 * @return {boolean}  true if versioned
 */
function versionCurrent(name)
{
    return name.indexOf("current") === 0
}

let prevProcess;
let prevState;
let prevInputs;


function findProcess(process)
{
    let current = currentProcess;
    while (current)
    {
        if (current === process)
        {
            return true;
        }
        current = current[secret].parent;
    }
    return false;
}




/**
 *
 * @param {Process} process                 process
 * @param {String} view                     view or "" for process effect
 * @param {Object} effect                   effect object
 * @param {function} effect.register        effect register function
 * @param {function} effect.unregister      effect unregister function
 * @param {function} effect.lastInput       result of last input evaluation
 */
function addEffect(process, view, effect)
{

    const { effects } = process[secret];


    let array = effects.get(view);
    if (!array)
    {
        array = [ effect ];
        effects.set(view, array);
    }
    else
    {
        array.push(effect);
    }

}


/**
 * Compares the elements of two arrays with instance equality.
 *
 * @param {Array<*>} arrayA     Array a
 * @param {Array<*>} arrayB     Array b
 * @returns {boolean} true if the arrays are the same lengths and all elements are equal
 */
function isArrayEqual(arrayA, arrayB)
{
    console.log("isArrayEqual", arrayA, arrayB);


    if (arrayA.length !== arrayB.length)
    {
        return false;
    }

    for (let i = 0; i < arrayA.length; i++)
    {
        if (arrayA[i] !== arrayB[i])
        {
            return false;
        }
    }
    return true;
}


const checkInputValue = __DEV && ((input) =>
{
    if (!Array.isArray(input))
    {
        throw new Error(`Effect error in ${process.name}.${nextState}: Input function must return array`);
    }
});


function updateEffects(process, prevState, nextState)
{
    if (!prevState && !nextState)
    {
        throw new Error("One of prev state or next state must be given");
    }

    if (prevState === nextState)
    {
        const effects = process[secret].effects.get(prevState);
        if (effects)
        {
            for (let i = 0; i < effects.length; i++)
            {
                const effect = effects[i];
                const { inputFn, lastInput } = effect;

                if (inputFn)
                {
                    const input = inputFn();

                    if (__DEV)
                    {
                        checkInputValue(input);
                    }

                    if (!isArrayEqual(input, lastInput))
                    {
                        cancelEffect(effect);
                        runEffect(effect, input);
                    }
                }
            }
        }
    }
    else
    {
        if (prevState)
        {
            const effects = process[secret].effects.get(prevState);
            if (effects)
            {
                for (let i = 0; i < effects.length; i++)
                {
                    cancelEffect(effects[i]);
                }
            }
        }

        if (nextState)
        {
            const effects = process[secret].effects.get(nextState);
            if (effects)
            {
                for (let i = 0; i < effects.length; i++)
                {
                    runEffect(effects[i]);
                }
            }
        }
    }
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

            options: {
                ... PROCESS_DEFAULT_OPTIONS,
                asDialog:  parent ? config.subProcessAsDialog : false
            },

            subProcessPromise: null,

            versioningStrategy: versionCurrent,
            history: null,

            initialized: false,
            effects: new Map(),

            cleanup: () => {
                // clean up history
                this[secret].history.dispose();
                this[secret].history = null;
            }
        };

        this[secret].history = new ProcessHistory(this);

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

    get versioningStrategy()
    {
        return this[secret].versioningStrategy;
    }

    set versioningStrategy(strategy)
    {
        if (typeof strategy !== "function")
        {
            throw new Error("Invalid strategy: " + strategy);
        }

        this[secret].versioningStrategy = strategy;
    }

    get input()
    {
        return this[secret].input;
    }

    get isSubProcess()
    {
        return !!this[secret].parent;
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
     * @param {String} name     transition name
     * @param {*} context       context object
     * @param {String} button   button name
     * @return {Promise<any | never>}
     */
    transition(name, context, button)
    {
        //console.log("process.transition" , name, context);

        ensureInitialized(this);

        const storage = this[secret];

        const currentState = storage.currentState;
        const transition = storage.states[currentState][name];
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
                executeTransition(name, transition.action, transition.to, context, button)
            )
                .then(transition => {

                    //console.log("TRANSITION END", "transition = ", transition);

                    const { historyIndex } = transition;
                    if (historyIndex >= 0)
                    {
                        //console.log("RESTORE HISTORY", historyIndex);
                        const oldIndex = currentHistoryPos;
                        currentHistoryPos = historyIndex;

                        config.history.go(currentHistoryPos - oldIndex);
                        return false;
                    }
                    else
                    {
                        // --> transition

                        const { target, isRecorded } = transition;

                        const prevState = storage.currentState;

                        const nextState = target || prevState;
                        if (prevState !== nextState)
                        {
                            storage.currentState = nextState;
                        }
                        updateEffects(this, prevState, nextState);

                        if (isRecorded)
                        {
                            pushProcessState();

                            console.log(this.name, ": Changes after transition to  -> ", nextState, this[secret].history.changes)
                        }
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
        const storage = this[secret];

        //console.log("getTransition", storage.currentState, storage.states);

        return storage.states[storage.currentState][name] || null;
    }

    addProcessEffect(fn)
    {
        addEffect(this, "",{
            register: fn,
            unregister: null
        });
    }

    /**
     * Adds an effect to the process
     *
     * @param {String} view       view in which the effect is active (can be left out)
     * @param {function} fn         register function of the view. Can return an unregister function to clean up the effect.
     *
     * @param {Array<*>} inputFn    array of inputs for the effect
     */
    addEffect(view, fn, inputFn)
    {
        addEffect(this, view, {
            register: fn,
            inputFn,
            unregister: null,
            lastInput: null
        });
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
                .then(
                    injections => {

                        //console.log("INJECTIONS", injections);

                        return (
                            renderSubProcess(processName, input, injections.injections)
                        );
                    },
                        err => <ErrorView title="Error starting Process" info={ err } />
                )
                .then(element => {

                    //console.log("RENDER SUB-PROCESS VIEW", elem);

                    // store for subProcessPromiseFns
                    const storage = currentProcess[secret];
                    storage.subProcessPromise = {
                        resolve,
                        reject
                    };

                    return render(element);
                })
            )
            .then(output => {

                pushProcessState();

                return render(
                    renderCurrentView()
                )
                // make sure to resolve the sub-process result only after the parent view is restored.
                .then( () => output);

            })
            .catch(err => console.error("ERROR IN SUB-PROCESS", err))
    }


    /**
     * Ends the sub-process successfully and returns the given output object
     * @param {*} [output]      sub-process output object
     */
    endSubProcess(output)
    {
        unregisterProcessEffects(this);
        updateEffects(this, this[secret].currentState, null);

        const fns = subProcessPromiseFns(this);
        const storage = this[secret];

        currentProcess = storage.parent;

        // XXX: can't clean up, might be reactivated by history navigation
        //storage.cleanup();

        fns.resolve(output);
    }


    /**
     * Aborts the sub-process with an error object
     *
     * @param {*} [err]     error object
     */
    abortSubProcess(err)
    {
        unregisterProcessEffects(this);
        updateEffects(this, this[secret].currentState, null);

        const fns = subProcessPromiseFns(this);
        const storage = this[secret];

        currentProcess = storage.parent;

        // XXX: can't clean up, might be reactivated by history navigation
        //storage.cleanup();

        fns.reject(err);
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

        const graphQlQuery = get(scope, name);
        if (graphQlQuery instanceof GraphQLQuery)
        {
            const { methods, aliases } = graphQlQuery.getQueryDefinition();

            const result = injections[graphQlQuery.query];
            if (result === undefined)
            {
                debugger;

                throw new Error("Could not find query for prop '" + name + "'");
            }

            if (methods.length !== 1)
            {
                throw new Error("Injection result must have exactly one key: has " + methods.join(", "))
            }

            const [ methodName ] = methods;

            const type = getGraphQLMethodType(methodName);

            const alias = aliases && aliases[methodName];
            const injectionValue = result[alias ? alias : methodName];

            //console.log("inject", name, "with", methodName, injectionValue, "type = ", JSON.stringify(type));

            try
            {
                const converted = getWireFormat().convert(type, injectionValue, true, aliases, methodName);

                if (typeof converted === "object" && !Array.isArray(converted))
                {
                    //console.log("SET QUERY", converted, JSON.stringify(type), graphQlQuery);

                    converted._query = graphQlQuery;
                }

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
 * Wraps the given action function in a mobx action once or returns a previously wrapped mobx action
 *
 * @param {Object} storage      process storage
 * @param {String} name         action name
 * @param {Function} actionFn   action function
 *
 * @return mobx action
 */

function prepareMobXAction(storage, name, actionFn)
{
    const mobXActionKey = "mobxAction-" + name;

    let mobxAction = storage[mobXActionKey];
    if (!mobxAction)
    {
        mobxAction = action(
            currentProcess.name + "." + name,
            actionFn
        );
        storage[mobXActionKey] = mobxAction;
    }
    return mobxAction;
}

/**
 * Executes the given transition action function
 *
 * @param {String} name                     Transition name
 * @param {Function} [actionFn]             Transition action function
 * @param {String} [target]                 transition target
 * @param {object} [context]                domain object context
 * @param {String} [button]                 button name                    
 * @return {Promise<Transition| never>}     Resolves to the transition object
 */
function executeTransition(name, actionFn, target, context, button)
{
    //console.log("executeTransition", {name, actionFn, target, context});

    const storage = currentProcess[secret];

    const sourceState = storage.currentState;

    const transition = new Transition(
        currentProcess,
        sourceState,
        target,
        context,
        processHistory,
        currentHistoryPos,
        button
    );

    const mobxAction = actionFn && prepareMobXAction(storage, sourceState + "." + name, actionFn);

    const { history } = storage;

    history.resetChanged();

    return new Promise(
        (resolve, reject) => {
            try
            {
                //console.log("EXECUTE MOB-X TRANSITION", mobxAction, transition);

                // make sure to resolve a potential promise return from the transition before ending the transition
                resolve(
                    mobxAction && mobxAction(transition)
                );
            }
            catch (e)
            {
                reject(e);
            }
        })
        .then(
            () => {

                const { target, isRecorded } = transition;

                // if isRecorded hasn't been explicitly defined
                if (isRecorded === null)
                {
                    // record the transition if
                    transition.isRecorded = (
                        // the state changed
                        target !== sourceState ||
                        // .. or if the history recorded changes in regards to our versioned props
                        history.versionedPropsChanged
                    );
                }

                return (
                    transition
                )
            },
            err => {
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


function findHistoryEntry(navigationId)
{
    const { length } = processHistory;
    for (let i = 0; i < length; i++)
    {
        const entry = processHistory[i];
        if (entry.id === navigationId)
        {
            return entry;
        }
    }
    return null;
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


            const entry = findHistoryEntry(navigationId);

            if (!entry)
            {
                render(
                    noViewState()
                )
            }

            currentHistoryPos = navigationId;

            // noinspection JSIgnoredPromiseFromCall
            renderRestoredView(entry);
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

function findProcessBase(processA, processB)
{
    const parentsA = getParents(processA);
    const parentsB = getParents(processB);

    const len = Math.min(parentsA.length, parentsB.length);

    let pos = -1;
    do
    {
        pos++;
    } while (pos < len && parentsA[pos] === parentsB[pos]);


    return pos > 0 ? parentsA[pos - 1] : null;
}


/**
 * Renders a restored view from a history entry.
 *
 * First it applies the versioned props to the process then it makes that process the current process
 * and renders the current view, all in one mobx transaction. ( This prevents stale view components complaining
 * about new data etc. )
 *
 */
const renderRestoredView = action(
    "renderRestoredView",
    (historyEntry) => {

        const { processId, state: nextState, historyPos } = historyEntry;

        //console.log("renderRestoredView", { processId, state, historyPos });

        const prevProcess = currentProcess;
        const nextProcess = processes[processId];
        const prevState = prevProcess[secret].currentState;
        if (prevProcess !== nextProcess)
        {
            const processBase = findProcessBase(currentProcess, nextProcess);

            console.log("PROCESS BASE", processBase);

            let process = currentProcess;
            while (process && process !== processBase)
            {
                unregisterProcessEffects(process);
                updateEffects(process, prevState, null);
                process = process[secret].parent;
            }

            currentProcess = nextProcess;
            process = nextProcess[secret].parent;
            while (process)
            {
                registerProcessEffects(process);
                updateEffects(currentProcess, null, process[secret].currentState);
                process = process[secret].parent;

            }

            currentProcess[secret].history.navigateTo(historyPos);

            updateEffects(currentProcess, null, nextState);
        }
        else
        {
            currentProcess[secret].history.navigateTo(historyPos);

            updateEffects(currentProcess, prevState, nextState);
        }


        currentProcess[secret].currentState = nextState;

        return render(
            renderCurrentView()
        );
    }
);


function findReachableProcesses(start)
{
    const reachable = new Set();
    const { length } = processHistory;
    for (let i = start ; i < length ; i++)
    {
        const { processId } = processHistory[i];
        let process = processes[processId];
        while (process)
        {
            reachable.add(process[secret].id);
            process = process[secret].parent;
        }
    }
    return reachable;
}


function pushProcessState(replace = false)
{
    const { id, currentState, history } = currentProcess[secret];

    //console.log("pushProcessState", {id, currentState});

    const navigationId = ++currentHistoryPos;

    if (navigationId < processHistory.length)
    {
        //console.log("Prune history");
        processHistory = processHistory.slice(0, navigationId);
    }

    //const versionedProps = getVersionedProps(currentProcess);
    processHistory.push({
        id: navigationId,
        processId: id,
        state: currentState,
        historyPos: history.pos
    });

    const { navigationHistoryLimit } = config;

    const { length } = processHistory;

    if (length > navigationHistoryLimit)
    {
//        console.log("SHRINK", processHistory.map( e => e.processId));

        const newStart = length - navigationHistoryLimit;
        const reachableProcesses = findReachableProcesses(newStart);

        for (let i=0; i < newStart; i++)
        {
            const { processId } = processHistory[i];

            const isReachable = reachableProcesses.has(processId);
            if (!isReachable)
            {
                const process = processes[processId];

                console.log(`Unregistering effects on unreachable process #${processId}: `, process);

                unregisterProcessEffects(process);
                updateEffects(process, process.currentState, null);
            }
            // else
            // {
            //     console.log("Process #", processId, " is still reachable")
            // }
        }
        processHistory = processHistory.slice(newStart);
    }


    const op = replace ? "replace" : "push";

    //console.log("pushProcessState", op);

    config.history[op](
        uri(
            "/{appName}/{processName}/{stateName}/{info}",
            {
                appName: config.appName,
                processName: currentProcess.name,
                stateName: currentState,
                info: getURIInfo()
            }, true
        ), {
            navigationId
        }
    );
}


function finishInitialization(process)
{
    //console.log("finishInitialization", process.name);

    const storage = process[secret];
    const { options } = storage;

    const keys = Object.keys(options);

    for (let i = 0; i < keys.length; i++)
    {
        if (!PROCESS_DEFAULT_OPTIONS.hasOwnProperty(keys[i]))
        {
            throw new Error("'" + process.name + ": '" + name + "' is not a valid process option");
        }
    }

    storage.options = Object.freeze(options);
    storage.initialized = true;
}


function runEffect(effect, input = null)
{
    const { register, inputFn } = effect;

    if (inputFn)
    {
        if (!input)
        {
            input = inputFn();
            if (__DEV)
            {
                checkInputValue(input);
            }
        }
        effect.lastInput = input;
    }

    const unregister = register();
    if (typeof unregister === "function")
    {
        effect.unregister = unregister;
    }
}

function cancelEffect(effect)
{
    const { unregister } = effect;
    unregister && unregister();
    effect.unregister = null;
}

function registerProcessEffects(process)
{
    const { effects } = process[secret];

    const processEffects = effects.get("");

    if (processEffects)
    {
        for (let i = 0; i < processEffects.length; i++)
        {
            runEffect(processEffects[i]);
        }
    }
}



function unregisterProcessEffects(process)
{

    const { effects } = process[secret];

    const processEffects = effects.get("");

    if (processEffects)
    {
        for (let i = 0; i < processEffects.length; i++)
        {
            cancelEffect(processEffects[i]);
        }
    }
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

    const prevProcess = currentProcess;
    const noPriorProcess = !prevProcess;
    if (noPriorProcess)
    {
        if (asSubProcess)
        {
            throw new Error("Cannot launch sub-process without root process");
        }
        config.rootProcess = processName;
    }

    process = new Process(
        processIdCounter++,
        entry.definition,
        scope,
        input,
        asSubProcess ? currentProcess : null
    );
    processes.push(process);

    const storage = process[secret];

    return Promise.resolve(
        initProcess(process, scope)
    )
        .then(
            ({ startState, states }) => {

                if (process.options.forceSubProcess && !asSubProcess)
                {
                    throw new Error("Process '" + process.name + "' must be run as sub-process");
                }

                storage.states = states;

                finishInitialization(process);
                currentProcess = process;

                const startTransitionName = process.name + ".start";
                if (typeof startState === "function")
                {
                    return executeTransition(startTransitionName, startState, null, null, null);
                }
                else
                {
                    return executeTransition(startTransitionName, null, startState, null, null);
                }
            }
        )
        .then(
            transition => {

                //console.log("START TRANSITION", transition);

                const { target } = transition;

                if (!target)
                {
                    throw new Error("No initial state");
                }

                if (prevProcess && !asSubProcess)
                {
                    let process = prevProcess;
                    do
                    {
                        unregisterProcessEffects(process);
                        updateEffects(process, process.currentState, null);

                        process = process[secret].parent;
                    } while (process);
                }
                registerProcessEffects(currentProcess);

                storage.currentState = target;

                updateEffects(process, null, storage.currentState);

                pushProcessState(noPriorProcess);

                return renderCurrentView();
            },
            err => {

            console.error("ERROR IN START PROCESS", err);

            return (
                <ErrorView
                    title={ i18n("Process Startup Error ") }
                    info={ String(err) }
                />
            );
        }
    )
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


