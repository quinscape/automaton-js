const FilterDSL = require("./lib/FilterDSL");

const compileFilter = require("./lib/util/compileFilter").default;
const decompileFilter = require("./lib/util/decompileFilter").default;
const getFilterExpressionAST = require("./lib/util/getFilterExpressionAST").default;


const {

    and,
    or,
    not,

    condition,
    operation,
    field,
    component,
    value,
    values,

    Type,

    isCondition,
    isConditionObject,
    getConditionArgCount,
    isLogicalCondition,
    isComposedComponentExpression,
    findComponentNode,
    toJSON,

    FIELD_CONDITIONS,
    CONDITION_METHODS,
    FIELD_OPERATIONS,

    now,
    today
    
} = FilterDSL;

// base DSL methods
exports.and = and;
exports.or = or;
exports.not = not;

exports.condition = condition;
exports.operation = operation;
exports.field = field;
exports.component = component;
exports.value = value;
exports.values = values;

// condition types
exports.Type = Type;

// helper functions
exports.isCondition = isCondition;
exports.isConditionObject = isConditionObject;
exports.getConditionArgCount = getConditionArgCount;
exports.isLogicalCondition = isLogicalCondition;
exports.isComposedComponentExpression = isComposedComponentExpression;
exports.findComponentNode = findComponentNode;
exports.toJSON = toJSON;

// reflection basically
exports.FIELD_CONDITIONS = FIELD_CONDITIONS;
exports.CONDITION_METHODS = CONDITION_METHODS;
exports.FIELD_OPERATIONS = FIELD_OPERATIONS;

// Filter Functions
exports.now = now;
exports.today = today;

// compiling / decompiling expressions
exports.compileFilter = compileFilter;
exports.decompileFilter = decompileFilter
exports.getFilterExpressionAST = getFilterExpressionAST
