import React from "react"
import i18n from "../i18n";

import { ButtonToolbar, Container, Modal, ModalBody, ModalHeader } from "reactstrap"
import DataGrid from "./datagrid/IQueryGrid";
import get from "lodash.get"
import { observer as fnObserver } from "mobx-react-lite";


/**
 * Selector popup for the FK selector.
 */
const AssociationSelectorModal = fnObserver(props => {

    const { isOpen, iQuery, columns, title, toggle, fade, selected, idPath } = props;

    return(
        <Modal isOpen={ isOpen } toggle={ toggle } size="lg" fade={ fade }>
            <ModalHeader
                toggle={ toggle }
            >
                {
                    title
                }
            </ModalHeader>
            <ModalBody>
                <Container fluid={ true }>
                    {
                        isOpen && (
                            <DataGrid
                                id="fk-selector-grid"
                                tableClassName="table-hover table-striped table-bordered table-sm"
                                value={ iQuery }
                            >
                                <DataGrid.Column
                                    heading={ "Selection" }
                                >
                                    {
                                        entity => (
                                            <DataGrid.RowSelector
                                                id={ get(entity, idPath) }
                                                selectedValues={ selected }
                                            />
                                        )
                                    }
                                </DataGrid.Column>
                                {
                                    columns.map(
                                        name => (
                                            <DataGrid.Column
                                                key={ name }
                                                name={ name }
                                                filter="containsIgnoreCase"
                                            />
                                        )
                                    )
                                }
                            </DataGrid>
                        )
                    }
                    <ButtonToolbar>
                        <button
                            type="button"
                            className="btn btn-secondary mr-1"
                            onClick={ ev => selected.clear() }
                        >
                            {
                                i18n("Unselect All")
                            }
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary mr-1"
                            onClick={ toggle }
                        >
                            {
                                i18n("Close")
                            }
                        </button>
                    </ButtonToolbar>
                </Container>
            </ModalBody>
        </Modal>
    )
});

AssociationSelectorModal.displayName = "AssociationSelectorModal";

export default AssociationSelectorModal
