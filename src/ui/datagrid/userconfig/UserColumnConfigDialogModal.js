import React, {useState} from "react";
import {ButtonToolbar, Container, Modal, ModalBody, ModalHeader} from "reactstrap";
import i18n from "../../../i18n";
import DualListSelector from "../../listselector/DualListSelector";
import {Icon} from "../../../../../domainql-form";

const UserColumnConfigDialogModal = (props) => {
    const {
        isOpen,
        toggle,
        inactiveElements,
        activeElements,
        onSubmit
    } = props;

    const [currentInactiveElements, setCurrentInactiveElements] = useState(inactiveElements);
    const [currentActiveElements, setCurrentActiveElements] = useState(activeElements);

    function doSubmit() {
        onSubmit(currentActiveElements);
        toggle();
    }

    function doCancel() {
        reset();
        toggle();
    }

    function reset() {
        setCurrentInactiveElements(inactiveElements);
        setCurrentActiveElements(activeElements);
    }

    return (
        <Modal className="user-config-modal" isOpen={ isOpen } toggle={ toggle }>
            <ModalHeader toggle={ toggle }>
                {
                    i18n("Configure Table Columns")
                }
            </ModalHeader>
            <ModalBody>
                <DualListSelector
                    leftHeader={i18n("Inactive Columns")}
                    rightHeader={i18n("Active Columns")}
                    leftElements={currentInactiveElements}
                    rightElements={currentActiveElements}
                    onChange={(leftElements, rightElements) => {
                        setCurrentInactiveElements(leftElements);
                        setCurrentActiveElements(rightElements);
                    }}
                    autoSortLeft
                    rightSortable
                />
                <ButtonToolbar>
                    <button
                        type="button"
                        className="btn btn-outline-primary ml-auto"
                        onClick={ reset }
                    >
                        <Icon className="fa-undo"/>
                        {
                            i18n("Reset")
                        }
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-primary ml-auto"
                        onClick={ doCancel }
                    >
                        <Icon className="fa-cancel"/>
                        {
                            i18n("Cancel")
                        }
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary ml-auto"
                        onClick={ doSubmit }
                    >
                        <Icon className="fa-submit"/>
                        {
                            i18n("Ok")
                        }
                    </button>
                </ButtonToolbar>
            </ModalBody>
        </Modal>
    )
}

export default UserColumnConfigDialogModal;
