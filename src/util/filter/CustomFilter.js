let filter = {};
let getValue = {};

/**
 * Returns a stored filter function by alias
 *
 * @param {String} name filter alias
 */
export function getCustomFilter(name) {
    if (name in filter) {
        return filter[name];
    }
    return null;
}

/**
 * Returns a stored getValue function by alias
 *
 * @param {String} name filter alias
 */
export function getCustomGetValue(name) {
    if (name in getValue) {
        return getValue[name];
    }
    return null;
}

/**
 * Remove all stored filters
 */
export function removeAllCustomFilters()
{
    filter = {};
    getValue = {};
}

/**
 * Remove a stored filter by alias
 *
 * @param {String} name filter alias
 */
export function removeCustomFilter(name)
{
    filter[name] = null;
    getValue[name] = null;
}

/**
 * Register new filter alias
 *
 * @param {String} name filter alias
 * @param {function|String} filterFn function or name to be executed if filter is applied
 * @param {function} [getValueFn] function to extract filter value from condition object
 */
export function registerCustomFilter(name, filterFn, getValueFn)
{
    if (typeof filterFn === "function" || typeof filterFn === "string") {
        filter[name] = filterFn;
    }
    if (typeof getValueFn === "function") {
        getValue[name] = getValueFn;
    }
}