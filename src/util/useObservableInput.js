
import { useEffect, useState } from "react"
import { reaction } from "mobx"

function increment(n)
{
    return n + 1;
}



/**
 * Helper to have a React hook input value for an observable expression, changing whenever the observable is
 * observed to change
 *
 * @param {Function} expression     expression returning a representative value of an observable
 * @param {Object}  reactionOpts    options passed-through to the reaction ( https://mobx.js.org/refguide/reaction.html )
 */
export default function useObservableInput(expression, reactionOpts)
{
    const [ counter, setCounter ] = useState(0);

    useEffect(
        () => reaction(
            () => {
                const result = expression();

                //console.log("useObservableInput Expression => ", result);

                return result;
            },
            result => {
                //console.log("useObservableInput increment")
                return setCounter(increment);
            },
            reactionOpts
        ),
        []
    );

    //console.log("useObservableInput counter = ", counter);

    return counter;
}
