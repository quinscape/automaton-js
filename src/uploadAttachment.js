import config from "./config";
import uri from "./uri";
import { formatGraphQLErrors } from "./graphql"
import createUnifiedErrors from "./util/createUnifiedErrors"
import triggerToastsForErrors from "./util/triggerToastsForErrors"
import { registerRequestForSession } from "./util/latestRequestInSession"


/**
 * Uploads the given file as attachment
 *
 * @category domain
 *
 * @param {String} attachmentId     attachment id to store the attachment under. Might be an already existing id.
 * @param {String} description      Description of the attachment / former file name
 * @param {String} type             Media type for the attachment. If this is an empty string, the Java side will guess the type
 * @param {File} [file]             File from an file input referencing the data to upload
 * @param {String} [url]            Optional url of the attachment.
 *
 * @return {Promise<void>}  resolves after the upload has completed successfully or rejects if not
 */
export default function uploadAttachment(attachmentId, description, type, file = null, url = "") {

    const { csrfToken } = config;

    if (!file && !url)
    {
        throw new Error("Need either file or url: " + JSON.stringify({attachmentId, description, type, file, url}))
    }
    if (file && url)
    {
        throw new Error("Cannot have both file and url: " + JSON.stringify({attachmentId, description, type, file, url}))
    }

    return fetch(
        uri("/_auto/upload-attachment", {
            attachmentId,
            description,
            type,
            url
        }),
        {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": type,
                // spring security enforces every POST request to carry a csrf token as either parameter or header
                [csrfToken.header]: csrfToken.value
            },
            body: file
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
                        "Network error during Attachment upload: " + formatGraphQLErrors(errors)
                    )
                );
            }

        )
        .then(result => {

            registerRequestForSession()

            if (!result || !result.data)
            {
                return Promise.reject(
                    new Error(
                        "Upload failed: " + formatGraphQLErrors(result && result.errors)
                    )
                );
            }
        })
}
