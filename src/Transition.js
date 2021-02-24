import { findBackStateIndex } from "./Process";
import config from "./config";


const secret = Symbol("TransitionSecret");

/**
 * Encapsulates a runtime transition within a process.
 */
export default class Transition {
    constructor(process, source, target, context, button)
    {
        this[secret] = {
            process,
            source,
            target,
            context,
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
        const historyIndex = findBackStateIndex(n)

        this.isRecorded = false;
        this[secret].historyIndex = historyIndex;

        config.logHistory && console.log("transition.back: historyIndex = ", historyIndex);
    }
}
