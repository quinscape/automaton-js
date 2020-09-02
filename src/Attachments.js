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

const Attachments = {

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

    getActions: function (observable)
    {
        return getActionsForObservable(observable).slice();
    },

    clearActionsFor: function (observable, attachmentId) {

        console.log("clearActionsFor", attachmentId);

        const actions = getActionsForObservable(observable).filter(a => a.id !== attachmentId);
        fileActions.set(observable, actions);
    },

    markAttachmentDeleted: function (observable, attachmentId) {
        getActionsForObservable(observable).push({
            action: ACTION_DELETE,
            id: attachmentId
        });
    },

    markAttachmentAsNew: function (observable, attachment, file) {

        getActionsForObservable(observable).push({
            action: ACTION_UPLOAD,
            ...attachment,
            file
        });
    },
    clearAll: function(observable)
    {
        fileActions.delete(observable);
    }

}

export default Attachments;
