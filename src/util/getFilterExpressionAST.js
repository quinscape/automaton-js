import jsep from "jsep"
import objectPlugin from "@jsep-plugin/object"

// we need object literals for some value() expressions, e.g. computed values
jsep.plugins.register(objectPlugin);

// deopify our expression language. We can only use FilterDSL operation and since we have no operator overloading in
// normal js, we don't want it here either
jsep.removeBinaryOp("+");
jsep.removeBinaryOp("-");
jsep.removeBinaryOp("*");
jsep.removeBinaryOp("/");
jsep.removeBinaryOp("%");
jsep.removeBinaryOp("==");
jsep.removeBinaryOp("!=");
jsep.removeBinaryOp("===");
jsep.removeBinaryOp("!==");
jsep.removeBinaryOp("<");
jsep.removeBinaryOp("<=");
jsep.removeBinaryOp(">");
jsep.removeBinaryOp(">=");
jsep.removeBinaryOp("<<");
jsep.removeBinaryOp(">>");
jsep.removeBinaryOp(">>>");
jsep.removeBinaryOp("&");
jsep.removeBinaryOp("|");
jsep.removeBinaryOp("^");
jsep.removeBinaryOp("in");
jsep.removeBinaryOp("instanceof");

jsep.removeUnaryOp("-");
jsep.removeUnaryOp("+");
jsep.removeUnaryOp("!");
jsep.removeUnaryOp("~");
jsep.removeUnaryOp("typeof");
jsep.removeUnaryOp("void");
jsep.removeUnaryOp("delete");

/**
 * Converts a FilterDSL expression into a FilterDSL JSON graph. It supports only a limited subset of JavaScript (no operators
 * or assignments) and only the FilterDSL identifiers plus "DateTime.fromISO" expressions for DateTime values.
 *
 * @param {String}  src     expression source
 * @return {Object} condition estree AST
 */
export default function getFilterExpressionAST(src)
{
    return jsep.parse(src)
}
