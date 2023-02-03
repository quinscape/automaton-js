import React, {useEffect, useState} from "react";
import {ButtonToolbar, Modal, ModalBody, ModalHeader} from "reactstrap";
import i18n from "../../../i18n";
import DualListSelector from "../../listselector/DualListSelector";
import {Icon} from "domainql-form";
import PropTypes from "prop-types";

function calculateInactiveElements(allElements, activeElements) {
    return allElements.filter((element) => {
        return !activeElements.some((activeElement) => {
            return activeElement.name === element.name;
        });
    })
}

const UserColumnConfigDialogModal = (props) => {
    const {
        isOpen,
        toggle,
        allElements = [],
        defaultActiveElements = allElements,
        activeElements = defaultActiveElements,
        onSubmit
    } = props;

    const [currentInactiveElements, setCurrentInactiveElements] = useState(calculateInactiveElements(allElements, activeElements));
    const [currentActiveElements, setCurrentActiveElements] = useState(activeElements);

    useEffect(() => {
        setCurrentInactiveElements(calculateInactiveElements(allElements, activeElements));
        setCurrentActiveElements(activeElements);
    }, [activeElements]);

    function doSubmit() {
        onSubmit(currentActiveElements);
        toggle();
    }

    function doCancel() {
        setCurrentInactiveElements(calculateInactiveElements(allElements, activeElements));
        setCurrentActiveElements(activeElements);
        toggle();
    }

    function reset() {
        setCurrentInactiveElements(calculateInactiveElements(allElements, defaultActiveElements));
        setCurrentActiveElements(defaultActiveElements);
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

UserColumnConfigDialogModal.propTypes = {
    /**
     * set whether the Modal is open or closed
     */
    isOpen: PropTypes.bool,

    /**
     * function used to toggle Modal open / closed
     */
    toggle: PropTypes.func,

    /**
     * list of all columns; defaults to empty array
     */
    allElements: PropTypes.array,

    /**
     * list of active (displayed) by default columns; defaults to allElements
     */
    defaultActiveElements: PropTypes.array,

    /**
     * list of active (displayed) columns; defaults to defaultActiveElements
     */
    activeElements: PropTypes.array,

    /**
     * submit function
     */
    onSubmit: PropTypes.func
}

export default UserColumnConfigDialogModal;
