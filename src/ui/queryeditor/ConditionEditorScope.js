import {action, makeObservable, observable} from "mobx";

export default class ConditionEditorScope {

    @observable
    rootType = "Foo"

    @observable
    condition = null;


    constructor()
    {
        makeObservable(this)
    }

    @action
    updateCondition(condition) {
        this.condition = condition;
    }
}