import React from "react"
import i18n from "../i18n";

import { ButtonToolbar, Container, Modal, ModalBody, ModalHeader } from "reactstrap"
import DataGrid from "./datagrid/IQueryGrid";
import { isNonNull } from "domainql-form/lib/InputSchema";


/**
 * Selector popup for the FK selector.
 */
const FkSelectorModal = props => {

    const { isOpen, iQuery, columns, title, fieldType, selectRow, toggle, fade } = props;

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
                                tableClassName="table-hover table-striped table-bordered table-sm table-filling-form-controls"
                                value={ iQuery }
                            >
                                <DataGrid.Column
                                    heading={ "Action" }
                                >
                                    {
                                        row => (
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={ ev => selectRow(iQuery.type, row) }
                                            >
                                                {
                                                    i18n("Select")
                                                }
                                            </button>
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
                        {
                            !isNonNull(fieldType) && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={ ev => selectRow(iQuery.type, null) }
                                >
                                    {
                                        i18n("Select None")
                                    }
                                </button>
                            )
                        }
                    </ButtonToolbar>
                </Container>
            </ModalBody>
        </Modal>
    )
};

export default FkSelectorModal
