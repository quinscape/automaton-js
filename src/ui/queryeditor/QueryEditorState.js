import set from "lodash.set";
import toPath from "lodash.topath";
import {action, makeObservable, observable} from "mobx";

export default class QueryEditorState {

    /**
     * Container observable
     * @type {Object}
     */
    container = null;

    /**
     * Condition path within the container
     * @type {String}
     */
    containerPath = null;

    /**
     * The starting GraphQL type for the condition
     * @type {String}
     */
    rootType = null

    /**
     * Increased to signal query updates.
     *
     * @type {number}
     */
    @observable
    updateCounter = 0;


    constructor(rootType, container, containerPath)
    {
        makeObservable(this);
        this.rootType = rootType;
        this.container = container;
        this.containerPath = containerPath;
    }

    get queryRoot()
    {
        const { container, containerPath } = this

        return get(container, containerPath)
    }

    @action
    setSelected(columns) {
        const {container, containerPath} = this;

        const p = toPath(containerPath).concat(toPath("select"));
        if (Array.isArray(columns) && columns.length > 0) {
            set(container, p, columns);
        } else {
            set(container, p, null);
        }

        this.updateCounter++;
    }

    @action
    setSort(sort) {
        const {container, containerPath} = this;

        const p = toPath(containerPath).concat(toPath("sort"));
        if (Array.isArray(sort) && sort.length > 0) {
            set(container, p, sort);
        } else {
            set(container, p, null);
        }

        this.updateCounter++;
    }

}
