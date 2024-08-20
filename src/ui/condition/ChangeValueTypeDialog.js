import React, { useMemo, useReducer } from "react"
import { observer } from "mobx-react-lite"
import { ButtonToolbar, Col, Modal, ModalBody, ModalHeader, Row } from "reactstrap"
import config from "../../config"
import i18n from "../../i18n"
import {
    COMPUTED_VALUE_TYPE,
    COMPUTED_VALUES,
    field as fieldNode,
    toJSON,
    Type,
    value as dslValue
} from "../../FilterDSL"
import { Form, FormContext, Field, Select } from "domainql-form"
import { toJS } from "mobx"
import { lookupType } from "../../util/type-utils"
import useCounter from "../../util/useCounter"
import DateRangeField from "../form/date/DateRangeField"
import CalendarField from "../CalendarField"

const MODE_COMPUTED = "computed";
const MODE_LITERAL = "literal";
const MODE_FIELD = "field";

const ModeRadio = observer(function ModeRadio({currentMode, mode, changeMode,label}) {

    const id = "valueMode" + mode
    return (
        <div className="form-check">
            <input
                className="form-check-input"
                type="radio"
                name="valueMode"
                value={ mode }
                id={ id }
                onChange={ changeMode }
                checked={ currentMode === mode }
            />
            <label className="form-check-label"
                   htmlFor={ id }>
                {
                    label
                }
            </label>
        </div>
    )
})


export function getScalarType(editorState, node)
{
    if (node.type === Type.FIELD)
    {
        const { name } = node

        if (name)
        {
            return lookupType(editorState.rootType, name).name;
        }
    }
    else if (node.type === Type.VALUE && node.scalarType === COMPUTED_VALUE_TYPE)
    {

        const computedValueName = node.value.name;
        if (computedValueName)
        {
            return COMPUTED_VALUES.find(d => d.name === computedValueName).type
        }
    }

    return null;
}


function renderComputedValueParameterField(argDef)
{

}


function getModeForCondition(valueNode, computedValuePointer)
{
    if (valueNode.type === Type.VALUE &&  valueNode.scalarType === COMPUTED_VALUE_TYPE)
    {
        return MODE_COMPUTED
    }
    else if (valueNode.type === Type.VALUE &&  valueNode.scalarType !== COMPUTED_VALUE_TYPE)
    {
        return MODE_LITERAL
    }
    if (valueNode.type === Type.FIELD)
    {
        return MODE_FIELD
    }
    else
    {
        throw new Error("Unknown mode: " + computedValuePointer)
    }
}


