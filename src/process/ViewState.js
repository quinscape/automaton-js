import { observer } from "mobx-react-lite"


const secret = Symbol("ViewState Secret");


export class ViewStateInstance
{
    
}

/**
 * Encapsulates the static view state in an automaton process. The process keeps the actual transition maps
 * bound to process and scope for each of its states.
 */
export default class ViewState
{
    constructor(name, transitionFn, renderFn)
    {
        if (!name)
        {
            throw new Error("Need name");
        }

        if (typeof transitionFn !== "function")
        {
            throw new Error("Need transition factory function");
        }

        if (typeof renderFn !== "function")
        {
            throw new Error("Need render function");
        }

        const storage = {
            name,
            process: "",
            Component: observer(renderFn),
            transitionFn
        };

        storage.Component.displayName = "ViewState." + name;

        this[secret] = storage;
    }

    createTransitionMap(process)
    {
        const storage = this[secret];
        return storage.transitionFn(process, process.scope);
    }
    
    get name()
    {
        return this[secret].name;
    }

    getViewStateComponent()
    {
        return this[secret].Component;
    }
}
