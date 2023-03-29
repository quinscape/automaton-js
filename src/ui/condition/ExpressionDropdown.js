import React, { useState } from "react"
import { observer } from "mobx-react-lite";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "reactstrap";
import { and, or, not, toJSON, Type, field, condition as dslCondition, value as dslValue } from "../../FilterDSL";
import i18n from "../../i18n";
import toPath from "lodash.topath"
import get from "lodash.get"
import { toJS } from "mobx";


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

function remove(pointer, editorState)
{
    const condition = pointer.getValue();

    const parentPointer = pointer.getParent();
    const patent = parentPointer && parentPointer.getValue()

    //if (parent.type === Type.OPERATION)
    {
        if (parent.operands.length === 1)
        {
            console.log("Remove op Parent", parentPointer)
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


const ExpressionDropdown = observer(function ExpressionDropdown({pointer, condition, editorState }) {

    const [ isOpen, setOpen ] = useState()

    const toggle = () => setOpen(prevState => !prevState)

    const { opts } = editorState;

    const parentPointer = pointer.getParent()
    const node = pointer.getValue();
    const parent = parentPointer && parentPointer.getValue();

    return (
        <Dropdown className="ml-3" isOpen={ isOpen } toggle={ toggle }>
            <DropdownToggle color="link">
                &hellip;
            </DropdownToggle>
            <DropdownMenu
                size="sm"
            >
                {
                    (node.type === Type.CONDITION || node.type === Type.OPERATION) && (
                        <DropdownItem
                            onClick={ () =>  {
                                editorState.openOperationDialog(pointer, false)
                            }}
                        >
                            {
                                node.type === Type.CONDITION ?
                                    i18n("ConditionEditor:Change Condition ...") :
                                    i18n("ConditionEditor:Change Operation ...")
                            }
                        </DropdownItem>

                    )
                }
                {
                    (node.type === Type.FIELD || node.type === Type.VALUE) && (
                         <DropdownItem
                             onClick={ () => editorState.openComputedValueDialog(pointer) }
                         >
                             {
                                 i18n("ConditionEditor:Change Value Type")
                             }…
                         </DropdownItem>
                    )
                }
                {
                    node.type === Type.OPERATION && (
                       <DropdownItem
                           onClick={ () =>  {
                               editorState.openOperationDialog(pointer, true)
                           }}
                       >
                           {
                               i18n("ConditionEditor:Wrap ...")
                           }
                       </DropdownItem>
                   )
                }
                <DropdownItem
                    onClick={ () =>  {
                        //console.log("remove(", path, ", ", toJS(conditionRoot), "//condition", toJS(condition));
                        remove(pointer, editorState)
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

export default ExpressionDropdown;
