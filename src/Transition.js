const secret = Symbol("TransitionSecret");

/**
 * Encapsulates a runtime transition within a process.
 */
export default class Transition {
    constructor(process, source, target, context)
    {
        this[secret] = {
            process: process,
            source: source,
            target: target,
            context: context,
            isCanceled: false
        }
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
     * Returns true if the transition has been canceled.
     *
     * @return {boolean}
     */
    get isCanceled()
    {
        return this[secret].isCanceled;
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
        const access = this[secret];

        const {process} = access;

        console.log("Process of transition", process);

        if (!process.states[name])
        {
            throw new Error("'" + name + "' is no valid target state in process '" + process.name + "'");
        }

        access.target = name;
    }


    /**
     * Cancels the transition and reverts the process scope changes.
     *
     */
    cancel()
    {
        this[secret].isCanceled = true;
        this[secret].target = null;
    }
}