const ChangeValueTypeDialog = observer(function ChangeValueTypeDialog({conditionRoot, editorState, formContext, valueRenderer, schemaResolveFilterCallback}) {

    const ComputedValueOptions = COMPUTED_VALUES.map( d => ({ name: d.description, value: d.name}));

    const { computedValuePointer } = editorState

    const [counter,increaseCounter] = useCounter()

    const valueNode = computedValuePointer && computedValuePointer.getValue()
    const isOpen = editorState.computedValueDialogOpen;
    const snapshot = useMemo(() => {

        if (!isOpen || !valueNode)
        {
            return null
        }

        return ({
            mode: getModeForCondition(valueNode, computedValuePointer),
            valueNode: toJSON(valueNode)
        })
    }, [isOpen] )

    if (!computedValuePointer)
    {
        return false;
    }


    if (!valueNode)
    {
        return false;
    }

    //console.log("Render ComputedValueDialog", toJS(valueNode), "path", computedValuePointer.path)

    const { closeComputedValueDialog } = editorState;

    return (
        <Modal
            isOpen={ isOpen }
            toggle={ closeComputedValueDialog }
            size="lg"
            fade={ config.processDialog.props.fade }
        >
            <ModalHeader
                toggle={ closeComputedValueDialog }
            >
                {
                    i18n("ConditionEditor:Change Value Type")
                }
            </ModalHeader>
            <ModalBody>
                {
                    isOpen && (
                       <Form
                           key={ counter }
                           value={ valueNode }
                           formContext={ formContext }
                           options={ {
                           } }
                       >
                           {
                               (formConfig) => {

                                   const currentMode = getModeForCondition(valueNode)
                                   const isComputedValue = currentMode === MODE_COMPUTED;

                                   const currentName = isComputedValue && valueNode.value.name

                                   const def = COMPUTED_VALUES.find(d => d.name === currentName);

                                   const changeMode = ev => {

                                       const mode = ev.target.value


                                       let newValueNode
                                       if (snapshot.mode === mode)
                                       {
                                           // snapshot is already a copy
                                            newValueNode = snapshot.valueNode
                                       }
                                       else
                                       {
                                           if (mode === MODE_COMPUTED)
                                           {
                                               const firstEntry = COMPUTED_VALUES[0]
                                               newValueNode = toJSON(
                                                   dslValue({
                                                       name: firstEntry.name,
                                                       args: []

                                                   }, COMPUTED_VALUE_TYPE)
                                               )
                                           }
                                           else if (mode === MODE_LITERAL)
                                           {
                                               const parent = computedValuePointer.getParent()

                                               const siblings = parent.getValue().operands.filter(o => o !== valueNode)

                                               let scalarType
                                               for (let i = 0; i < siblings.length; i++)
                                               {
                                                   const sibling = siblings[i]
                                                   scalarType = getScalarType(editorState, sibling)

                                                   if (scalarType !== null)
                                                   {
                                                       break;
                                                   }

                                               }

                                               if (scalarType === null)
                                               {
                                                   scalarType = "String"
                                               }
                                               newValueNode = toJSON(dslValue(null, scalarType))
                                           }
                                           else if (mode === MODE_FIELD)
                                           {
                                               newValueNode = toJSON(fieldNode(""))
                                           }
                                       }
                                       editorState.replaceCondition(newValueNode, computedValuePointer)
                                       increaseCounter()
                                   }

                                   return (
                                       <>
                                           <Row className="mb-3">
                                               <Col>
                                                    <ModeRadio
                                                        mode={ MODE_COMPUTED }
                                                        changeMode={ changeMode }
                                                        currentMode={ currentMode }
                                                        label={ i18n("ConditionEditor:Computed Value") }
                                                    />
                                                    <ModeRadio
                                                        mode={ MODE_LITERAL }
                                                        changeMode={ changeMode }
                                                        currentMode={ currentMode }
                                                        label={ i18n("ConditionEditor:Literal Value") }
                                                    />
                                                    <ModeRadio
                                                        mode={ MODE_FIELD }
                                                        changeMode={ changeMode }
                                                        currentMode={ currentMode }
                                                        label={ i18n("ConditionEditor:Field") }
                                                    />
                                               </Col>
                                           </Row>
                                           {
                                               isComputedValue && (
                                                   <>
                                                   <Row>
                                                       <Col>
                                                           <Select
                                                               type="String!"
                                                               label={ i18n("ConditionEditor:Computed Value Name") }
                                                               name="value.name"
                                                               required={ true }
                                                               values={ ComputedValueOptions }
                                                               onChange={
                                                                   (ctx, value) => editorState.changeComputedValueName(value, valueNode)
                                                               }
                                                           />
                                                       </Col>
                                                   </Row>
                                                       {
                                                           valueNode.value.args.length > 0 && (
                                                               <Row>
                                                                   <Col>
                                                                       {
                                                                           valueNode.value.args.map((arg, idx) => {

                                                                               const argDef = def.args[idx]

                                                                               const label = argDef.label || argDef.name
                                                                               const fieldName = "value.args." + idx + ".value"
                                                                               const scalarType = argDef.nonNull ?
                                                                                   arg.type + "!" :
                                                                                   arg.type

                                                                               if (argDef.type === "Timestamp" || argDef.type === "Date")
                                                                               {
                                                                                   return (
                                                                                       <CalendarField
                                                                                           key={ idx }
                                                                                           label={ label }
                                                                                           name={ fieldName }
                                                                                           type={ scalarType }
                                                                                       />
                                                                                   )
                                                                               }

                                                                               return (
                                                                                   <Field
                                                                                       key={ idx }
                                                                                       name={ fieldName }
                                                                                       label={ label }
                                                                                       placeholder={ argDef.default || null }
                                                                                       type={ scalarType }
                                                                                   />
                                                                               )
                                                                           })
                                                                       }
                                                                   </Col>
                                                               </Row>
                                                           )
                                                       }
                                                   </>

                                               )
                                           }
                                       </>
                                   )
                               }
                           }
                        </Form>
                   )
                }
               <Row>
                   <Col>
                       <ButtonToolbar>
                           <button
                               className="btn btn-secondary"
                               onClick={ closeComputedValueDialog }
                               >
                               {i18n("Close")}
                           </button>
                       </ButtonToolbar>
                   </Col>
               </Row>
            </ModalBody>
        </Modal>    )
})

export default ChangeValueTypeDialog
