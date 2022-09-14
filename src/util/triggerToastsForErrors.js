import { SESSION_EXPIRED } from "../process/Process"
import i18n from "../i18n"
import { toast } from "react-toastify"

/**
 * Triggers an error toast for every error contained in the GraphQL-ish errors array we use for unified error signaling
 * @param {Array} errors    errors array
 */
export default function triggerToastsForErrors(errors)
{

    if (!Array.isArray(errors))
    {
        console.error("NOT AN ARRAY", errors)
        throw new Error("errors is not an array: " + errors)
    }

    errors.forEach(
        error => {
            const message = error.message === SESSION_EXPIRED ?
                i18n("Session Expired Message") :
                error.message

            toast(
                message,
                {
                    type: "error",
                    autoClose: error.autoClose ?? false
                }
            )
        }
    )

}
