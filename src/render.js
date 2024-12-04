import React from "react"
import ReactDOM from "react-dom"

/**
 * Renders the given React element and returns a promise that resolves when the rendering is done.
 *
 * @param {Element} elem      element to render
 * @param {String} [targetId]       Id attribute of the element to render into (default is our "root" element)
 * 
 * @return {Promise}  promise that resolves after the element has rendered. Exceptions happening during the ReactDOM.render call will cause a rejection of the promise.
 */
export default function render(elem, targetId = "root") {

    if (!React.isValidElement(elem))
    {
        throw new Error("Not a valid react element: " + elem);
    }

    return new Promise(
        (resolve, reject) => {
            try
            {
                ReactDOM.render(
                    elem,
                    document.getElementById(targetId),
                    resolve
                );
                scrollTo(0, 0);
            }
            catch (e)
            {
                reject(e);
            }
        }
    );
}
