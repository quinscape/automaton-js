import { makeObservable, observable } from "mobx"

export default class QueryConfig {

    constructor()
    {
        makeObservable(this)
    }

    /**
     * The current page size
     * 
     * @type {number}
     */
    @observable pageSize;

    /**
     * The offset in the data
     * 
     * @type {number}
     */
    @observable offset;

    /**
     * The initial condition for the query, null for no condition
     * 
     * @type {object}
     */
    @observable condition;

    /**
     * Is the data sortable by this column
     * 
     * @type {string | null}
     */
    @observable id;

}