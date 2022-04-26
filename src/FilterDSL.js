import { DateTime } from "luxon";

/**
 * Node type constants.
 * 
 * @type {{OPERATION: string, FIELD: string, CONDITION: string, COMPONENT: string, VALUE: string, VALUES: string}}
 */
export const Type = {
    FIELD : "Field",
    CONDITION : "Condition",
    VALUE : "Value",
    VALUES : "Values",
    OPERATION : "Operation",
    COMPONENT : "Component"
};

const validTypeValues = Object.values(Type);

export function isCondition(value)
{
    if (!isConditionObject(value))
        return false;

    return validTypeValues.indexOf(value.type) >= 0;
}

/**
 * Condition name
 *
 * @typedef ConditionNode
 * @type {object}

 * @property {String} type                          node type
 * @property {String} [name]                        name for CONDITION or OPERATION or FIELD
 * @property {Object} [value]                       value
 * @property {Object} [scalarType]                  scalar type
 * @property {Array<ConditionNode>} [operands]      operands for OPERATION or CONDITION
 * @property {Object} [condition]                   singular condition child for COMPONENT
 */

/**
 * Logical not condition.
 *
 *
 * @param {ConditionNode} operand
 * @return {ConditionNode} negated condition
 */
export function not(operand)
{
    if (isConditionObject(operand))
    {
        const cond = new Condition("not");
        cond.operands = [ operand ];
        return cond;
    }

    const cond = new Condition("false");
    cond.operands = [];
    return cond;
}

/**
 * Logical or condition. Will ignore falsy operands.
 *
 * @param {... ConditionNode} operands
 * @return {ConditionNode} ORed condition
 */
export const or = buildLogical("or");
/**
 * Logical and condition. Will ignore falsy operands.
 *
 * @param {... ConditionNode} operands
 * @return {ConditionNode} ANDed condition
 */
export const and = buildLogical("and");

