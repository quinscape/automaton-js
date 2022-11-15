import { makeObservable, observable } from "mobx"

export default class QuxData {

    constructor()
    {
        makeObservable(this)
    }

    @observable id;

    @observable name;

    @observable value;

    @observable description;

}