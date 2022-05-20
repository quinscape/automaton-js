
let filterRenderer = {};

/**
 * Returns a stored filter renderer by alias
 *
 * @param {String} name filter renderer alias
 */
export function getCustomFilterRenderer(name) {
    if (name in filterRenderer) {
        return filterRenderer[name];
    }
    return null;
}

/**
 * Remove all stored filters
 */
export function removeAllCustomFilterRenderers()
{
    filterRenderer = {};
}

/**
 * Remove a stored filter renderer by alias
 *
 * @param {String} name filter renderer alias
 */
export function removeCustomFilterRenderer(name)
{
    filterRenderer[name] = null;
}

/**
 * Register new filter renderer alias
 *
 * @param {String} name filter renderer alias
 * @param {function|String} filterFn filter renderer function or name to be executed if filterRenderer is applied
 */
export function registerCustomFilterRenderer(name, filterFn)
{
    filterRenderer[name] = filterFn;
}