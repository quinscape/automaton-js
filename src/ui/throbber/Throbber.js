import React from "react"
import { action, makeObservable, observable } from "mobx";
import { observer as fnObserver } from "mobx-react-lite"

const secret = Symbol("ThrobberState Secret");

/**
 * Observable State to determine if throbbing is active or not.
 */
class ThrobberState {

    constructor(props) {
        makeObservable(this)

        this[secret] = {
            count: 0
        }
    }

    /**
     * Stores if throbbing is active.
     */
    @observable
    active = false;

    /**
     * Increase the throbber count by 1 and set the active flag to true.
     * 
     * Remember to call {@link decrease} after operation finishes.
     */
    @action
    increase() {
        this[secret].count++;
        this.active = true;
    }

    /**
     * Decrease the throbber count by 1 (min value is 0) and set the active flag to false if the counter hits 0.
     */
    @action
    decrease() {
        this[secret].count--;
        if (this[secret].count <= 0) {
            this.active = false;
            this[secret].count = 0;
        }
    }

    /**
     * Add a throb count for a Promise until it returns
     * 
     * @param {Promise} promise the Promise to be throbbed upon
     * @returns {Promise} the result Promise
     */
    @action
    throb(promise) {
        if (promise instanceof Promise) {
            this.increase();
            return promise.then((value) => {
                this.decrease();
                return value;
            }, (error) => {
                this.decrease();
                throw error;
            });
        }
        console.warn(`Throbbing rejected: Promise expected but got "${promise.constructor.name}"`);
        return Promise.resolve(promise);
    }

}

const state = new ThrobberState();

/**
 * Wrapper for GraphQL-data promises that activates a page blocking throbber.
 *
 * @param {Promise} promise promise, usually a graphql query
 *
 * @return {Promise<*>} resolves/rejects to the same value as the initial promise
 */
export function promiseThrobber(promise) {
    return state.throb(promise);
}

/**
 * Renders a page blocking throbber.
 */
const Throbber = fnObserver(() =>  {

    return state.active && (
        <div
            className="throbber-container"
        >
            <i className="fa fa-spinner-third throbber" />
        </div>
    )
});

export default Throbber
