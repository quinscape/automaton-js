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

/**
 * Logical not condition.
 *
 * @type {function(...Condition): Condition}
 */
export const not = buildGlobal("not", 1);
/**
 * Logical or condition.
 *
 * @type {function(...Condition): Condition}
 */
export const or = buildGlobal("or");
/**
 * Logical and condition.
 *
 * @type {function(...Condition): Condition}
 */
export const and = buildGlobal("and");

function buildGlobal(name, numArgs)
{
    return function (... args) {
        const cond = new Condition(name);
        cond.operands = numArgs !== undefined ? args.slice(0, numArgs) : args;
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

function Condition(name)
{
    this.type = Type.CONDITION;
    this.name = name;
}

buildProto(Condition.prototype, CONDITION_METHODS, buildFn);


/**
 * General Condition node. Useful for programmatically instantiating conditions. Not needed for fluent style conditions.
 * (e.g. `field("name").containsIgnoreCase(value("abc"))` )
 * 
 * @param {String} name     condition name
 * @return {Condition}
 */
export function condition(name)
{
    return new Condition(name);
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
 * @param {String} id               component id
 * @param {Condition} condition     actual condition for component
 * @return {{condition: *, id: *, type: string}}
 */
export function component(id, condition = null)
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
    else if (value instanceof Date)
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
        return name.length;
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
    const { operands } = conditionNode;
    for (let i = 0; i < operands.length; i++)
    {
        const operand = operands[i];
        if (operand.type === Type.COMPONENT && operand.id === id)
        {
            return operand;
        }
    }
    return null;
}
