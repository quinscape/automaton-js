import { createContext } from "react";
import { action, computed, makeObservable, observable } from "mobx";
import config from "../../config";

export class StickySizesContextState {

    @observable
    _headerHeight = 0;

    @observable
    _footerHeight = 0;

    constructor(props)
    {
        makeObservable(this)
    }

    @action
    setHeaderHeight(value)
    {

        this._headerHeight = value;
    }

    @computed
    get headerHeight(value)
    {

        const stickyTopPadding = config.ui.stickyTopPadding;
        return Math.max(this._headerHeight, stickyTopPadding);
    }

    @action
    setFooterHeight(value)
    {
        this._footerHeight = value;
    }

    @computed
    get headerHeight(value)
    {

        const stickyBottomPadding = config.ui.stickyBottomPadding;
        return Math.max(this._footerHeight, stickyBottomPadding);
    }

}

const StickySizesContext = createContext(new StickySizesContextState());

export default StickySizesContext;
