import { observer } from "mobx-react-lite"


const secret = Symbol("ViewState Secret");

/**
 * Encapsulates a view state in an automaton process
 *
 */
export default class ViewState
{
    constructor(name, transitionFn, componentFn)
    {
        const storage = {
            name,
            process: "",
            Component: observer(componentFn),
            transitionFn,
            isInitialized: false

        };

        storage.Component.displayName = "ViewState." + name;

        this[secret] = storage;
    }

    init(process)
    {
        const storage = this[secret];
        if (!storage.isInitialized)
        {
            storage.isInitialized = true;
            storage.process = process.name;

            const transitionMap = storage.transitionFn(process, process.scope);

            for (let name in transitionMap)
            {
                if (transitionMap.hasOwnProperty(name))
                {
                    const entry = transitionMap[name];

                    if (entry.to)
                    {
                        if (entry.to instanceof ViewState)
                        {
                            entry.to.init(process);
                        }
                        else
                        {
                            throw new Error("Transition '" + name + "' in '" + process.name + " / " + this.name + "' must be an imported ViewState instance.")
                        }
                    }
                }
            }

            storage.transitionMap = transitionMap;
        }
        else
        {
            if (__DEV)
            {
                if (storage.process !== process.name)
                {
                    throw new Error("Process conflict: " +
                                    "View state was initialized as " + storage.process + " / " + storage.name + " but is now initialized with with process " + process.name + ". " +
                                    "The process imports must be messed up somewhere.")
                }
            }
        }
    }

    get transitionMap()
    {
        return this[secret].transitionMap;
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
