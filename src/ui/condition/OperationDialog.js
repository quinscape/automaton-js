import React from "react"
import { observer, useLocalObservable } from "mobx-react-lite"
import i18n from "../../i18n";
import config from "../../config";
import { Modal, ModalBody, ModalHeader, ButtonToolbar } from "reactstrap"
import { Form, FormContext, FormLayout } from "domainql-form";
import ConditionSelect from "./ConditionSelect";
import { toJS } from "mobx";
import { toJSON, Type, value as dslValue, operation as dslOperation } from "../../FilterDSL";
import ConditionPointer from "./ConditionPointer"


///////////

const OperationDialogBody = observer(function OperationDialogBody({editorState, formContext})
{

    const { operationPointer, closeOperationDialog, isWrap } = editorState;

    const operation = operationPointer && operationPointer.getValue()

    const isCondition = operation.type === Type.CONDITION && !isWrap

    const localOperationState = useLocalObservable(() => {


        let local
        if (isWrap)
        {
            local = {
                operation: {
                    type: isCondition ? Type.CONDITION : Type.OPERATION,
                    name: isCondition ? "contains" : "add",
                    operands: [
                        toJSON(operation),
                        toJSON(
                            editorState.opts.defaultCondition()
                        )
                    ]
                }
            }
        }
        else
        {
            local = {
                operation: toJSON(operation)
            }
        }

        console.log("OperationDialogBody: Create local state", local, "isWrap", isWrap)

        return local
    })

    const commitLocalOperationState = () => {
        editorState.replaceCondition(
            localOperationState.operation,
            operationPointer
        )
        closeOperationDialog()
    }

    // we have our own little hierarchy
    const pointer = ConditionPointer.createBasePointer(localOperationState, "operation")


    console.log("Render OperationDialogBody", pointer.toString())

    return (
        <div
            className="container-fluid"
        >
            <div className="row">
                <div className="col">
                    <Form
                        value={ localOperationState.operation }
                        formContext={ formContext }
                        options={ {
                            layout: FormLayout.INLINE
                        } }
                    >
                        {
                            formConfig => {
                                return (
                                    <ConditionSelect
                                        editorState={ editorState }
                                        condition={ localOperationState.operation }
                                        pointer={ pointer }
                                        isCondition={ isCondition }
                                    />
                                )
                            }
                        }
                    </Form>
                </div>
            </div>
            <div className="row">
                <div className="col mt-3">
                    <ButtonToolbar>
                        <button
                            className="btn btn-secondary mr-1"
                            onClick={ closeOperationDialog }
                        >
                            {
                                i18n("Cancel")
                            }
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={ commitLocalOperationState }
                        >

                            {
                                isWrap ? i18n("ConditionEditor:Wrap") : i18n("ConditionEditor:Change")
                            }
                        </button>
                    </ButtonToolbar>
                </div>
            </div>
        </div>
    )
})

const OperationDialog = observer(function OperationDialog({ editorState, formContext }){

    const { operationPointer, closeOperationDialog, isWrap } = editorState;

    //console.log("OperationDialog", toJS(operation))

    const modalTitle = isWrap ? i18n("ConditionEditor:Wrap In") : i18n("ConditionEditor:Change Operation")

    const isOpen = editorState.operationDialogOpen;

    //console.log("render OperationDialog", { isOpen, operation: operationPointer.toString() })

    const id = FormContext.getUniqueId(operationPointer);

    return (
        <Modal
            isOpen={ isOpen }
            toggle={ closeOperationDialog }
            size="lg"
            fade={ config.processDialog.props.fade }
        >
            <ModalHeader
                toggle={ closeOperationDialog }
            >
                {
                    modalTitle
                }
            </ModalHeader>
            <ModalBody>
                {
                    isOpen && (
                        <OperationDialogBody
                            key={ id }
                            editorState={ editorState }
                            formContext={ formContext }
                            operationPointer={ operationPointer }
                        />
                   )
                }
            </ModalBody>
        </Modal>
    );
});

export default OperationDialog;
