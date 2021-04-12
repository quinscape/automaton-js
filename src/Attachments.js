/**
 * Weakmap attaching file action information to observables.
 *
 * @type {WeakMap<object, any>}
 */
import uploadAttachment from "./uploadAttachment";
import deleteAttachment from "./deleteAttachment";

const fileActions = new WeakMap();

function getActionsForObservable(observable)
{
    const array = fileActions.get(observable);
    if (!array)
    {
        const newArray = [];
        fileActions.set(observable, newArray);
        return newArray;
    }

    return array;
}


const ACTION_DELETE = "ACTION_DELETE";
const ACTION_UPLOAD = "ACTION_UPLOAD";

/**
 * Contains helper functions for the special functionality needed to deal with attachments in forms
 *
 * @category domain
 *
 */
const Attachments = {

    /**
     * Performs all pending uploads registered for the given root observable.
     * 
     * @param observable
     * @return {Promise<unknown[]>}
     */
    uploadPending: function (observable) {
        const actions = getActionsForObservable(observable);

        const promises = [];

        for (let i = 0; i < actions.length; i++)
        {
            const a = actions[i];

            if (a.action === ACTION_UPLOAD)
            {
                promises.push(
                    uploadAttachment(a.id, a.description, a.type, a.file)
                )
            }
        }
        return Promise.all(promises);
    },

    /**
     * Performs the pending deletions for the given root observable.
     * 
     * @param observable
     * @return {Promise<unknown[]>}
     */
    deletePending: function (observable) {
        const actions = getActionsForObservable(observable);

        const promises = [];

        for (let i = 0; i < actions.length; i++)
        {
            const a = actions[i];

            if (a.action === ACTION_DELETE)
            {
                promises.push(
                    deleteAttachment(a.id)
                );
            }
        }


        return Promise.all(promises);
    },

    /**
     * Returns a list of actions registered for the given root observable.
     * 
     * @param observable
     * @return {T[]}
     */
    getActions: function (observable)
    {
        return getActionsForObservable(observable).slice();
    },

    /**
     * Clears all registered actions for the given root observable.
    *
     * @param observable
     * @return {T[]}
     */
    clearActionsFor: function (observable, attachmentId) {

        console.log("clearActionsFor", attachmentId);

        const actions = getActionsForObservable(observable).filter(a => a.id !== attachmentId);
        fileActions.set(observable, actions);
    },

    /**
     * Marks the given attachment id as deleted
     * 
     * @param observable
     * @param attachmentId
     */
    markAttachmentDeleted: function (observable, attachmentId) {
        getActionsForObservable(observable).push({
            action: ACTION_DELETE,
            id: attachmentId
        });
    },

    /**
     * Marks the given attachment id as new
     *
     * @param observable
     * @param attachmentId
     */
    markAttachmentAsNew: function (observable, attachment, file) {

        getActionsForObservable(observable).push({
            action: ACTION_UPLOAD,
            ...attachment,
            file
        });
    },
    /**
     * Clears all registered actions
     *
     * @param observable
     * @param attachmentId
     */
    clearAll: function(observable)
    {
        fileActions.delete(observable);
    }

}

export default Attachments;
