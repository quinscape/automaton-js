import { action } from "mobx"

const secret = Symbol("TransitionSecret");

/**
 * Encapsulates a runtime transition within a process.
 */
export default class Transition {
    constructor(process, source, target, context, processHistory, currentHistoryPos)
    {
        this[secret] = {
            process,
            source,
            target,
            context,
            processHistory,
            currentHistoryPos
        };

        this.isRecorded = false;
    }


    /**
     * Process this transition happens in.
     *
     * @return {*}
     */
    get process()
    {
        return this[secret].process;
    }


    /**
     * Context object. Can be set by calling t.selectTargetObject().
     * @return {*}
     */
    get context()
    {
        return this[secret].context;
    }


    set context(value)
    {
        this[secret].context = value;
    }

    /**
     * Source state
     *
     * @return {String}
     */
    get source()
    {
        return this[secret].source;
    }


    /**
     * Returns the current target state
     *
     * @return {String}
     */
    get target()
    {
        return this[secret].target;
    }


    /**
     * Sets the current target state
     * @param name
     */
    set target(name)
    {
        const storage = this[secret];

        const { process } = storage;

        console.log("Process of transition", process);

        if (!process.states[name])
        {
            throw new Error("'" + name + "' is no valid target state in process '" + process.name + "'");
        }

        storage.target = name;
    }


    /**
     * Goes back to a previous process state.
     *
     * @param {Number|Function} [n]     Number of steps to go back, default is 1.
     *                                  if n is a function, it will be called with every history entry starting with the last
     *                                  until the function returns true. Then the process goes to that history state.
     *
     *                                  Throws an error if it cannot go back n states or if the function n never returns true
     */
    @action
    back(n = 1)
    {

        const { processHistory, currentHistoryPos } = this[secret];

        let backTargetEntry = 0;
        if (typeof n === "function")
        {
            for (let i = currentHistoryPos - 1; i >= 0; i--)
            {
                const entry = processHistory[i];

                if (n(entry) === true)
                {
                    backTargetEntry = entry;
                    break;
                }
            }
        }
        else
        {
            if (n <= currentHistoryPos)
            {
                backTargetEntry = processHistory[currentHistoryPos - n];
            }
        }

        if (!backTargetEntry)
        {
            throw new Error("Could not go back ( n = " + String(n) + ")" );
        }

        const { currentState, versionedProps } = backTargetEntry;

        Object.assign(this[secret].process.scope, versionedProps);

        this[secret].target = currentState;
    }
}
