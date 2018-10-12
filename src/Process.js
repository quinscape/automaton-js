import React from "react";
import QueryDeclaration from "./QueryDeclaration";
import FormConfigProvider from "domainql-form/lib/";


const MODULE_REGEX = /\.\/(.*?)\/(components\/(.*?)|.*?)\.js/;

const processes = [];

const secret = Symbol("ProcessSecret");

export const ScopeContext = React.createContext({
    scope: {
        scope: null,
        userScope: null,
        applicationScope : null,
        process: null,
        auth: null
    }
});

function inject(scope, injections)
{
    for (let name in scope)
    {
        if (scope.hasOwnProperty(name))
        {
            const prop = scope[name];
            if (prop instanceof QueryDeclaration)
            {
                const result = injections[prop.query];
                if (result === undefined)
                {
                    throw new Error("Could not find query for prop '" + name + "'");
                }
                scope[name] = result;
            }
        }
    }

}

export function renderProcess(initial, ctx)
{
    const {
        _injections: injections,
        authentication,
        contextPath,
        csrfToken,
        schema
    } = initial;

    let process;
    let ScopeClass, initProcess, processAccess;
    const keys = ctx.keys();
    const components = {};

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

        if (i === 0)
        {
            process = new Process(processName, components);
            processAccess = process[secret];
            processes.push(process);
        }

        const module = ctx(moduleName);
        if (componentName)
        {
            //console.log("process", process);
            components[componentName] = module.default;
        }
        else
        {
            ScopeClass = module.default;
            initProcess = module.initProcess;

            if (!initProcess)
            {
                throw new Error("No initProcess defined in " + moduleName);
            }

        }
    }

    const scope = new ScopeClass();

    inject(scope, injections);

    const states = initProcess(process, scope);
    processAccess.initialized = true;
    processAccess.startState = states.startState;
    processAccess.states = states;
    
    let Component = components[states.startState];

    if (!Component)
    {
        throw new Error("No component '" + states.startState + "' in process '" + process.name)
    }

    const env = {
        scope,
        applicationScope: { "_": "notImplemented" },
        userScope: { "_": "notImplemented" },
        authentication,
        csrfToken,
        contextPath
    };

    return (
        <ScopeContext.Provider value={ env }>
            <Component
                env={ env }
            />
        </ScopeContext.Provider>
    )
}

export class Process
{
    constructor(name, components)
    {
        this[secret] = {
            name,
            components,
            initialized: false,
            states: null,
            startState: null,
            current: null
        };
    }

    get name()
    {
        return this[secret].name;
    }

    get components()
    {
        return this[secret].components;
    }

    get startState()
    {
        return this[secret].startState;
    }

    get states()
    {
        return this[secret].states;
    }

    transitionTo(state)
    {
        let initialized = this[secret].initialized;

        if (!initialized)
        {
            throw new Error("Cannot transition in locked process");
        }
        // TODO: implement
    }
}
