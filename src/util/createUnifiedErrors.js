/**
 * Helper method to create an unified errors array with a single error message
 *
 * @param {String} message      error message
 * @param {boolean|Number} autoClose    Whether to automatically close the toast after a while (default true, can be ms to autoClose)
 * @returns array with one error
 */
export default function createUnifiedErrors(message, autoClose = true)
{
    return [
        {
            message,
            path: [],
            autoClose
        }
    ]
}
