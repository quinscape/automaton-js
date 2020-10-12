const secret = Symbol("TransitionSecret");

/**
 * Encapsulates a runtime transition within a process.
 */
export default class Transition {
    constructor(process, source, target, context, processHistory, currentHistoryPos, button)
    {
        this[secret] = {
            process,
            source,
            target,
            context,
            processHistory,
            currentHistoryPos,
            historyIndex: -1,
            button
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
     * Button name if the transition was executed by a button and that button had a name prop.
     *
     * @return {String}
     */
    get button()
    {
        return this[secret].button;
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

        // console.log("Process of transition", process);

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
    back(n = 1)
    {
        const { processHistory, currentHistoryPos } = this[secret];

        let i, entry, historyIndex ;
        if (typeof n === "function")
        {
            for (i = currentHistoryPos - 1; i >= 0; i--)
            {
                const e = processHistory[i];

                if (n(e) === true)
                {
                    historyIndex = i;
                    entry = e;
                    break;
                }
            }

            if (!entry)
            {
               throw new Error("No entry to navigate back to found.");
            }

            //console.log("back(fn) : true for history index #", historyIndex, "=", processHistory[historyIndex]);
        }
        else if (typeof n === "number")
        {
            if (currentHistoryPos - n < 0 || currentHistoryPos - n >= processHistory.length)
            {
                throw new Error("Invalid history location: " + (currentHistoryPos - n));
            }
            entry = processHistory[currentHistoryPos - n];
        }
        else
        {
            throw new Error("Invalid argument passed to back(): " + n);
        }


        this.isRecorded = false;
        this[secret].historyIndex = historyIndex;
    }
}
