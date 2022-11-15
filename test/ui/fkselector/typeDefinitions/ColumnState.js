import { makeObservable, observable } from "mobx"

export default class ColumnState {

    constructor()
    {
        makeObservable(this)
    }

    /**
     * The column name
     * 
     * @type {string}
     */
    @observable name;

    /**
     * Is the column enabled
     * 
     * @type {boolean}
     */
    @observable enabled;

    /**
     * Is the data sortable by this column
     * 
     * @type {boolean}
     */
    @observable sortable;

}