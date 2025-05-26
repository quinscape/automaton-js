import { observer } from "mobx-react-lite"


const secret = Symbol("ViewState Secret");

/**
 * Encapsulates the static view state in an automaton process. The process keeps the actual transition maps
 * bound to process and scope for each of its states.
 */
export default class ViewState
{
    constructor(name, transitionFn, renderFn, pageTitle, afterRestoreFn)
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

        if (afterRestoreFn != null && typeof afterRestoreFn !== "function") {
            throw new Error("After restore needs to be a function or not defined");
        }

        const storage = {
            name,
            Component: observer(renderFn),
            transitionFn,
            afterRestoreFn,
            pageTitle
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

    get pageTitle() {
        return this[secret].pageTitle;
    }

    get afterRestoreFn() {
        return this[secret].afterRestoreFn;
    }

    getViewStateComponent()
    {
        return this[secret].Component;
    }
}
