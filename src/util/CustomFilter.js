let filter = {};

/**
 * Returns a stored filter by alias
 *
 * @param {String} name                     filter alias
 */
export function getCustomFilter(name) {
    if (name in filter) {
        return filter[name];
    }
    return null;
}

export function resetConverter()
{
    filter = {};
}

/**
 * Register new filter alias
 *
 * @param {String} name                     filter alias
 * @param {function|String} filterFn        filter function or name to be executed if filter is applied
 */
export function registerCustomFilter(name, filterFn)
{
    filter[name] = filterFn;
}