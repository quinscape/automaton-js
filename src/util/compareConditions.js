import { Type } from "../FilterDSL";


/**
 * Does a deep-comparison between two conditions
 *
 * @category iquery
 * 
 * @param {ConditionNode} a     condition node A
 * @param {ConditionNode} b     condition node B
 *
 * @param {boolean} compareValueNodes   compare the value of value nodes (default = false)
 * 
 * @return {boolean} true if the conditions are equal (ignoring values)
 */
export default function compareConditions( a, b, compareValueNodes = false)
{
    if (a === null && b === null)
    {
        return true;
    }

    if (a && b && a.type === b.type)
    {
        const { type } = a;

        if (type === Type.COMPONENT)
        {
            return a.id === b.id && compareConditions(a.condition, b.condition,compareValueNodes);
        }
        else if (type === Type.CONDITION || type === Type.OPERATION)
        {
            const { name: nameA, operands : operandsA } = a;
            const { name: nameB, operands : operandsB } = b;

            if (nameA !== nameB || operandsA.length !== operandsB.length)
            {
                return false;
            }

            for (let i = 0; i < operandsA.length; i++)
            {
                if (!compareConditions(operandsA[i], operandsB[i], compareValueNodes))
                {
                    return false;
                }
            }

            return true;
        }
        else if (type === Type.FIELD)
        {
            return a.name === b.name;
        }
        else if (type === Type.VALUE)
        {
            if (!compareValueNodes)
            {
                // all value nodes are equal
                return true;
            }
            return a.scalarType === b.scalarType && a.value === b.value;
        }
        else if (type === Type.VALUES)
        {
            if (!compareValueNodes)
            {
                // all value nodes are equal
                return true;
            }

            if (a.scalarType !== b.scalarType) {
                return false;
            }

            const { values : valuesA } = a;
            const { values : valuesB } = b;

            if (valuesA.length !== valuesB.length)
            {
                return false;
            }

            for (let i = 0; i < valuesA.length; i++)
            {
                if (valuesA[i] !== valuesB[i])
                {
                    return false;
                }
            }

            return true;
        }
        else
        {
            throw new Error("Unhandled condition node: " + JSON.stringify(a))
        }
    }
    return false;
}
