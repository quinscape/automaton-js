import { useReducer } from "react"


/**
 * Simple counter hook
 * @param {Number} start        start value (default is 0)
 *
 * @return {Array.<Number,function>} counter / increase function
 */
export default function useCounter(start = 0)
{
    return useReducer(state => state + 1, start)
}
