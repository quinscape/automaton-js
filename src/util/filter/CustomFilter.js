let filter = {};
let getValue = {};
let getTemplate = {};

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
 * Returns a stored template function by alias
 *
 * @param {String} name filter alias
 */
export function getCustomGetTemplate(name) {
    if (name in getTemplate) {
        return getTemplate[name];
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
    getTemplate = {};
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
    getTemplate[name] = null;
}

/**
 * Register new filter alias
 *
 * @param {String} name filter alias
 * @param {function|String} [filterFn] function or name to be executed if filter is applied
 * @param {function} [getValueFn] function to extract filter value from condition object
 * @param {function} [getTemplateFn] function to determine template value for condition extraction
 */
export function registerCustomFilter(name, filterFn, getValueFn, getTemplateFn)
{
    if (typeof filterFn === "function" || typeof filterFn === "string") {
        filter[name] = filterFn;
    }
    if (typeof getValueFn === "function") {
        getValue[name] = getValueFn;
    }
    if (typeof getTemplateFn === "function") {
        getTemplate[name] = getTemplateFn;
    }
}