import config from "./config";
import uri from "./uri";


/**
 * Calls the attachment controller to delete the attachment with the given id.
 *
 * The deletion might fail if there are still references to the attachment in the database.
 *
 * @category domain
 * 
 * @param {String} attachmentId     attachment id
 * 
 * @return {Promise<void>} resolves after the promise has been successfully deleted, rejects otherwise
 */
export default function deleteAttachment(attachmentId)
{
    const { csrfToken } = config;

    return fetch(
        uri("/_auto/remove-attachment", {
            attachmentId
        }),
        {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                // spring security enforces every POST request to carry a csrf token as either parameter or header
                [csrfToken.header]: csrfToken.value
            },
            body: "0"
        }
    )
        .then(response => response.json())
        .then(result => {
            if (!result || !result.ok)
            {
                return Promise.reject(new Error("Upload removal failed"));
            }
        })

}

