import React from "react"
import ReactDOM from "react-dom"

/**
 * Renders the given React element and returns a promise that resolves when the rendering is done.
 *
 * @param {React.Element} elem      element to render
 * @param {String} [targetId]       Id attribute of the element to render into (default is our "root" element)
 * 
 * @return {Promise<any>}
 */
export default function render(elem, targetId = "root") {

    if (!React.isValidElement(elem))
    {
        throw new Error("Not a valid react element: " + elem);
    }

    return new Promise(
        resolve =>
            ReactDOM.render(
                elem,
                document.getElementById(targetId),
                resolve
            )
    );
}
