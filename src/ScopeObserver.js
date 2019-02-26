import { isObservableObject, observe } from "mobx"


/**
 * Encapsulates change tracking for versioned fields inside the process scope.
 *
 */
export default class ScopeObserver {

    /**
     * Constructs a new ScopeObserver
     *
     * @param {Function} versioningStrategy     versioning strategy
     * @param {*} scope                         observable object
     */
    constructor(versioningStrategy, scope)
    {
        if (!isObservableObject(scope))
        {
            throw new Error("Object must be observable : " + scope);
        }
        this.dispose = observe(scope, change => {

            if (!this.versionedPropsChanged && versioningStrategy(change.name))
            {
                this.versionedPropsChanged = true;
            }
        });
        
        this.reset();
    }

    reset()
    {
        this.versionedPropsChanged = false;
    }

}
