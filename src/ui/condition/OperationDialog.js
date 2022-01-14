import React from "react"
import { observer as fnObserver, useLocalObservable } from "mobx-react-lite";
import i18n from "../../i18n";
import config from "../../config";
import { Modal, ModalBody, ModalHeader, ButtonToolbar } from "reactstrap"
import { Form, FormContext, FormLayout } from "domainql-form";
import ConditionSelect from "./ConditionSelect";
import { toJS } from "mobx";
import { toJSON, Type, value as dslValue } from "../../FilterDSL";

const OperationDialog = fnObserver(function OperationDialog({ editorState, conditionRoot, formContext }){

    const { operation, operationPath, closeOperationDialog, isWrap } = editorState;

    const state = useLocalObservable(() => ({name: isWrap ? "add" : operation.name }))

    //console.log("OperationDialog", toJS(operation))

    const modalTitle = isWrap ? i18n("ConditionEditor:Wrap In") : i18n("ConditionEditor:Change Operation")

    const isOpen = editorState.operationDialogOpen;
    const nodeId = FormContext.getUniqueId(operation);
    
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
                        <div
                            className="container-fluid"
                        >
                            <div className="row">
                                <div className="col">
                                    <Form
                                        key={ nodeId }
                                        value={ state }
                                        formContext={ formContext }
                                        options={ {
                                            layout: FormLayout.INLINE
                                        } }
                                    >
                                        <ConditionSelect
                                            editorState={ editorState }
                                            condition={ operation }
                                            path={ "" }
                                            isCondition={ false }
                                        />
                                    </Form>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col mt-3">
                                    <ButtonToolbar>
                                        {
                                            isWrap && (
                                                <button
                                                    type="button"
                                                    className="btn btn-primary mr-1"
                                                    onClick={ () => {

                                                        editorState.replaceCondition(
                                                            toJSON(
                                                                {
                                                                    type: Type.OPERATION,
                                                                    name: state.name,
                                                                    operands: [
                                                                        operation,
                                                                        dslValue("")
                                                                    ]
                                                                }
                                                            ),
                                                            operationPath
                                                        )

                                                        closeOperationDialog();
                                                    } }
                                                >
                                                    {
                                                        i18n("ConditionEditor:Wrap")
                                                    }
                                                </button>
                                            )
                                        }
                                        {
                                            !isWrap && (
                                                <button
                                                    type="button"
                                                    className="btn btn-primary mr-1"
                                                    onClick={ () => {
                                                        editorState.replaceCondition(
                                                            {
                                                                ... operation,
                                                                name: state.name
                                                            },
                                                            operationPath
                                                        )

                                                        closeOperationDialog();
                                                    } }
                                                >
                                                    {
                                                        i18n("ConditionEditor:Change")
                                                    }
                                                </button>
                                            )
                                        }
                                        <button
                                            type="button"
                                            className="btn btn-secondary mr-1"
                                            onClick={ closeOperationDialog }
                                        >
                                            {
                                                i18n("Cancel")
                                            }
                                        </button>

                                    </ButtonToolbar>

                                </div>
                            </div>
                        </div>
                    )
                }
            </ModalBody>
        </Modal>
    );
});

export default OperationDialog;
