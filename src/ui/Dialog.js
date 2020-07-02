import React from "react";
import { action, observable } from "mobx";
import { observer as fnObserver } from "mobx-react-lite";
import { Modal, ModalBody, ModalHeader } from "reactstrap";


const secret = Symbol("DialogAPISecret")

const dialogs = observable(
    new Map()
);

let dialogCount = 0;

const DEFAULT_OPTS = {
    /**
     * Dialog size
     */
    size: "lg",

    // dialog fade speed or false to disable fading
    fade: false,

    // title or render function of the simple dialog. If not defined, no header will be rendered
    title: null,

    // if true, openDialog() will provide the Modal component and the caller only needs to render the content. If set to false
    // the caller must render a complete dialog that uses `dialog.opts.size` and `dialog.opts.fade`
    simple: true,

    //  The result the simple dialog will use if the user closes the modal
    resultOnCancel: null
};

export class DialogAPI {
    constructor(resolve, reject, renderFn, opts)
    {
        this[secret] = {
            resolve,
            reject,
            renderFn,
            opts: Object.freeze({
                ... DEFAULT_OPTS,
                ... opts
            }),
            id: dialogCount++
        }

    }

    /**
     * Returns a unique id for the dialog
     */
    get id()
    {
        return this[secret].id;
    }


    /**
     * Returns the dialog options for this dialog.
     *
     * @return {object}
     */
    get opts()
    {
        return this[secret].opts;
    }


    /**
     * Cancels the given dialog with an error and rejects the original dialog promise.
     */
    @action.bound
    error(err)
    {
        dialogs.delete(this.id);
        this[secret].reject(err);
    }

    /**
     * Confirms and resolves the dialog with the given result object.
     * @param {*} result    result object for the dialog
     */
    @action.bound
    confirm(result)
    {
        dialogs.delete(this.id);
        this[secret].resolve(result);
    }


    /**
     * Cancels the dialog and resolves to the value of the resultOnCancel option
     */
    cancel = () =>
    {
        return this.confirm(this.opts.resultOnCancel)
    }

    render()
    {
        const { opts, renderFn } = this[secret]

        const { simple, size, fade, title } = opts;

        if (simple)
        {
            return (
                <Modal
                    isOpen={ true }
                    toggle={ this.cancel }
                    size={ size }
                    fade={ fade }
                >
                    {
                        title && (
                            <ModalHeader
                                toggle={ this.cancel }
                            >
                                {
                                    typeof title === "function" ? title() : title
                                }
                            </ModalHeader>
                        )
                    }
                    <ModalBody>
                        {
                            renderFn(this)
                        }
                    </ModalBody>
                </Modal>
            )
        }
        return renderFn(this);
    }
}

const Dialogs = fnObserver(({dialogs}) => {

    const elements = [];

    for (let dialog of dialogs.values())
    {
        elements.push(
            <React.Fragment key={ dialog.id }>
                {
                    dialog.render()
                }
            </React.Fragment>
        )
    }

    return (
        <React.Fragment>
            {
                elements
            }
        </React.Fragment>
    )
})



/**
 * Renders the current set of dialogs opened with openDialog()
 * 
 * @returns {*}
 */
export function renderImperativeDialogs()
{
    return <Dialogs dialogs={ dialogs }/>
}


const setDialog = action("Dialog.setDialog",(dialogs, id, dialog) =>
{
    dialogs.set(dialog.id, dialog)
})


/**
 * Opens a dialog using the given render function. The render function receives a dialog API object with
 * which the rendered content can control the dialog.
 *
 * @param {Function} renderFn                   render function ( dialog => react element )
 * @param {object} [opts]       dialog options

 * @param {boolean} opts.simple             if true, openDialog will render the Modal and the caller only needs to render the content
 *                                          if false, the caller must render the complete dialog
 * @param {boolean} opts.fade               if true, fade the dialog in and out, Default is false. (non simple dialog must use this value)
 * @param {String} opts.size                size, default is "lg" (non simple dialog must use this value)
 * @param {*} opts.resultOnCancel           Title for the simple dialog or render function for title. If not given, no header is rendered.
 * @param {String|Function} opts.title      Title for the simple dialog or render function for title. If not given, no header is rendered.
 *
 * @returns {Promise<*>} promise resolving or rejecting when the dialog is confirmed or closes with an error.
 */
export function openDialog(renderFn, opts)
{
    return new Promise(
        (resolve, reject) => {

            const dialog = new DialogAPI(
                resolve,
                reject,
                renderFn,
                opts
            );

            setDialog(dialogs, dialog.id, dialog);
        }
    );
}
