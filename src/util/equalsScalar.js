/**
 * Compares for instance equality
 * @param {*} a      date a
 * @param {*} b      date b
 *
 * @returns {boolean}   true if a equals b
 */
function identityEquals(a, b)
{
    return a === b;
}


/**
 * Compares dates for equality
 * @param {Date} a      date a
 * @param {Date} b      date b
 *
 * @returns {boolean}   true if a equals b
 */
function dateTimeEquals(a, b)
{
    a = a ? +a : null;
    b = b ? +b : null;

    // quick comparison by milliseconds
    return a === b;
}


/**
 * Default scalar equality configuration
 */
const equalsImpls = {
    "Int": identityEquals,
    "Float": identityEquals,
    "String": identityEquals,
    "Boolean": identityEquals,
    "ID": identityEquals,
    "Long": identityEquals,
    "Short": identityEquals,
    "Byte": identityEquals,
    "BigInteger": identityEquals,
    "BigDecimal": identityEquals,
    "Char": identityEquals,
    "Timestamp": dateTimeEquals,
    "Date": dateTimeEquals
};


/**
 * Registers a new equality function for the given scalar type.
 *
 * @param {String} scalarType   scalar type
 * @param {Function} fn         equality functions
 *
 */
export function registerScalarEquals(scalarType, fn)
{
    equalsImpls[scalarType] = fn;
}


/**
 * Returns true when the given scalar values are equal. The equality rules are scalar type dependent.
 * Many scalar types use instance equality ( === ), while e.g. the Date based types compare time stamps.
 *
 * @param {String} scalarType   scalar type name
 * @param {*} a                 scalar value a
 * @param {*} b                 scalar value b
 *
 * @returns {boolean}   true if scalar values are equal
 *
 */
export default function equalsScalar(scalarType, a, b) {
    const eq = equalsImpls[scalarType];
    if (!eq)
    {
        throw new Error(`No equals registered for '${scalarType}'`);
    }
    return eq(a, b);
}
