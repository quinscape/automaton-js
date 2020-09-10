import { or } from "./FilterDSL";


/**
 * Condition builder helper similar to the NPM "classnames" function for classnames.
 *
 * Each element is evaluated for being a condition expression. If the value is null or false, it is ignored.
 *
 * If only one element is a condition, that condition will be returned as-is.
 *
 * If multiple elements are conditions, they will be combined with an or() expression.
 *
 * If no elements are conditions, `null` is returned (i.e. empty condition / always true)
 *
 * @param {...Object} elements      varargs of conditions
 * @return  {null|Object} Filter DSL condition
 */
export default function conditionBuilder(... elements) {
    const operands = [];

    for (let i = 0; i < elements.length; i++)
    {
        const condition = elements[i];
        if (typeof condition === "object")
        {
            operands.push(condition);
        }
    }

    if (operands.length === 0)
    {
        return null;
    }
    if (operands.length === 1)
    {
        return operands[0];
    }
    return or(...operands);
}