function buildLogical(name)
{
    return function (... args) {

        const operands = [];

        const len = args.length

        for (let i = 0; i < len; i++)
        {
            const condition = args[i];
            if (isConditionObject(condition))
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

        const cond = new Condition(name);
        cond.operands = operands;
        return cond;
    }
}

function buildFn(name, numArgs)
{
    return function (... args) {
        const cond = new Condition(name);
        cond.operands = [ this, ... args.slice(0, numArgs) ];
        return cond;
    }
}

function buildOpFn(name, numArgs)
{
    return function (... args) {
        const op = new Field(name);
        op.type = Type.OPERATION;
        op.operands = [ this, ... args.slice(0, numArgs) ];
        return op;
    }
}

export const FIELD_CONDITIONS = {
    "greaterOrEqual":1,
    "lessOrEqual":1,
    "lt":1,
    "notBetweenSymmetric":2,
    "notEqualIgnoreCase":1,
    "betweenSymmetric":2,
    "lessThan":1,
    "equalIgnoreCase":1,
    "isDistinctFrom":1,
    "between":2,
    "ge":1,
    "greaterThan":1,
    "isNotNull":0,
    "notLikeRegex":1,
    "notBetween":2,
    "notEqual":1,
    "isFalse":0,
    "containsIgnoreCase":1,
    "eq":1,
    "gt":1,
    "equal":1,
    "likeRegex":1,
    "isTrue":0,
    "contains":1,
    "notContainsIgnoreCase":1,
    "notContains":1,
    "ne":1,
    "isNull":0,
    "endsWith":1,
    "le":1,
    "isNotDistinctFrom":1,
    "startsWith":1,
    // 1 collection arg
    "in" : 1
};

export const CONDITION_METHODS = {
    "not":0,
    "or":1,
    "orNot":1,
    "and":1,
    "andNot":1
};

export const FIELD_OPERATIONS = {
    "bitNand":1,
    "mod":1,
    "div":1,
    "neg":0,
    "rem":1,
    "add":1,
    "subtract":1,
    "plus":1,
    "bitAnd":1,
    "bitXor":1,
    "shl":1,
    "unaryMinus":0,
    "bitNor":1,
    "shr":1,
    "modulo":1,
    "bitXNor":1,
    "bitNot":0,
    "sub":1,
    "minus":1,
    "mul":1,
    "bitOr":1,
    "times":1,
    "pow":1,
    "divide":1,
    "power":1,
    "multiply":1,
    "unaryPlus":0,
    "lower":0,
    "upper":0,
    "concat": 1,

    // toString is special and gets translated into a cast(String.class)
    "toString":0,

    // for sort order fields
    "asc":0,
    "desc":0
};

function buildProto(proto, methodsMap, factory)
{
    for (let name in methodsMap)
    {
        if (methodsMap.hasOwnProperty(name))
        {
            const numArgs = methodsMap[name];

            proto[name] = factory(name, numArgs);
        }
    }
}

function Field(name)
{
    this.type = Type.FIELD;
    this.name = name;
}

buildProto(Field.prototype, FIELD_CONDITIONS, buildFn);
buildProto(Field.prototype, FIELD_OPERATIONS, buildOpFn);

export function Condition(name)
{
    this.type = Type.CONDITION;
    this.name = name;
}

buildProto(Condition.prototype, CONDITION_METHODS, buildFn);


export function isConditionObject(value)
{
    return value && typeof value === "object";
}

/**
 * General Condition node. Useful for programmatically instantiating conditions. Not needed for fluent style conditions.
 * 
 * @param {String} name                     condition name
 * @param {Array<ConditionNode>} operands   operands
 * @return {ConditionNode}
 */
export function condition(name, operands = [])
{
    const condition = new Condition(name);
    condition.operands = operands
    return condition;
}

export function operation(name, operands)
{
    const op = new Field(name);
    op.type = Type.OPERATION;
    op.operands = operands;
    return op;
}


/**
 * Field / column reference.
 *
 * @param {String} name     field name (e.g. "name", "owner.name")
 * @return {Field}
 */
export function field(name)
{
    return new Field(name);
}


/**
 * Component condition node. These nodes are just marker for which part of the condition originated from which component
 * Logically they are evaluated as the condition they wrap.
 *
 * @param {String} id                   component id
 * @param {ConditionNode} condition     actual condition for component
 *
 * @return {ConditionNode}
 */
export function component(id, condition)
{
    return {
        type: Type.COMPONENT,
        id,
        condition
    };
}


function Value(type, value, name = null)
{
    this.type = Type.VALUE;
    this.scalarType = type;
    this.value = value;
    this.name = name;
}

buildProto(Value.prototype, FIELD_CONDITIONS, buildFn);
buildProto(Value.prototype, FIELD_OPERATIONS, buildOpFn);

function Values(type, values)
{
    this.type = Type.VALUES;
    this.scalarType = type;
    this.values = values;
}


function getDefaultType(value)
{
    if (typeof value === "string")
    {
        return "String"
    }
    else if (typeof value === "number")
    {
        return "Int"
    }
    else if (typeof value === "boolean")
    {
        return "Boolean"
    }
    else if (value instanceof DateTime)
    {
        return "Timestamp"
    }
    else
    {
        throw new Error(
            "Could not determine scalar type for value: " + value + ".\n" +
            "Please define the correct scalar type as second argument to value()."
        )
    }
}


/**
 * Creates a new value node
 *
 * @param {Object} value    scalar value of appropriate type
 * @param {String} [type]   scalar type name if not given the type will be selected based on value type
 * @param {String} [name]   Field name
 *
 * @return {Value} value node
 */
export function value(value, type = getDefaultType(value), name)
{



    return new Value(type, value, name);
}

/**
 * Creates a new values node that encapsulates a collection of scalar values (for e.g. the IN operator)
 *
 * @param {String} type     scalar type name
 * @param {Object} values   var args of scalar value of appropriate type
 *
 * @return {Values} values node
 */
export function values(type, ... values)
{
    return new Values(type, values);
}

// function join(a,b)
// {
//     if (a === "")
//     {
//         return b;
//     }
//     else
//     {
//         return a + "." + b;
//     }
// }

/**
 * Returns the number of expected arguments for the condition with the given name.
 *
 * @param {String} name     condition name
 *
 * @return {number} number of value arguments expected
 */
export function getConditionArgCount(name)
{
    if (typeof name === "function")
    {
        return name.length - 1;
    }

    const count = CONDITION_METHODS[name] || FIELD_CONDITIONS[name];

    //console.log("getConditionArgCount, name = " + name , count);

    return typeof count === "number" ? count : 1
}


/**
 * Returns true if the given condition node is either a logical and or a logical or condition.
 *
 * @param {Object} node     node
 * @return {boolean}    true if the node is either an "and" or an "or"
 */
export function isLogicalCondition(node)
{
    return (
        node &&
        node.type === Type.CONDITION &&
        (
            node.name === "and" ||
            node.name === "or"
        )
    );
}

export function isComposedComponentExpression(node)
{
    return isLogicalCondition(node) && node.operands.every( o => o.type === Type.COMPONENT)
}


/**
 * Finds a component node with the given id.
 *
 * @param {Object} conditionNode    condition structure root
 * @param {String} id               component id
 *
 * @return {Object|null}    component node or `null`
 */
export function findComponentNode(conditionNode, id)
{
    if (conditionNode.type === Type.COMPONENT)
    {
        return conditionNode.id === id ? conditionNode : null;
    }

    if (isComposedComponentExpression(conditionNode))
    {
        const { operands } = conditionNode;

        if (operands)
        {
            for (let i = 0; i < operands.length; i++)
            {
                const operand = operands[i];
                if (operand.type === Type.COMPONENT && operand.id === id)
                {
                    return operand;
                }
            }
        }
        return null;
    }
    else
    {
        return id === null ? component(null, conditionNode) : null;
    }


}


/**
 * Converts the given condition graph into simple js objects.
 *
 * The Filter DSL produces Filter nodes that are in fact instances of the Filter DSL types used to implement to
 * conditions/operations. This works fine in many case, but sometimes it doesn't.
 *
 * One example is that mobx will ignore the instances and not create observables for them. Making the FilterDSL in general
 * observable would be possible, but would mean a huge overhead for a very exotic use-case.
 *
 * @param {Object} condition    Input condition, potentially consisting of DSL instances
 * @return {Object} condition as graph of objects / arrays
 */
export function toJSON(condition)
{
    if (!condition)
    {
        return null;
    }

    const { type } = condition;

    if (type === Type.CONDITION || type === Type.OPERATION)
    {
        const { name, operands } = condition;

        return {
            type,
            name,
            operands: operands.map( o => toJSON(o))
        }
    }
    else if (type === Type.COMPONENT)
    {
        const { id, condition } = condition;

        return {
            type,
            id,
            condition: toJSON(condition)
        }
    }
    else if (type === Type.FIELD)
    {
        const { name } = condition;

        return {
            type,
            name
        }
    }
    else if (type === Type.VALUE)
    {
        const { scalarType, value } = condition;

        return {
            type,
            scalarType,
            value
        }
    }
    else if (type === Type.VALUES)
    {
        const { scalarType, values } = condition;

        return {
            type,
            scalarType,
            values
        }
    }
    else
    {
        throw new Error("Invalid condition node: " + condition);
    }
}


function filterFunction(name, args = [])
{
    return value(
        {
            name,
            args
        },
        "FilterFunction"
    )
}


export function now()
{
    return filterFunction("now")
}

export function today()
{
    return filterFunction("today")
}

/**
 * The automaton filter DSL creates object graphs representations of filter expressions that can be evaluated as SQL, on
 * Java objects and on JavaScript objects.
 *
 * @category iquery
 *
 */
const FilterDSL = {
    /**
     * Logical not condition.
     *
     *
     * @param {ConditionNode} operand
     * @return {ConditionNode} negated condition
     */
    not,

    /**
     * Logical or condition. Will remove null conditions
     *
     * @param {... ConditionNode} operands
     * @return {ConditionNode} ORed condition
     */
    or,

    /**
     * Logical or condition. Will ignore falsy operands.
     *
     * @param {... ConditionNode} operands
     * @return {ConditionNode} ORed condition
     */
    and,

    /**
     * General Condition node. Useful for programmatically instantiating conditions. Not needed for fluent style conditions.
     *
     * @param {String} name                     condition name
     * @param {Array<ConditionNode>} operands   operands
     * @return {ConditionNode}
     */
    condition,
    /**
     * Field / column reference.
     *
     * @param {String} name     field name (e.g. "name", "owner.name")
     * @return {Field}
     */
    field,

    /**
     * Component condition node. These nodes are just marker for which part of the condition originated from which component
     * Logically they are evaluated as the condition they wrap.
     *
     * @param {String} id                   component id
     * @param {ConditionNode} condition     actual condition for component
     *
     * @return {ConditionNode}
     */
    component,

    /**
     * Creates a new value node
     *
     * @param {Object} value    scalar value of appropriate type
     * @param {String} [type]   scalar type name if not given the type will be selected based on value type
     *
     * @return {Value} value node
     */
    value,

    /**
     * Creates a new values node that encapsulates a collection of scalar values (for e.g. the IN operator)
     *
     * @param {String} type     scalar type name
     * @param {Object} values   var args of scalar value of appropriate type
     *
     * @return {Values} values node
     */
    values,

    /**
     * Returns the number of expected arguments for the condition with the given name.
     *
     * @param {String} name     condition name
     *
     * @return {number} number of value arguments expected
     */
    getConditionArgCount,

    /**
     * Returns true if the given condition node is either a logical and or a logical or condition.
     *
     * @param {Object} node     node
     * @return {boolean}    true if the node is either an "and" or an "or"
     */
    isLogicalCondition,

    /**
     * Finds a component node with the given id.
     *
     * @param {Object} conditionNode    condition structure root
     * @param {String} id               component id
     *
     * @return {Object|null}    component node or `null`
     */
    findComponentNode,

    /**
     * Node type constants.
     *
     * @type {{OPERATION: string, FIELD: string, CONDITION: string, COMPONENT: string, VALUE: string, VALUES: string}}
     */
    Type,

    toJSON
}

export default FilterDSL;

