/**
 * Returns to the first state that is not the source state of the given transition.
 *
 * @param {Transition} t    transition instance
 *
 * @return {function(*): boolean} back function
 */
export function backToParent(t)
{
    return e => e.state !== t.source;
}
