/**
 * Returns a promise that resolves after the given amount of milliseconds
 *
 * @param {Number} timeout      milliseconds to sleep
 *
 * @returns {Promise<void>}
 */
export default function sleep(timeout)
{
    return new Promise( resolve => {
        setTimeout(resolve, timeout);
    });
}
