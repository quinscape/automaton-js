import { DateTime } from "luxon";

const LOCAL_STORAGE_KEY = "__automaton-latest-request"
/**
 * Registers that a request has just happened in the current HTTP session. This will propagate to all windows/tabs
 * connected to localStorage
 */
export function registerRequestForSession()
{
    localStorage.setItem(LOCAL_STORAGE_KEY, DateTime.now().toISO())
}

/**
 * Returns the DateTime of the latest registered request in the scope of the current HTTP session, across tabs/windows.
 *
 * @return {DateTime} DateTime of the latest request across all windows/tabs
 */
export default function latestRequestInSession()
{
    let value = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!value)
    {
        // Since we always register the request on startup, there *has* to be a value set.
        // Unless we used lastRequestInSession() before startup has finished. Don't do that.
        throw new Error("No request registered");
    }

    return DateTime.fromISO(value)
}
