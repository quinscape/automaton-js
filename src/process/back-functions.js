/**
 * Returns to the first state that is not the source state of the given transition.
 *
 * @category process
 *
 * @param {Transition} t    transition instance
 *
 * @return {function(*): boolean} back function
 */
export function backToParent(t)
{
    return e => e.state !== t.source;
}

/**
 * Returns to the first state that is not the source state of the given transition.
 *
 * @param {Number} id   history id
 *
 * @return {function(*): boolean} back function
 * @param id
 */
export function backToHistoryId(id)
{
    return e => e.id === id;
}
