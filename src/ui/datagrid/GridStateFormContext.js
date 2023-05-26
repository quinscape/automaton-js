import { createContext } from "react";
import { action, makeObservable, observable } from "mobx";

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
