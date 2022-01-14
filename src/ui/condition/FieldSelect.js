import React, { useRef, useState } from "react"
import { observer } from "mobx-react-lite";
import get from "lodash.get";
import toPath from "lodash.topath";
import { Addon, Field, useFormConfig } from "domainql-form";
import { join } from "./condition-layout";
import i18n from "../../i18n"
import { lookupType } from "../../util/type-utils";
import { Type } from "../../FilterDSL";


function getOperandsFromParent(conditionRoot, path)
{
    const p = toPath(path).slice(0,-2);
    p.push("operands");
    return get(conditionRoot, p);
}


const FieldSelect = observer(({layoutId, conditionRoot, path, editorState}) => {

    const formConfig = useFormConfig();

    /**
     * Remember the previous field scalar type as state
     */
    const scalarTypeRef  = useRef(null);

    const { opts } = editorState;

    const validatePath = (fieldContext, value) => {

        if (opts.allowFields.length)
        {
            return opts.allowFields.indexOf(value) < 0 ? i18n("ConditionEditor:Invalid Field") : null;
        }

        let typeDef;
        let isInvalid = false;
        try
        {
            typeDef = lookupType(opts.rootType, value);

        }
        catch(e)
        {
            isInvalid  = true;
        }

        if (!typeDef)
        {
            isInvalid = true;
        }

        return isInvalid ? i18n("ConditionEditor:Invalid Field") : null

    };

    const onChange = (ctx, value) => {

        //console.log("onChange", value);

        const typeDef = lookupType(opts.rootType, value);

        if (scalarTypeRef.current !== typeDef.name)
        {
            //console.log("type changed", typeDef.name );
            
            scalarTypeRef.current = typeDef.name

            const pathArray = toPath(path);
            const index = +pathArray[pathArray.length - 1];

            if (isNaN(index))
            {
                throw new Error("Expected path to end in a operands.n with n being a number: " + path)
            }


            const operands = getOperandsFromParent(conditionRoot, path);
            if (operands)
            {
                const newOperands = [];
                let mismatched = [];
                let revalidate = false;
                for (let i = 0; i < operands.length; i++)
                {
                    const operand = operands[i];
                    if (operand.type === Type.FIELD)
                    {
                        const otherType = lookupType(opts.rootType, operand.name);
                        if (index !== i && typeDef.name !== otherType.name)
                        {
                            mismatched.push(operand.name);
                        }
                        newOperands.push(operand);
                    }
                    else if (operand.type === Type.VALUE)
                    {
                        if (typeDef.name !== operand.scalarType)
                        {
                            newOperands.push({
                                type: Type.VALUE,
                                scalarType: typeDef.name,
                                value: operand.value
                            });

                            revalidate = true;
                        }
                        else
                        {
                            newOperands.push(operand);
                        }
                    }
                    else if (operand.type === Type.VALUES)
                    {
                        if (typeDef.name !== operand.scalarType)
                        {
                            newOperands.push({
                                type: Type.VALUES,
                                scalarType: typeDef.name,
                                values: operand.values
                            });

                            revalidate = true;
                        }
                        else
                        {
                            newOperands.push(operand);
                        }
                    }
                }

                editorState.updateOperands(
                    path,
                    newOperands,
                    revalidate
                );

                if (mismatched.length)
                {
                    formConfig.formContext.addError(
                        formConfig.root,
                        ctx.qualifiedName,
                        i18n("ConditionEditor:Field Type Mismatch With {0}", mismatched.join(", ")),
                        value
                    )
                }
            }
        }
    }
    
    return (
        <span
            data-layout={ layoutId }
            className="field mr-2"
        >
            <Field
                type="String"
                labelClass="sr-only"
                label="Field name"
                name={ join(path, "name") }
                validate={ validatePath }
                onChange={ onChange }
                addons={ [ <Addon placement={ Addon.RIGHT }>
                    <button
                        type="button"
                        className="btn btn-light border"
                        onClick={ () => console.log("CHOOSE FIELD")}
                    >
                        &hellip;
                    </button>
                </Addon> ]}
            />
        </span>
    );
});

export default FieldSelect;
