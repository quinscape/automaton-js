import { createContext } from "react";
import { action, makeObservable, observable } from "mobx";

export class ShortcutContextState {

    constructor(props)
    {
        makeObservable(this)
    }


    @observable
    shortcuts = new Map();

    // constructor() {
    //     makeObservable(this);
    // }

    @action
    setShortcut(id, heading, icon)
    {
        this.shortcuts.set(id, {
            id,
            heading,
            icon
        });
    }

    @action
    removeShortcut(id)
    {
        this.shortcuts.delete(id);
    }

}

const ShortcutContext = createContext(new ShortcutContextState());

export default ShortcutContext;
