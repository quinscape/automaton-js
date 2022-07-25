import React, {useState} from "react";
import {ButtonToolbar, Modal, ModalBody, ModalHeader} from "reactstrap";
import i18n from "../../i18n";
import {Icon} from "domainql-form";
import PropTypes from "prop-types";
import SelectionList from "./SelectionList";

const SelectionListModal = (props) => {
    const {
        modalHeader,
        listHeader,
        toggle,
        isOpen,
        elements,
        selected,
        resetOnSubmit,
        showSearch,
        onSubmit
    } = props;
    const [selectedElement, setSelectedElement] = useState(selected);

    function doSubmit() {
        const isSelectedInElements = elements.some((sortColumnElement) => {
            return sortColumnElement.name === selectedElement;
        });
        if (isSelectedInElements) {
            onSubmit(selectedElement);
        }
        if (resetOnSubmit) {
            setSelectedElement();
        }
        toggle();
    }

    function doCancel() {
        reset();
        toggle();
    }

    function reset() {
        setSelectedElement(selected);
    }

    return (
        <Modal className="user-config-modal" isOpen={ isOpen } toggle={ toggle }>
            <ModalHeader toggle={ toggle }>
                {
                    modalHeader
                }
            </ModalHeader>
            <ModalBody>
                <SelectionList
                    header={listHeader}
                    elements={elements}
                    selected={selectedElement}
                    onChange={(newSelectedElement) => {
                        setSelectedElement(newSelectedElement.name);
                    }}
                    showSearch={showSearch}
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

SelectionListModal.propTypes = {

    /**
     * the header of the modal
     */
    modalHeader: PropTypes.string,

    /**
     * the header of the list
     */
    listHeader: PropTypes.string,

    /**
     * the elements of the list
     */
    elements: PropTypes.array.isRequired,

    /**
     * the selected item in the list
     */
    selected: PropTypes.string,

    /**
     * set whether the Modal is open or closed
     */
    isOpen: PropTypes.bool,

    /**
     * function used to toggle Modal open / closed
     */
    toggle: PropTypes.func,

    /**
     * if the selected element should be reset or not
     */
    resetOnSubmit: PropTypes.bool,

    /**
     * if the search bar should be displayed or not
     */
    showSearch: PropTypes.bool,
    /**
     * submit function
     */
    onSubmit: PropTypes.func
}

export default SelectionListModal;
