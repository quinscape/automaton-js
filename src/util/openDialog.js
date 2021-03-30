import { DialogAPI, setDialog } from "../ui/Dialog";


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

            setDialog(dialog.id, dialog);
        }
    );
}
