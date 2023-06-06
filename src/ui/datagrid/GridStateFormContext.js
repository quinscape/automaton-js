import { createContext } from "react";
import { action, makeObservable, observable } from "mobx";

/**
 * A ContextState for the GridStateForm containing the filter values for its DataGrid.
 */
export class GridStateFormContextState {

    filters = observable.array([]);

    constructor(props = {})
    {
        makeObservable(this);

        const {filters} = props;
        if (Array.isArray(filters)) {
            this.filters.replace(filters);
        }
    }

    @action
    setFilters(value)
    {
        if (Array.isArray(value)) {
            this.filters.replace(value);
        } else {
            this.filters.replace([]);
        }
    }

}

const GridStateFormContext = createContext(new GridStateFormContextState());

export default GridStateFormContext;
