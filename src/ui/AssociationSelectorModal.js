import React, { useEffect, useMemo, useRef } from "react"
import i18n from "../i18n";

import { ButtonToolbar, Container, Modal, ModalBody, ModalHeader } from "reactstrap"
import DataGrid from "./datagrid/DataGrid";
import get from "lodash.get"
import { useLocalObservable, observer as fnObserver } from "mobx-react-lite";
import { action, comparer, observable, reaction } from "mobx";
import { NO_FILTER, NO_SEARCH_FILTER, COLUMN_FILTER, createSearchFilter } from "./AssociationSelector";
import { Addon, Field, Form, Icon } from "domainql-form";
import updateComponentCondition from "../util/updateComponentCondition";
import { field, value } from "../../filter";

const setFilter = action(
    "FkSelectorModal.setFilter",
    (formObject, filter) => {
        formObject.filter = filter;
    }
)

/**
 * Selector popup for the FK selector.
 */
const AssociationSelectorModal = fnObserver(props => {

    const {
        isOpen,
        iQuery,
        iQueryType,
        columns,
        columnTypes,
        title,
        toggle,
        fade,
        filter = null,
        modalFilter,
        searchFilter,
        searchTimeout,
        selected,
        idPath,
        alignPagination,
        paginationPageSizes,
        associationSelectorId
    } = props;

    const formObject = useLocalObservable(() => observable({filter}));

    const iQueryRef = useRef(null);
    const searchFieldRef = useRef(null);

    useEffect(
        () => {

            // reinitialize filter on opening
            if (isOpen && formObject.filter !== filter)
            {
                setFilter(formObject, filter);
            }

            // update iQuery ref
            iQueryRef.current = iQuery;
        }
    )

    const haveSearchFilter = !!searchFilter;
    const showSearchFilter = haveSearchFilter && modalFilter !== NO_SEARCH_FILTER && modalFilter !== NO_FILTER;
    const showColumnFilter = (!haveSearchFilter && modalFilter !== NO_FILTER) ||
                                 (haveSearchFilter && modalFilter === NO_SEARCH_FILTER) ||
                                 modalFilter === COLUMN_FILTER;

    useEffect(
        () => {
            return reaction(
                // the expression creates a new filter expression from the current observable state
                () => {

                    const { filter } = formObject;
                    if (iQueryType && filter && showSearchFilter)
                    {
                        return createSearchFilter(iQueryType, searchFilter, filter);
                    }
                    else
                    {
                        return null;
                    }

                },
                // and the effect triggers the debounced condition update
                newCondition => {

                    const cachedVars = iQueryRef.current._query.vars;

                    const currentCondition = iQueryRef.current._query.vars.config.condition;

                    const composite = currentCondition != null ? updateComponentCondition(
                        iQueryRef.current._query.vars.config.condition,
                        newCondition,
                        associationSelectorId
                    ) : newCondition;

                    // We can't use `iQuery` directly because this closure traps the very first iQuery prop value
                    // which is always null. So we trap the iQueryRef ref instead and change its current prop
                    iQueryRef.current.updateCondition(
                        composite
                    ).then(() => {
                        iQueryRef.current._query.vars = cachedVars;
                    });
                },
                {
                    delay: searchTimeout,
                    equals: comparer.structural
                }
            );
        },
        []
    );

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
                    <div className="row">
                        <div className="col">
                            {
                                showSearchFilter && (
                                    <Form
                                        value={ formObject }
                                        options={{
                                        }}
                                    >
                                        <Field
                                            ref={ searchFieldRef }
                                            name="filter"
                                            label="search"
                                            labelClass="sr-only"
                                            formGroupClass="mb-2"
                                            type="String"
                                        >
                                            <Addon
                                                placement={ Addon.LEFT }
                                                text={ true }
                                            >
                                                <Icon className="fa-search"/>
                                            </Addon>
                                            <Addon
                                                placement={ Addon.RIGHT }
                                            >
                                                <button
                                                    className="btn btn-light border"
                                                    type="button"
                                                    onClick={
                                                        () => {
                                                            setFilter(formObject, "")
                                                            searchFieldRef.current.focus()
                                                        }
                                                    }

                                                >

                                                    <Icon className="fa-eraser mr-1"/>
                                                    {
                                                        i18n("Clear")
                                                    }
                                                </button>
                                            </Addon>
                                        </Field>
                                    </Form>
                                )
                            }
                        </div>
                    </div>
                    {
                        isOpen && (
                            <DataGrid
                                id="fk-selector-grid"
                                tableClassName="table-hover table-striped table-bordered table-sm"
                                value={ iQuery }
                                filterTimeout={ searchTimeout }
                                alignPagination={ alignPagination }
                                paginationPageSizes={ paginationPageSizes }
                                isCompact
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
                                        ({name, heading}, idx) => (
                                            <DataGrid.Column
                                                key={ name }
                                                name={ name }
                                                heading={ heading }
                                                filter={
                                                    showColumnFilter ? (
                                                        columnTypes[idx] === "String" ?
                                                            "containsIgnoreCase" :
                                                            (fieldName, val) =>
                                                                field(name).toString()
                                                                .containsIgnoreCase(
                                                                    value(val, "String")
                                                                )
                                                        ) :
                                                        null
                                                }
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
