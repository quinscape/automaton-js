import {action, makeObservable, observable} from "mobx";

export default class ConditionEditorScope {

    @observable
    rootType = ""

    @observable
    condition = null;


    constructor(rootType)
    {
        makeObservable(this);
        this.rootType = rootType;
    }
}
