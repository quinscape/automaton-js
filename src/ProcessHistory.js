import { isObservableObject, observe, action} from "mobx"


const redoChanges = action("ProcessHistory.redoChanges", (scope, changes, from, to) =>
{
    for (let i = from; i < to; i++)
    {
        const change = changes[i];

        console.log("REDO CHANGE", scope, change);

        const { type, name } = change;

        if (type === "update")
        {
            scope[name] = change.newValue;
        }
        else
        {
            throw new Error("Unhandled redo type: " + JSON.stringify(change));
        }
    }
});


const undoChanges = action("ProcessHistory.undoChanges", (scope, changes, from, to) =>
{
    for (let i = from; i >= to; i--)
    {
        const change = changes[i];

        console.log("UNDO CHANGE", scope, change);

        const { type, name } = change;

        if (type === "update")
        {
            scope[name] = change.oldValue;
        }
        else
        {
            throw new Error("Unhandled undo type: " + JSON.stringify(change));
        }
    }

});


/**
 * Encapsulates change tracking for versioned fields inside the process scope.
 *
 */
export default class ProcessHistory {

    /**
     * Constructs a new ScopeObserver
     *
     * @param {Function} versioningStrategy     versioning strategy
     * @param {*} scope                         observable object
     */
    constructor(process)
    {
        const { versioningStrategy, scope } = process;
        this.process = process;

        if (scope)
        {
            if (!isObservableObject(scope))
            {
                throw new Error("Object must be observable : " + scope);
            }
            this.dispose = observe(scope, change => {

                if (!this.versionedPropsChanged && versioningStrategy(change.name))
                {
                    this.versionedPropsChanged = true;

                    const { changes } = this;

                    changes[this.pos++] = change;

                    if (this.pos < this.changesEnd)
                    {
                        this.changesEnd = this.pos;

                        // if we branch off a previous history state, the changes from that point are lost and we
                        // null them to allow garbage collection
                        for (let i = this.changesEnd; i < changes.length; i++)
                        {
                            changes[i] = null;
                        }
                    }
                    else
                    {
                        this.changesEnd = this.pos;
                    }
                }
            });
        }
        else
        {
            this.dispose = () => {};
        }

        this.changes = [];
        this.pos = 0;
        this.changesEnd = 0;

        this.resetChanged();
    }

    resetChanged()
    {
        this.versionedPropsChanged = false;
    }

    navigateTo(newPos)
    {

        if (newPos < 0 || newPos > this.changesEnd)
        {
            throw new Error("History position out of bounds: " + newPos + ", changesEnd = " + this.changesEnd);
        }

        const { changes, process } = this;
        if (newPos > this.pos)
        {
            redoChanges(process.scope, changes, this.pos, newPos);
        }
        else if (newPos < this.pos)
        {
            undoChanges(process.scope, changes, this.pos - 1, newPos);
        }

        this.pos = newPos;
    }
}
