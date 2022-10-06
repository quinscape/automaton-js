import React, {useEffect, useState} from "react";
import {ButtonToolbar, Modal, ModalBody, ModalHeader} from "reactstrap";
import cx from "classnames";
import {Icon} from "../../../../domainql-form";
import i18n from "../../i18n";
import SelectionTree from "./SelectionTree";
import PropTypes from "prop-types";

const SelectionTreeModal = (props) => {
    const {
        modalHeader,
        toggle,
        isOpen,
        selected,
        onSubmit,
        treeContent,
        onExpandDirectory,
        onCollapseDirectory,
        valueRenderer,
        singleSelect,
        className
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
        <Modal className={cx("selection-tree-modal", className)} isOpen={ isOpen } toggle={ toggle }>
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
                    onExpandDirectory={onExpandDirectory}
                    onCollapseDirectory={onCollapseDirectory}
                    singleSelect={singleSelect}
                />
                <ButtonToolbar className="mt-3">
                    <button
                        type="button"
                        className="btn btn-outline-primary"
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
                        className="btn btn-primary ml-2"
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

SelectionTreeModal.propTypes = {
    /**
     * the header of the modal
     */
    modalHeader: PropTypes.string,

    /**
     * function to toggle the modal visibility
     */
    toggle: PropTypes.func,

    /**
     * if the modal is opened or not
     */
    isOpen: PropTypes.bool,

    /**
     * list of selected elements
     */
    selected: PropTypes.arrayOf(PropTypes.string),

    /**
     * callback function called on submit
     */
    onSubmit: PropTypes.func,

    /**
     * the elements displayed in the tree
     */
    treeContent: PropTypes.object,
    
    /**
     * callback function called on directory expand
     */
    onExpandDirectory: PropTypes.func,

    /**
     * callback function called on directory collapse
     */
    onCollapseDirectory: PropTypes.func,

    /**
     * rendering function for rendering tree elements
     */
    valueRenderer: PropTypes.func,

    /**
     * if the tree is in single select mode
     */
    singleSelect: PropTypes.bool
}

export default SelectionTreeModal;
