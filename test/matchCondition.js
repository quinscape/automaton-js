import { Type } from "../src/FilterDSL";


const PLACEHOLDER = "Placeholder";


function makeError(text, rooTemplate, rootCond)
{
    return new Error(
        text +
        ": CONDITION = " +
        JSON.stringify(rootCond, null, 4) +
        "\nTEMPLATE = " +
        JSON.stringify(rooTemplate, null, 4)
    );
}


function collect(out, rooTemplate, rootCond, template, cond, path)
{

    if (template.type === PLACEHOLDER)
    {
        if (cond.type !== Type.VALUE && cond.type !== Type.VALUES)
        {
            throw makeError("Type does not match at " + JSON.stringify(path), rooTemplate, rootCond)
        }

        if (template.scalarType !== "*" && cond.scalarType !== template.scalarType)
        {
            throw makeError("Scalar type does not match at " + JSON.stringify(path), rooTemplate, rootCond)
        }

        out[template.name] = cond;
    }
    else
    {
        const { type : templateType, operands : templateOperands, name: templateName, id: templateId } = template;
        const { type, operands, name, id } = cond;

        if (templateType !== type)
        {
            throw makeError("Expected condition type '" + templateType + "' does match the actual type '" + type + "'", rooTemplate, rootCond);
        }

        const newPath = path.slice();
        newPath.push(cond.type + " " + (cond.id || cond.name));

        if (type === Type.COMPONENT)
        {
            if (id !== templateId)
            {
                throw makeError("Expected id '" + templateId + "' does match the actual id '" + id + "'", rooTemplate, rootCond);
            }

            collect(out, rooTemplate, rootCond, template.condition, cond.condition, newPath)
        }
        else
        {
            if (templateName !== "*" && name !== templateName)
            {
                throw makeError("Expected name '" + templateName + "' does match the actual name '" + name + "'", rooTemplate, rootCond);
            }

            if (template.operands && cond.operands)
            {

                if (templateOperands.length !== operands.length)
                {
                    throw makeError("Operand number mismatch at " + JSON.stringify(path), rooTemplate, rootCond, rooTemplate, rootCond)
                }
                else
                {

                    for (let i = 0; i < templateOperands.length; i++)
                    {
                        const templateOperand = templateOperands[i];
                        const operand = operands[i];

                        collect(out, rooTemplate, rootCond, templateOperand, operand, newPath);
                    }

                }
            }
        }


    }
}


/**
 * Value Placeholder for matchCondition().
 *
 * Captures a "Value" or "Values" node at the same position.
 *
 * @param {String} name             placeholder name
 * @param {String} [scalarType]     enforced scalar type
 * 
 * @returns {{name: *, type: string}}
 */
export function matchPlaceholder(name, scalarType = "*")
{
    return {
        type: PLACEHOLDER,
        name,
        scalarType
    };
}


/**
 * Quick helper to handle condition object  hierarchies in tests.
 *
 * It both asserts a certain structure of the condition as well as extracts current values with matchPlaceholder
 * nodes.
 *
 * Except for the matchPlaceholder() all condition elements must be the same as in the actual condition. Field references
 * may use "*" to match all possible field names.
 *
 * The returned objects contains all captured placeholder value(s) nodes.
 *
 * @param template
 * @param cond
 * @returns {{}}
 */
export default function matchCondition(template, cond)
{
    const out = {};

    collect(out, template, cond, template, cond, []);

    return out;
    
}
