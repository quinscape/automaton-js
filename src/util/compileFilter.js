import {
    and,
    or,
    not,
    field,
    component,
    value,
    values,
    now,
    today,
    FIELD_CONDITIONS,
    FIELD_OPERATIONS
} from "../FilterDSL"
import { DateTime } from "luxon"
import getFilterExpressionAST from "./getFilterExpressionAST"

const PROP_POSITIVE_LIST = [
    ... Object.keys(FIELD_CONDITIONS),
    ... Object.keys(FIELD_OPERATIONS)
]

const env = { and, or, not, field, component, value, values, now, today }

/**
 * Converts the given array of JavaScript AST nodes to an array of condition nodes.
 *
 * @param exprNodes     array of AST nodes
 * 
 * @return {Array<*>} array of condition nodes
 */
function convertASTOperands(exprNodes)
{
    const nodes = exprNodes.map(convertAST)

    // console.log("convertASTOperands IN", JSON.stringify(exprNodes, null, 4))
    // console.log("convertASTOperands OUT", JSON.stringify(nodes, null, 4))

    return nodes
}


/**
 * Converts the given JavaScript AST node to a FilterDSL condition node.
 *
 * @param {Object}  expr    AST node (estree compatible)
 *
 * @return {*} condition node translation
 */
function convertAST(expr)
{
    if (!expr)
    {
        throw new Error("Invalid expression node")
    }

    if (expr.type === "CallExpression" )
    {
        const { type: calleeType } = expr.callee

        if (calleeType === "Identifier")
        {
            const { name } = expr.callee
            const fn = env[name]
            if (!fn)
            {
                throw new Error("Unknown identifier: " + name)
            }
            return fn.apply(null, convertASTOperands(expr.arguments))
        }
        else if (calleeType === "MemberExpression")
        {
            const { object, property } = expr.callee

            if (property.type !== "Identifier")
            {
                throw new Error("Only identifier properties are allowed")
            }

            const propName = property.name
            if (object.type === "Identifier" && object.name === "DateTime")
            {
                if (propName !== "fromISO" || expr.arguments.length !== 1 )
                {
                    throw new Error("Invalid DateTime expression. Only DateTime.fromISO(\"\") is allowed");
                }
                const isoValue = expr.arguments[0].value
                return DateTime.fromISO(isoValue)
            }
            else
            {
                if (PROP_POSITIVE_LIST.indexOf(propName) < 0)
                {
                    throw new Error("Invalid field method: "  + propName )
                }

                const obj = convertAST(object)
                return obj[propName].apply(obj, convertASTOperands(expr.arguments))
            }
        }
    }
    else if (expr.type === "Literal")
    {
        return expr.value
    }
    else if (expr.type === "Identifier")
    {
        const v = env[expr.name]
        if (!v)
        {
            throw new Error("Unknown identifier: " + expr.name)
        }
        return v
    }
    else if (expr.type === "ObjectExpression")
    {
        const out = {}

        expr.properties.forEach(prop => {
            const key = prop.key.type === "Identifier" ? prop.key.name : prop.key.value
            const value = prop.value.value

            out[key] = value;
        })

        return out
    }

    throw new Error("Invalid AST node: type = " + expr.type)
}



/**
 * Parses the given Filter DSL expression string and returns the corresponding FilterDSL condition node graph.
 *
 * Note that the expression will be generated with the Filter DSL api, which means that e.g. Field instances are
 * included in the graph. If you need the output in strict JSON environment, you need to run it through toJSON().
 *
 * @param {String|Object} src   FilterDSL expression. Supports DateTime.fromISO for DateTime values.
 *                              Can be provided as source string as well as AST.
 * 
 * @return {*} FilterDSL JSON object graph.
 */
export default function compileFilter(src)
{
    const ast = typeof src === "string" ? getFilterExpressionAST(src) : src
    //console.log("AST", JSON.stringify(ast, null, 4))
    return convertAST(ast);
}
