import React, { useContext } from "react";
import render from "../render";
import { action, get, keys, set } from "mobx";

import GraphQLQuery from "../GraphQLQuery";
import { FormConfigProvider } from "domainql-form";
import config from "../config";
import Transition from "./Transition";
import uri from "../uri";
import i18n from "../i18n";
import ProcessDialog from "./ProcessDialog";
import { getWireFormat } from "../domain";
import ProcessHistory from "./ProcessHistory";
import { renderImperativeDialogs } from "../ui/Dialog"
import { backToHistoryId } from "./back-functions";

import ShortcutContext, { ShortcutContextState } from "../ui/shortcut/ShortcutContext";
import StickySizesContext from "../ui/sticky/StickySizesContext";
import WorkingSet from "../WorkingSet"
import { getGraphQLMethodType } from "../util/type-utils"
import Throbber from "../ui/throbber/Throbber";

let processImporter;

export function registerProcessImporter(factory)
{
    processImporter = factory;
}


const secret = Symbol("ProcessSecret");

export const AutomatonEnv = React.createContext({
    "_": "default context"
});

let currentProcess = null;
let processes = [];

let processHistory = [];
let currentHistoryPos = -1;
let historyCounter = -1;

let processIdCounter = 0;

function getLayout(process, currentState)
{
    const { layout } = process.options;

    if (layout)
    {
        // if layout is not a react component
        if (typeof layout !== "function" && currentState)
        {
            // use it as lookup map
            const component = layout[currentState.name];
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

    const rootState = rootProcess[secret].currentState;
    const ViewComponent = rootState.getViewStateComponent();
    const Layout = getLayout(rootProcess, rootState);

    const env = createEnv(rootProcess);

    let dialogStack = false;

    let process = currentProcess;

    while (process !== rootProcess)
    {
        const subProcessEnv = createEnv(process);
        const SubProcessViewComponent = process[secret].currentState.getViewStateComponent();

        dialogStack = (
            <ProcessDialog process={ process }>
                <AutomatonEnv.Provider
                    value={ subProcessEnv }
                >
                    <ShortcutContext.Provider
                        value={ process.shortcutContext }
                    >
                        <SubProcessViewComponent env={ subProcessEnv }/>
                        {
                            dialogStack
                        }
                    </ShortcutContext.Provider>
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
                <ShortcutContext.Provider
                    value={ rootProcess.shortcutContext }
                >
                    <Layout
                        env={ env }
                    >
                        {
                            ViewComponent && (
                                <ViewComponent
                                    key={ `processId-${process.id}` }
                                    env={ env }
                                />
                            )
                        }
                        <Throbber />
                    </Layout>
                </ShortcutContext.Provider>
                {
                    dialogStack
                }
                {
                    renderImperativeDialogs()
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
    forceSubProcess: false,

    dialog: {}
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

/**
 *
 * @param {Process} process                 process
 * @param {ViewState} view                  view state or null for process effect
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


function resetHistoryTo(historyIndex)
{
    const oldIndex = currentHistoryPos;
    currentHistoryPos = historyIndex;

    const delta = currentHistoryPos - oldIndex;

    config.logHistory && console.log("resetHistoryTo", currentHistoryPos, "go to", delta);
    config.logHistory && logHistory();

    config.history.go(delta);
}

export function findProcessScopeWithWorkingSet(process)
{
    let { scope } = process
    
    if (scope != null) {
        let current = process
        do
        {
            if (scope.workingSet instanceof WorkingSet)
            {
                return scope
            }
            else if (typeof scope.isDirty === "function")
            {
                return scope
            }
            current = current[secret].parent
    
        } while (current)
    }

    return null
}


/**
 * Process facade exposing a limited set of getters and methods as process API
 *
 * @category process
 *
 */
export class Process {
    constructor(id, name, input, parent, dialogOpts)
    {
        this[secret] = {
            id,
            name,
            input,
            parent,

            currentState: null,

            options: {
                ... PROCESS_DEFAULT_OPTIONS,
                asDialog:  parent ? config.subProcessAsDialog : false
            },

            dialogOpts: {
                ... config.processDialog,
                ... dialogOpts
            },

            subProcessPromise: null,

            versioningStrategy: versionCurrent,
            history: null,

            initialized: false,
            effects: new Map(),

            transitionMaps: new Map(),
            shortcutContext: new ShortcutContextState(),

            cleanup: () => {
                // clean up history
                this[secret].history.dispose();
                this[secret].history = null;
            }
        };

        this[secret].history = new ProcessHistory(this);

        //console.log("PROCESS '" + name +"'", this);
    }

    get id()
    {
        return this[secret].id;
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

    get scope()
    {
        return this[secret].scope;
    }


    get options()
    {
        return this[secret].options;
    }

    get dialogOptions()
    {
        return this[secret].dialogOpts;
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
    
    get shortcutContext()
    {
        return this[secret].shortcutContext;
    }

    /**
     * Returns true if this process or any of its parent processes are flagged dirty.
     *
     * @return {boolean}    true if dirty
     */
    get isDirty()
    {
        const scope = findProcessScopeWithWorkingSet(this)
        if (scope)
        {
            if (scope.workingSet)
            {
                if(scope.workingSet.hasChanges) {
                    return true
                }
            }
            else if (typeof scope.isDirty === "function")
            {
                return scope.isDirty()
            }
            else
            {
                throw new Error("Returned scope has neither workingSet nor isDirty function")
            }
        }
        return false
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

        const transition = this.getTransition(name);
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
                        resetHistoryTo(historyIndex);
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

                            //console.log(this.name, ": Changes after transition to  -> ", nextState, this[secret].history.changes)
                        }
                    }

                    return render(
                        renderCurrentView()
                    )
                },
                    err => console.error("ERROR IN TRANSITION '" + name + "'", err)
                )
        );
    }


    /**
     * Returns the transition with the given name from the current state map
     *
     * @return {Object} transition entry or null if there is no such transition
     */
    getTransition(name)
    {
        const { transitionMaps, currentState } = this[secret];

        const transition = (transitionMaps.get(currentState))[name];
        if (!transition)
        {
            throw new Error("No transition '" + name + "' in process " + this.name);
        }
        return transition;
    }

    addProcessEffect(fn)
    {
        addEffect(this, null,{
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
        if (!view)
        {
            throw new Error("Need view. To register an effect without a view, use addProcessEffect")
        }

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
     * @param {Object} [opts]                   process dialog options
     * @param {String|function} [opts.title]    Title for the subprocess modal or a function to produce the title from the subprocess name
     * @param {boolean} [opts.nukeOnExit]       true if the process states are to be removed from browser memory on exit
     *
     * @return {Promise<any>} resolves to the sub-process result or is rejected when the sub-process is aborted.
     */
    runSubProcess(processName, input, opts)
    {
        opts = {
            ... this[secret].dialogOpts,
            ... opts
        };

        //console.log("runSubProcess", opts);

        const historyId = this.getCurrentHistoryId();

        // create new promise that will resolve when the sub-process ends
        return new Promise(
            (resolve, reject) => fetchProcessInjections(config.appName, processName, input)
                .then(
                    injections => {

                        //console.log("INJECTIONS", injections);

                        return (
                            renderSubProcess(processName, input, injections.injections, opts)
                        );
                    },
                        err => <ErrorView title="Error starting Process" info={ err } />
                )
                .then(element => {

                    //console.log("RENDER SUB-PROCESS VIEW", elem);

                    currentProcess[secret].subProcessPromise = {
                        resolve,
                        reject
                    };

                    return render(element);
                })
            )
            .then(output => {

                const { nukeOnExit } = opts;
                const backIndex = findBackStateIndex( backToHistoryId(historyId));

                if (nukeOnExit)
                {
                    const { history } = this[secret];

                    const historyPos = history.getCurrentPos();

                    // to nuke all states of our sub process, we move one entry back further and replace that entry
                    // with the current state. This automatically prunes the forward states from the browser
                    resetHistoryTo(
                        backIndex - 1
                    );

                    // restore view props
                    history.navigateTo(historyPos);
                    pushProcessState();
                }
                else
                {
                    // without nuking, we just return to the original state
                    resetHistoryTo(backIndex);
                }
                return output;

            })
            .catch(err => console.error("ERROR IN SUB-PROCESS", err))
    }

    getCurrentHistoryId()
    {
        return processHistory[currentHistoryPos].id;
    }

    history()
    {
        return { processHistory, currentHistoryPos, historyCounter };
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
            const { methodCalls, aliases } = graphQlQuery.getQueryDefinition();

            const result = injections[graphQlQuery.query];
            if (result === undefined)
            {
                throw new Error("Could not find query for prop '" + name + "'");
            }

            if (methodCalls.length !== 1)
            {
                throw new Error("Injection result must have exactly one key: has " + methodCalls.join(", "))
            }

            const [ callName ] = methodCalls;

            const methodName = aliases ? aliases[callName] || callName : callName;

            const type = getGraphQLMethodType(methodName);

            const injectionValue = result[callName];

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
        const actionName = currentProcess.name + "." + name;
        mobxAction = action(
            actionName,
            actionFn
        );

        //console.log("WRAPPED ", actionName , "AS MOBX ACTION #", FormContext.getUniqueId(mobxAction));

        storage[mobXActionKey] = mobxAction;
    }
    return mobxAction;
}

/**
 * Executes the given transition action function
 *
 * @param {String} name                     Transition name
 * @param {Function} [actionFn]             Transition action function
 * @param {ViewState} [target]              transition target
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
        button
    );

    const mobxAction = actionFn && prepareMobXAction(storage, sourceState.name + "." + name, actionFn);

    const { history, transitionMaps } = storage;

    const historyPosBeforeTransition = history.getCurrentPos();

    return new Promise(
        (resolve, reject) => {
            try
            {
                //console.log("EXECUTE MOB-X TRANSITION", mobxAction, "#" + FormContext.getUniqueId(mobxAction), transition);

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

                const { target = sourceState, isRecorded } = transition;

                if (!transitionMaps.has(target))
                {
                    //console.log("CREATE TRANSITION MAP FOR", target.name);
                    transitionMaps.set(target, target.createTransitionMap(currentProcess))
                }

                // if isRecorded hasn't been explicitly defined
                if (isRecorded === null)
                {
                    // record the transition if
                    transition.isRecorded = (
                        // the state changed
                        target !== sourceState ||
                        // .. or if the history recorded changes in regards to our versioned props
                        history.getCurrentPos() !== historyPosBeforeTransition
                    );
                }

                return (
                    transition
                )
            },
            err => {
                return Promise.reject(err);
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


function findHistoryIndex(navigationId)
{
    const { length } = processHistory;
    for (let i = 0; i < length; i++)
    {
        const entry = processHistory[i];
        if (entry.id === navigationId)
        {
            return i;
        }
    }
    return -1;
}


export function onHistoryAction({ action, location })
{
    const { state } = location;
    if (action === "POP")
    {
        if (state)
        {
            //console.log("POP", state);

            const { navigationId } = state;

            const index = findHistoryIndex(navigationId);
            if (index < 0)
            {
                render(
                    noViewState()
                )
            }
            else
            {
                const entry = processHistory[index];
                currentHistoryPos = index;

                //console.log("POP: set currentHistoryPos = ", currentHistoryPos)

                // noinspection JSIgnoredPromiseFromCall
                renderRestoredView(entry);
            }
        }
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

        config.logHistory && console.log("renderRestoredView: processId = ", processId, ", nextState = ", nextState.name, ", historyPos = ", historyPos );

        const prevProcess = currentProcess;
        const nextProcess = processes[processId];
        const prevState = prevProcess[secret].currentState;
        if (prevProcess !== nextProcess)
        {
            const processBase = findProcessBase(currentProcess, nextProcess);

            //console.log("PROCESS BASE", processBase);

            let process = currentProcess;
            while (process && process !== processBase)
            {
                unregisterProcessEffects(process);
                updateEffects(process, prevState, null);
                process = process[secret].parent;
            }

            currentProcess = nextProcess;
            process = nextProcess[secret].parent;
            while (process && process !== processBase)
            {
                registerProcessEffects(process);
                updateEffects(currentProcess, null, process[secret].currentState);
                process = process[secret].parent;

            }

            currentProcess[secret].history.navigateTo(historyPos);
            registerProcessEffects(currentProcess);
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

function logHistory()
{
    console.log(`HISTORY (currentHistoryPos = ${currentHistoryPos} )`, processHistory.map(({ id, processId, state, historyPos }, idx) => {

        const msg = `id: ${id} processId: ${processId} state: ${state.name} historyPos: ${historyPos}`;


        return currentHistoryPos === idx ? "[[" + msg + "]]" : msg;
    }).join(" / "));
}


function pushProcessState(replace = false)
{
    const { id, currentState, history } = currentProcess[secret];


    const navigationId = ++historyCounter;
    //currentHistoryPos = navigationId;

    config.logHistory && console.log("pushProcessState: id = ", id);

    if (currentHistoryPos < processHistory.length - 1)
    {
        config.logHistory && console.log("pushProcessState: prune history")

        processHistory = processHistory.slice(0, currentHistoryPos + 1);

        config.logHistory && logHistory()
    }

    //const versionedProps = getVersionedProps(currentProcess);
    processHistory.push({
        id: navigationId,
        processId: id,
        state: currentState,
        historyPos: history.getCurrentPos()
    });
    currentHistoryPos++;

    const { navigationHistoryLimit } = config;

    const { length } = processHistory;

    if (length > navigationHistoryLimit)
    {
        config.logHistory && console.log("SHRINK", processHistory.map( e => e.processId));

        const newStart = length - navigationHistoryLimit;
        const reachableProcesses = findReachableProcesses(newStart);

        for (let i=0; i < newStart; i++)
        {
            const { processId } = processHistory[i];

            const isReachable = reachableProcesses.has(processId);
            if (!isReachable)
            {
                const process = processes[processId];

                //console.log(`Unregistering effects on unreachable process #${processId}: `, process);

                unregisterProcessEffects(process);
                updateEffects(process, process.currentState, null);
            }
            // else
            // {
            //     console.log("Process #", processId, " is still reachable")
            // }
        }

        currentHistoryPos -= newStart;

        config.logHistory && console.log("pushProcessState: shorten history, newStart = ", newStart, "currentHistoryPos = ", currentHistoryPos)

        processHistory = processHistory.slice(newStart);
    }

    config.logHistory && logHistory();

    const op = replace ? "replace" : "push";

    //console.log("pushProcessState", op);

    config.history[op](
        uri(
            "/{appName}/{processName}/{stateName}/{info}",
            {
                appName: config.appName,
                processName: currentProcess.name,
                stateName: currentState.name,
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
            throw new Error("'" + process.name + ": '" + keys[i] + "' is not a valid process option");
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

    const processEffects = effects.get(null);

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

    const processEffects = effects.get(null);

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
 * @param {Object} processOpts      options for (sub)process
 * @return {Promise<React.Element>}
 */
function renderProcessInternal(processName, input, injections, asSubProcess, processOpts = null)
{
    return processImporter(processName)
        .then(
            module => {
                let process;

                // const entry = processDefinitions[processName];
                // if (!entry)
                // {
                //     throw new Error("Could not find process '" + processName + "'");
                // }
                //console.log("PROCESS-ENTRY", entry);


                const { initProcess, default: ScopeClass } = module;

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
                    processName,
                    input,
                    asSubProcess ? currentProcess : null,
                    processOpts
                );
                processes.push(process);

                currentProcess = process;

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


                const storage = process[secret];
                storage.scope = scope

                return Promise.resolve(
                        initProcess(process, scope)
                    )
                    .then(
                        (startState) => {

                            if (process.options.forceSubProcess && !asSubProcess)
                            {
                                throw new Error("Process '" + process.name + "' must be run as sub-process");
                            }

                            finishInitialization(process);

                            const startTransitionName = process.name + ".start";
                            return executeTransition(startTransitionName, null, startState, null, null);
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
 * @param {object} injections       injections for the sub-process
 *
 * @param {object} opts             process options
 * @return {Promise<React.Element>}   rendered elements of the first view.
 */
export function renderSubProcess(processName, input, injections, opts)
{
    return renderProcessInternal(processName, input, injections, true, opts)
}


/**
 * Returns the current top-level process.
 *
 * @return {Process} the current process on top
 */
export function getCurrentProcess()
{
    return currentProcess;
}


/**
 * Internal test function to set a mocked process object as current process.
 *
 * @param process   mocked process
 */
export function setMockProcess(process)
{
    currentProcess = process
}

/**
 * Find the history index for the given back function / number of back steps.
 *
 * @param {Number|Function} n   back function or number of steps to go back.
 *
 * @return {number} history index
 */
export function findBackStateIndex(n)
{
    let i, entry, historyIndex ;

    const pos = currentHistoryPos;

    if (typeof n === "function")
    {
        for (i = pos - 1; i >= 0; i--)
        {
            const e = processHistory[i];
            const result = n(e);

            if (__DEV)
            {
                if (typeof result === "function")
                {
                    throw new Error("Invalid result of back state search. Make sure to invoke the back function with the transition (e.g. 't.back(backToParent(t))'). Don't forget the final '(t)'.");
                }
            }

            config.logHistory && console.log("BACK", e, "=>", result);

            if (result === true)
            {
                historyIndex = i;
                entry = e;
                break;
            }
        }

        if (!entry)
        {
            alert(
                i18n("State not found")
            );
            throw new Error("No entry to navigate back to found.");
        }
    }
    else if (typeof n === "number")
    {
        if (pos - n < 0 || pos - n >= processHistory.length)
        {
            throw new Error("Invalid history location: " + (pos - n));
        }
        historyIndex = pos - n;
    }
    else
    {
        throw new Error("Invalid argument passed to back(): " + n);
    }

    return historyIndex;
}


export function confirmDestructiveTransition(msg = i18n("Delete Dirty Changes?"))
{
    if (currentProcess.isDirty)
    {
        return confirm(msg)
    }
    return true
}
