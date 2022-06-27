import { CONDITION_METHODS, FIELD_CONDITIONS, FIELD_OPERATIONS, Type } from "../FilterDSL";
import { InputSchema } from "domainql-form";
import get from "lodash.get"
import toPath from "lodash.topath"
import { DateTime } from "luxon"

const conditionImpl = {
    true: () => true,
    false: () => false,
    orNot: (a, b) => {
        return !(a || b);
    },
    andNot: (a, b) => {
        return !(a && b);
    },
    greaterOrEqual: (a, b) => {
        return a >= b;
    },
    lessOrEqual: (a, b) => {
        return a <= b;
    },
    lt: (a, b) => {
        return a < b;
    },
    notBetweenSymmetric: (a, b, c) => {
        return !conditionImpl.betweenSymmetric(a,b,c);
    },
    notEqualIgnoreCase: (a, b) => {
        // arguments are lowercased outside
        return !(a === b);
    },
    betweenSymmetric: (a, b, c) => {
        if (b < c)
        {
            return a >= b && a <= c;
        }
        else
        {
            return a >= c && a <= b;
        }
    },
    lessThan: (a, b) => {
        return a < b;
    },
    equalIgnoreCase: (a, b) => {
        // arguments are lowercased outside
        return a === b;
    },
    isDistinctFrom: false,
    between: (a, b, c) => {
        return a >= b && a <= c;
    },
    ge: (a, b) => {
        return a >= b;
    },
    greaterThan: (a, b) => {
        return a > b;
    },
    isNotNull: (a) => {
        return a !== null;
    },
    notLikeRegex: (a, b) => {
        // conversion to regex outside
        return !b.test(a)
    },
    notBetween: (a, b, c) => {
        return !(a >= b && a <= c);
    },
    notEqual: (a, b) => {
        return a !== b;
    },
    isFalse: (a) => {
        return a === false;
    },
    containsIgnoreCase: (a, b) => {
        // arguments are lowercased outside
        return a && a.indexOf(b) >= 0;
    },
    eq: (a, b) => {
        return a === b;
    },
    gt: (a, b) => {
        return a > b;
    },
    equal: (a, b) => {
        return a === b;
    },
    likeRegex: (a, b) => {
        // conversion to regex outside
        return b.test(a);
    },
    isTrue: (a) => {
        return a === true;
    },
    contains: (a, b) => {
        return a && a.indexOf(b) >= 0;
    },
    notContainsIgnoreCase: (a, b) => {
        // arguments are lowercased outside
        return !(a && a.indexOf(b) >= 0);
    },
    notContains: (a, b) => {
        return !(a && a.indexOf(b) >= 0);
    },
    ne: (a, b) => {
        return a !== b;
    },
    isNull: (a) => {
        return a === null;
    },
    endsWith: (a, b) => {
        if (!a)
        {
            return !!b;
        }
        return a.indexOf(b) === a.length - b.length;
    },
    le: (a, b) => {
        return a <= b;
    },
    isNotDistinctFrom: false,
    startsWith: (a, b) => {
        if (!a)
        {
            return !!b;
        }
        return a.indexOf(b) === 0;
    },
    in: (a, b) => {
        for (let i = 0; i < b.length; i++)
        {
            if (a === b[i])
            {
                return true;
            }
        }
        return false;
    }
};

const operationImpl = {
    bitNand: (a, b) => {
        return ~(a & b);
    },
    mod: (a, b) => {
        return a % b;
    },
    div: (a, b) => {
        return a/b;
    },
    neg: (a) => {
        return -a;
    },
    rem: (a, b) => {
        return a % b;
    },
    add: (a, b) => {
        return a + b;
    },
    subtract: (a, b) => {
        return a - b;
    },
    plus: (a, b) => {
        return a + b;
    },
    bitAnd: (a, b) => {
        return a & b;
    },
    bitXor: (a, b) => {
        return a ^ b;
    },
    shl: (a, b) => {
        return a << b;
    },
    unaryMinus: (a) => {
        return -a;
    },
    bitNor: (a, b) => {
        return ~(a | b);
    },
    shr: (a, b) => {
        return a >> b;
    },
    modulo: (a, b) => {
        return a % b;
    },
    bitXNor: (a, b) => {
        return ~(a ^ b);
    },
    bitNot: (a) => {
        return ~a;
    },
    sub: (a, b) => {
        return a - b;
    },
    minus: (a, b) => {
        return a - b;
    },
    mul: (a, b) => {
        return a * b;
    },
    bitOr: (a, b) => {
        return a | b;
    },
    times: (a, b) => {
        return a * b;
    },
    pow: (a, b) => {
        return Math.pow(a,b);
    },
    divide: (a, b) => {
        return a / b;
    },
    power: (a, b) => {
        return Math.pow(a,b);
    },
    multiply: (a, b) => {
        return a * b;
    },
    unaryPlus: (a) => {
        return +a;
    },
    asc: false,
    desc: false,

    lower: (a) => {
        return a.toLocaleLowerCase();
    },

    upper: (a) => {
        return a.toLocaleUpperCase();
    },

    toString: (a) => {
        return a !== null && a !== undefined ?  String(a) : null;
    },

    concat: (a,b) => {
        return (a !== null && a !== undefined ?  String(a) : "") + (b !== null && b !== undefined ?  String(b) : "");
    }
};

