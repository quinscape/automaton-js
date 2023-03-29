import React, { useState } from "react"
import { observer } from "mobx-react-lite";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "reactstrap";
import { and, or, not, toJSON, Type, condition as dslCondition } from "../../FilterDSL";
import i18n from "../../i18n";
import toPath from "lodash.topath"
import get from "lodash.get"
import { toJS } from "mobx";


function remove(pointer, editorState)
{
    const condition = pointer.getValue()

    const parentPointer = pointer.getParent()
    if (parentPointer != null)
    {
        const parent = parentPointer.getValue()
        if (parent.type === Type.CONDITION)
        {
            if (parent.name === "not")
            {
                console.log("Remove NOT", parentPointer.path)
                remove(parentPointer, editorState);
            }
            else if (parent.name === "and" || parent.name === "or")
            {
                if (parent.operands.length === 1)
                {
                    console.log("Remove Logical Parent", parentPointer.path)
                    remove(parentPointer, editorState);
                }
                else if (parent.operands.length === 2)
                {
                    const a = parent.operands[0];
                    const b = parent.operands[1];
                    const other = condition === a ? b : a;

                    editorState.replaceCondition(other, parentPointer);
                }
                else
                {
                    const newCondition = dslCondition(parent.name, parent.operands.filter( o => o !== condition));
                    editorState.replaceCondition(toJSON(newCondition), parentPointer);
                }
            }
        }
    }
    else
    {
        editorState.replaceCondition(null);
    }
}


function findIndex(operands, condition)
{
    for (let i = 0; i < operands.length; i++)
    {
        if (operands[i] === condition)
        {
            return i;
        }
    }
    throw new Error("Element not found")
}


const ConditionDropdown = observer(function ConditionDropdown({pointer, condition, editorState }) {

    const [ isOpen, setOpen ] = useState()

    const toggle = () => setOpen(prevState => !prevState)

    const { opts } = editorState;

    const parentPointer = pointer.getParent()
    const secondOperandPointer = pointer.getOperand(1)
    const secondOperand = secondOperandPointer && secondOperandPointer.getValue()
    const parent = parentPointer && parentPointer.getValue()

    return (
        <Dropdown className="ml-3 float-right" isOpen={ isOpen } toggle={ toggle }>
            <DropdownToggle color="link">
                &hellip;
            </DropdownToggle>
            <DropdownMenu
                size="sm"
            >
                <DropdownItem
                    onClick={ () =>  {

                        const newCondition = toJSON(
                            and(
                                condition,
                                opts.defaultCondition()
                            )
                        );
                        editorState.replaceCondition(newCondition, pointer);
                    }}
                >
                    {
                        i18n("ConditionEditor:Wrap AND")
                    }

                </DropdownItem>
                <DropdownItem
                    onClick={ () =>  {
                        const newCondition = toJSON(
                            or(
                                condition,
                                opts.defaultCondition()
                            )
                        );
                        editorState.replaceCondition(newCondition, pointer);
                    }}
                >
                    {
                        i18n("ConditionEditor:Wrap OR")
                    }

                </DropdownItem>
                <DropdownItem
                    onClick={ () =>  {

                        if (parent && parent.type === Type.CONDITION && parent.name === "not")
                        {
                            console.log("REMOVE NOT", parentPointer)
                            editorState.replaceCondition(condition, parentPointer);
                            return;
                        }
                        const newCondition = toJSON(
                            not(
                                condition
                            )
                        );
                        editorState.replaceCondition(newCondition, pointer);
                    }}
                >
                    {
                        i18n("ConditionEditor:Negate")
                    }
                </DropdownItem>
                {
                    parent && parent.name !== "not" && (
                        <>
                            <DropdownItem divider/>
                            <DropdownItem
                                onClick={ () =>  {
                                    if (parent && parent.type === Type.CONDITION && (parent.name === "and" || parent.name === "or"))
                                    {
                                        const newCondition = dslCondition(parent.name, [
                                            ... parent.operands
                                        ]);

                                        const index = findIndex(parent.operands, condition);

                                        newCondition.operands.splice(index + 1, 0, opts.defaultCondition())

                                        editorState.replaceCondition(toJSON(newCondition), parentPointer);
                                    }
                                }}
                            >
                                {
                                    i18n("ConditionEditor:Add Condition")
                                }
                            </DropdownItem>
                        </>
                    )
                }
                <DropdownItem divider/>
                {
                    secondOperand && (secondOperand.type === Type.FIELD || secondOperand.type === Type.VALUE) && (
                         <DropdownItem
                             onClick={ () => editorState.openComputedValueDialog(secondOperandPointer)}
                         >
                             {
                                 i18n("ConditionEditor:Change Value Type")
                             }…
                         </DropdownItem>
                    )
                }
                <DropdownItem
                    onClick={ () => editorState.openExpressionDialog(condition, pointer)}
                >
                    {
                        i18n("ConditionEditor:Expressions")
                    }…
                </DropdownItem>
                <DropdownItem divider/>
                <DropdownItem
                    onClick={ () =>  {
                        remove(pointer, editorState);
                    }}
                >
                    {
                        i18n("ConditionEditor:Remove")
                    }
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
});

export default ConditionDropdown;
