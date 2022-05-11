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

/**
 * Remove all stored filters
 */
export function removeAllCustomFilters()
{
    filter = {};
}

/**
 * Remove a stored filter by alias
 *
 * @param {String} name                     filter alias
 */
export function removeCustomFilter(name)
{
    filter[name] = null;
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