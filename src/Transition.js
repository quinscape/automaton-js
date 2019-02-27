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
            currentHistoryPos,
            historyIndex: -1
        };

        this.isRecorded = null;
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
     * Returns the history index the transition has returned to
     *
     * @return {Number} history index or -1 if no history navigation took place
     */
    get historyIndex()
    {
        return this[secret].historyIndex;
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

        let historyIndex = -1;
        if (typeof n === "function")
        {
            for (let i = currentHistoryPos - 1; i >= 0; i--)
            {
                const entry = processHistory[i];

                if (n(entry) === true)
                {
                    historyIndex = i;
                    break;
                }
            }

            //console.log("back(fn) : true for history index #", processHistory[historyIndex]);
        }
        else
        {
            if (n <= currentHistoryPos)
            {
                historyIndex = currentHistoryPos - n;
            }
        }

        if (historyIndex < 0 || historyIndex >= processHistory.length)
        {
            throw new Error("Could not go back ( n = " + String(n) + ")" );
        }

        this.isRecorded = false;
        // remember history index to go back to
        this[secret].historyIndex = historyIndex;
    }
}