const filterFunctions = {
    "now" : (name, args) => DateTime.now(),
    "today" : (name, args) => DateTime.now().startOf("day"),
}

const IGNORE_CASE_SUFFIX = "IgnoreCase";

const FILTER_FUNCTION_TYPE = "FilterFunction"

/**
 * Internal method to recursively transform JSON conditions into values/functions.
 *
 * In contrast to filterTransformer() this method does not auto-wrap non-function values as functions.

 * @param {Object}      condition           JSON condition map
 * @param {Function}    resolverFactory     function that creates a field resolver function for a given field name
 *
 * @return {*}  transformed node
 */
function transform(condition, resolverFactory)
{
    const { type, name } = condition;

    switch(type)
    {
        case Type.FIELD:
            return resolverFactory(name);

        case Type.VALUE:
            const { scalarType, value } = condition

            if (scalarType === FILTER_FUNCTION_TYPE)
            {
                const { name, args } = value;
                return () => filterFunctions[name](name, args)
            }

            return InputSchema.valueToScalar(scalarType, value);

        case Type.VALUES:
        {
            const { values } = condition;
            return values.map( v => InputSchema.valueToScalar(condition.scalarType, v));
        }

        case Type.COMPONENT:
            return condition.condition ? transform(condition.condition, resolverFactory) : true;

        case Type.CONDITION:
        case Type.OPERATION:
        {
            const { operands : operandsIn } = condition;

            if (!Array.isArray(operandsIn))
            {
                throw new Error("No operands on " + JSON.stringify(condition))
            }

            const isCondition = type === Type.CONDITION;
            const operands = condition.operands.map( op => transform(op, resolverFactory))

            if (name === "and")
            {
                return () => {
                    for (let i = 0; i < operands.length; i++)
                    {
                        const op = operands[i];
                        const operand = typeof op === "function" ? op() : op;
                        if (!operand)
                        {
                            return false;
                        }
                    }
                    return true;
                }
            }
            else if (name === "or")
            {
                return () => {
                    for (let i = 0; i < operands.length; i++)
                    {
                        const op = operands[i];
                        const operand = typeof op === "function" ? op() : op;
                        if (operand)
                        {
                            return true;
                        }
                    }
                    return false;
                }
            }
            else if (name === "not")
            {
                return () => {
                    const op = operands[0];
                    return !(typeof op === "function" ? op() : op);
                };
            }

            const fn = (isCondition ? conditionImpl : operationImpl)[name];

            if (fn === false)
            {
                throw new Error(type.toLowerCase()+ " " + name + " is not supported in Javascript evaluation");
            }

            if (typeof fn !== "function")
            {
                throw new Error("Unknown " + type.toLowerCase() + " '" + name + "'");
            }

            let ignoresCase = false;

            if (isCondition)
            {
                const pos = name.lastIndexOf(IGNORE_CASE_SUFFIX);
                ignoresCase = pos >= 0 && pos === name.length - IGNORE_CASE_SUFFIX.length;
            }

            if (ignoresCase)
            {
                // precalculate lowercase variants of static arguments
                let operand = operands[0];
                if (typeof operand !== "function")
                {
                    operands[0] = operand && operand.toLowerCase();
                }
                operand = operands[1];
                if (typeof operand !== "function")
                {
                    operands[1] = operand && operand.toLowerCase();
                }
            }

            const isRegEx = name === "likeRegex" || name === "notLikeRegex";
            if (isRegEx && typeof operands[1] !== "function")
            {
                operands[1] = new RegExp(operands[1]);
            }



            const n = isCondition ?
                CONDITION_METHODS[name] !== undefined ? CONDITION_METHODS[name] : FIELD_CONDITIONS[name] :
                FIELD_OPERATIONS[name];
            const count = (n !== undefined ? n : -1 ) + 1;

            if (count < 0 || count > 3)
            {
                throw new Error("Unhandled count")
            }


            switch(count)
            {
                case 0:
                    return fn;
                case 1:
                {
                    const a = operands[0];
                    return typeof a === "function" ? () => fn(a()) : () => fn(a);
                }
                case 2:
                {
                    const a = operands[0];
                    const b = operands[1];

                    // all *IgnoreCase functions have two parameters
                    if (ignoresCase)
                    {

                        const aIsFunction = typeof a === "function";
                        const bIsFunction = typeof b === "function";

                        // the non-functions operands are toLowerCase()d once above
                        return () => {
                            const aVal = aIsFunction ? a()?.toLowerCase() : a;
                            const bVal = bIsFunction ? b()?.toLowerCase() : b;
                            return fn(aVal, bVal);
                        }
                    }
                    else
                    {
                        const aIsFunction = typeof a === "function";
                        const bIsFunction = typeof b === "function";

                        if (isRegEx && bIsFunction)
                        {
                            return fn(
                                aIsFunction ? a() : a,
                                new RegExp(b())
                            )
                        }

                        // the non-functions operands are toLowerCase()d once above
                        return () => {
                            const aVal = aIsFunction ? a() : a;
                            const bVal = bIsFunction ? b() : b;
                            return fn(aVal, bVal);
                        };
                    }
                    break;
                }
                case 3:
                {
                    const a = operands[0];
                    const b = operands[1];
                    const c = operands[2];

                    const aIsFunction = typeof a === "function";
                    const bIsFunction = typeof b === "function";
                    const cIsFunction = typeof c === "function";

                    if (!aIsFunction && !bIsFunction && !cIsFunction)
                    {
                        return fn(a, b, c);
                    }
                    else if (!aIsFunction && !bIsFunction && cIsFunction)
                    {
                        return () => fn(a, b, c());
                    }
                    else if (!aIsFunction && bIsFunction && !cIsFunction)
                    {
                        return () => fn(a, b(), c);
                    }
                    else if (!aIsFunction && bIsFunction && cIsFunction)
                    {
                        return () => fn(a, b(), c());
                    }
                    else if (aIsFunction && !bIsFunction && !cIsFunction)
                    {
                        return () => fn(a(), b, c);
                    }
                    else if (aIsFunction && !bIsFunction && cIsFunction)
                    {
                        return () => fn(a(), b, c());
                    }
                    else if (aIsFunction && bIsFunction && !cIsFunction)
                    {
                        return () => fn(a(), b(), c);
                    }
                    else if (aIsFunction && bIsFunction && cIsFunction)
                    {
                        return () => fn(a(), b(), c());
                    }
                    break;
                }
                default:
                    throw new Error("Unhandled number of arguments: " + count);
            }
            break;
        }
        default:
            throw new Error("Unhandled type + '" + type + "'");
    }

}

const TRUE = () => true;


/**
 * Filter transformer function that transforms a condition as JSON object to an executable JS function.
 *
 * @category iquery
 *
 * @param {Object}      condition           JSON condition map
 * @param {Function}    resolverFactory     function that creates a field resolver function for a given field name
 *                                          ( name => { return () => f(name) } )
 */
export default function filterTransformer(condition, resolverFactory)
{
    if (condition === null)
    {
        return TRUE;
    }
    const result = transform(condition, resolverFactory);

    if (typeof result === "function")
    {
        return result;
    }
    else
    {
        return () => result;
    }
}


/**
 * Default field resolver implementation for js object graphs.
 *
 * @category iquery
 *
 * @param {Object} current      initial object
 * @constructor
 */
export function FieldResolver(current = null)
{
    this.current = current;
    this.resolve = name => {
        const path = toPath(name);
        return () => {

            const { current } = this;
            if (!current)
            {
                throw new Error("No current object set in FieldResolver");
            }
            return get(current, path);
        }
    }
}
