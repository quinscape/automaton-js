import React from "react"
import { observer } from "mobx-react-lite";
import { Select } from "domainql-form";
import {
    FIELD_CONDITIONS,
    FIELD_OPERATIONS,
    toJSON,
    Type,
    value as dslValue,
    values as dslValues
} from "../../FilterDSL";
import i18n from "../../i18n";
import { join } from "./condition-layout";
import { lookupType, unwrapNonNull } from "../../util/type-utils";
import ConditionEditorState from "./ConditionEditorState";


const CONDITION_NAMES = [ ... Object.keys(FIELD_CONDITIONS)];
const OPERATION_NAMES = [ ... Object.keys(FIELD_OPERATIONS)];

CONDITION_NAMES.sort();
OPERATION_NAMES.sort();


function determineType(editorState, operands)
{
    for (let i = 0; i < operands.length; i++)
    {
        const { type, scalarType } = operands[i];

        if (type === Type.FIELD)
        {
            const { name } = operands[i];

            let fieldType;
            try
            {
                fieldType = lookupType(editorState.rootType, name);
            }
            catch(e)
            {
                // ignore
            }

            if (fieldType)
            {
                return unwrapNonNull(fieldType).name;
            }

        }
        else if (type === Type.VALUE)
        {
            return scalarType;
        }
    }
    
    throw new Error("Cannot determine type: "+ JSON.stringify(operands));
}


const ConditionSelect = observer(function ConditionSelect({path, condition, editorState, isCondition})
{

    const { type } = condition;

    const onOpSelection = (ctx, newName) => {

        if (newName === "in")
        {
            const { operands } = condition;

            if (operands.length === 2 && operands[0].type === Type.FIELD && operands[1].type === Type.VALUES)
            {
                return;
            }

            const scalarType = determineType(editorState, operands);

            editorState.replaceCondition(
                {
                    type,
                    name: newName,
                    operands: [
                        ... operands.filter(o => o.type === Type.FIELD),
                        toJSON(
                            dslValues(
                                scalarType,
                                null
                            )
                        )
                    ]
                },
                path
            )
            return;
        }

        let { operands } = condition;

        if (condition.name === "in")
        {
            operands = operands.filter(o => o.type !== Type.VALUES)
        }
        else
        {
            const expectedNumber = FIELD_CONDITIONS[newName];
            const existingNumber = operands.filter(o => o.type === Type.VALUE).length;

            if (expectedNumber > existingNumber)
            {
                const scalarType = determineType(editorState, operands);

                const newOperands = [ ... operands ];
                const num = expectedNumber - existingNumber;

                for (let i=0; i < num; i++)
                {
                    newOperands.push(
                        toJSON(
                            dslValue(null, scalarType)
                        )
                    )
                }

                editorState.replaceCondition(
                    {
                        type,
                        name: newName,
                        operands: newOperands
                    },
                    path
                )
            }
            else if (expectedNumber < existingNumber)
            {
                const newOperands = [];

                let allowed = expectedNumber;
                for (let i = 0; i < operands.length; i++)
                {
                    const operand = operands[i];

                    if (operand.type === Type.FIELD)
                    {
                        newOperands.push(operand);
                    }
                    else
                    if (operand.type === Type.VALUE && allowed > 0)
                    {
                        newOperands.push(operand);
                        allowed--;
                    }

                }

                editorState.replaceCondition(
                    {
                        type,
                        name: newName,
                        operands: newOperands
                    },
                    path
                )

            }
        }

    }

    const nodeId = ConditionEditorState.getNodeId(condition);

    return (
        <Select
            key={ nodeId }
            labelClass="sr-only"
            label={ isCondition ? i18n("ConditionSelect:condition") : i18n("ConditionSelect:operation") }
            name={ join(path, "name") }
            required={ true }
            type="String"
            values={ isCondition ? CONDITION_NAMES : OPERATION_NAMES }
            onChange={ isCondition ? onOpSelection : null }
        />
    );
});

export default ConditionSelect;
