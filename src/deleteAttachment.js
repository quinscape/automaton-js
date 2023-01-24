import config from "./config";
import uri from "./uri";
import { formatGraphQLErrors } from "./graphql"
import createUnifiedErrors from "./util/createUnifiedErrors"
import triggerToastsForErrors from "./util/triggerToastsForErrors"
import { registerRequestForSession } from "./util/latestRequestInSession"


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
        .then(
            response => response.json(),
            err => {
                // network errors
                const errors = createUnifiedErrors(err.message)
                triggerToastsForErrors( errors )
                return Promise.reject(
                    new Error(
                        "Network error during upload removal:" + formatGraphQLErrors(errors)
                    )
                );
            }
        )
        .then(result => {
            if (!result || !result.data)
            {
                return Promise.reject(
                    new Error(
                        "Upload removal failed:" + formatGraphQLErrors(result && result.errors)
                    )
                );
            }

            registerRequestForSession()
        })

}

