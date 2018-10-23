import React from "react";
import {
    get,
    keys,
    set
} from "mobx";

import QueryDeclaration from "./QueryDeclaration";
import FormConfigProvider from "domainql-form/lib/FormConfigProvider";
import InputSchema from "domainql-form/lib/InputSchema";
import Authentication from "./auth";
import { configuration } from "./configuration";

const MODULE_REGEX = /\.\/(.*?)\/(composites\/(.*?)|.*?)\.js/;

const NOT_IMPLEMENTED = { "_" : "NOT_IMPLEMENTED" };

const secret = Symbol("ProcessSecret");

export const AutomatonEnv = React.createContext({
    "_" : "default context"
});

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

            //console.log("set", name, "to", result);

            set( scope, name, result);
        }
    }
}

function ProcessEntry(process)
{
    this.process = process;
    this.initProcess = null;
    this.ScopeClass = null;
}

/**
 * Loads the process scope, initProcess and components from the given initial data and webpack require context
 *
 * @param initial   initial data
 * @param ctx       webpack require context
 * 
 * @return {{process: *, initProcess: *, ScopeClass: *}}    infrastructural process objects
 */
function loadProcesses(initial, ctx)
{
    const keys = ctx.keys();

    const processes = {  };

    for (let i = 0; i < keys.length; i++)
    {
        const moduleName = keys[i];

        let m = MODULE_REGEX.exec(moduleName);

        //console.log(m);

        if (!m)
        {
            throw new Error("Module name '" + moduleName + "' does not match " + MODULE_REGEX);
        }

        //console.log("-- Process", m[1]);

        const processName = m[1];
        const componentName = m[3];

        let entry = processes[processName];
        if (!entry)
        {
            entry = new ProcessEntry(
                new Process(processName)
            );
            processes[processName] = entry;
        }

        const module = ctx(moduleName);
        if (componentName)
        {
            //console.log("process", process);
            entry.process[secret].components[componentName] = module.default;
        }
        else
        {
            const { default: ScopeClass, initProcess } = module;

            if (!initProcess)
            {
                throw new Error("No initProcess defined in " + moduleName);
            }

            entry.ScopeClass = ScopeClass;
            entry.initProcess = initProcess;
        }
    }
    return processes;
}

function getLayout(process, currentState)
{
    const { layout } = process;

    if (layout)
    {
        if (currentState !== undefined && layout.prototype.isReactComponent)
        {
            const component = layout[currentState];
            if (component)
            {
                return component;
            }
        }
        return layout;
    }
    return configuration().layout;
}

function setCurrentState(process, currentState)
{
    // directly access secret process data
    const data = process[secret];

    if (!data.states[currentState])
    {
        throw new Error("Could not find state '" + currentState + "' in Process '" + process.name + "'");
    }
    data.currentState = currentState;
}

function renderViewState(currentState, process)
{
    // directly access secret process data
    const data = process[secret];

    setCurrentState(process, currentState);

    const ViewComponent = data.components[currentState];

    if (!ViewComponent)
    {
        throw new Error("No component '" + currentState + "' in process '" + process.name)
    }

    const inputSchema = new InputSchema(initialData.schema);

    const env = {
        process,
        contextPath: initialData.contextPath,
        state: currentState,
        scope: data.scope,
        applicationScope: NOT_IMPLEMENTED,
        userScope: NOT_IMPLEMENTED,
        auth: authentication,
        initialData
    };

    const Layout = getLayout(process, currentState);

    //console.log("LAYOUT", Layout);

    return (
        <AutomatonEnv.Provider
            value={ env }
        >
            <FormConfigProvider
                schema={ inputSchema }
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

let initialData, authentication;


export function renderProcess(initial, ctx, processName = initial.processName)
{
    initialData = initial;

    console.log("RENDER", processName);

    const {
        injections,
    } = initial;

    authentication = new Authentication(initialData.authentication);

    const processes = loadProcesses(initial, ctx);

    //console.log("PROCESSES", processes);
    
    const processEntry = processes[processName];

    if (!processEntry)
    {
        throw new Error("Could not find process '" + processName + "'");
    }

    //console.log("PROCESS-ENTRY", processEntry);

    const { process, initProcess, ScopeClass } = processEntry;

    // directly access secret process data
    const data = process[secret];

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

    const stateData = initProcess(process, scope);

    const currentState = stateData.startState;

    data.startState = currentState;
    data.states = stateData.states;
    data.scope = scope;
    data.initialized = true;

    initialData = initial;

    return renderViewState(currentState, process);
}

function ensureInitialized(process)
{
    if (!process[secret].initialized)
    {
        throw new Error("Process not initialized");
    }
}

/**
 * Process facade exposing a limited set of getters and methods as process API
 */
export class Process {
    constructor(name, parent)
    {
        this[secret] = {
            name,
            components: {},

            parent,

            states: null,
            startState: null,

            currentState: null,
            currentObject: null,

            scope: null,

            layout: null,

            initialized: false
        };
    }

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

    get layout()
    {
        return this[secret].layout;
    }

    set layout(layout)
    {
        if (layout.prototype.isReactComponent || (layout && typeof layout === "object"))
        {
            this[secret].layout = layout;
        }
        else
        {
            throw new TypeError("Invalid layout: " + layout);
        }
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

    transition(name, ... args)
    {
        ensureInitialized(this);

        const data = this[secret];

        const array = data.states[data.currentState];

        let transition;

        for (let i = 0; i < array.length; i++)
        {
            const current = array[i];

            if (current.name === name)
            {
                 transition = current;
                 break;
            }
        }

        if (!transition)
        {
            throw new Error("Could not find transition '" + name + "' in Process '" + this.name + "'" )
        }

        return Promise.resolve(transition.action(args));
    }

    back()
    {
        // TODO: implement
    }
}
