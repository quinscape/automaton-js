import React, {useEffect, useState} from "react";
import {ButtonToolbar, Modal, ModalBody, ModalHeader} from "reactstrap";
import {Icon} from "../../../../domainql-form";
import i18n from "../../i18n";
import SelectionTree from "./SelectionTree";

const SelectionTreeModal = (props) => {
    const {
        modalHeader,
        toggle,
        isOpen,
        selected,
        onSubmit,
        treeContent,
        valueRenderer
    } = props;

    const [selectedElements, setSelectedElements] = useState(selected);

    useEffect(() => {
        setSelectedElements(selected);
    }, [selected])

    function doSubmit() {
        onSubmit(selectedElements);
        toggle();
    }

    function doCancel() {
        reset();
        toggle();
    }

    function reset() {
        setSelectedElements(selected);
    }

    return (
        <Modal className="user-config-modal" isOpen={ isOpen } toggle={ toggle }>
            <ModalHeader toggle={ toggle }>
                {
                    modalHeader
                }
            </ModalHeader>
            <ModalBody>
                <SelectionTree
                    treeContent={treeContent}
                    selectedElements={selectedElements}
                    onSelectedElementsChange={(newSelectedElements) => {
                        setSelectedElements(newSelectedElements)
                    }}
                    valueRenderer={valueRenderer}
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

export default SelectionTreeModal;
