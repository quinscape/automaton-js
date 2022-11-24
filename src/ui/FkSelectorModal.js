import React, { useEffect, useMemo, useRef } from "react"
import cx from "classnames";
import i18n from "../i18n";

import { ButtonToolbar, Container, Modal, ModalBody, ModalHeader } from "reactstrap"
import DataGrid from "./datagrid/DataGrid";
import { Form, Field, Addon, Icon, FormLayout, usePrevious } from "domainql-form";
import { isNonNull } from "domainql-form/lib/InputSchema";
import { useLocalObservable,observer as fnObserver } from "mobx-react-lite";
import { action, comparer, observable, reaction, toJS } from "mobx";

import { component, field, operation, value } from "../FilterDSL"
import { NO_FILTER, NO_SEARCH_FILTER, COLUMN_FILTER, createSearchFilter } from "./FKSelector";
import updateComponentCondition from "../util/updateComponentCondition"

const setFilter = action(
    "FkSelectorModal.setFilter",
    (formObject, filter) => {
        formObject.filter = filter;
    }
)

/**
 * Selector popup for the FK selector.
 */
const FkSelectorModal = fnObserver(
    props => {

        const {
            isOpen,
            iQuery,
            iQueryType,
            columns,
            columnTypes,
            title,
            fieldType,
            selectRow,
            toggle,
            fade,
            filter = null,
            modalFilter,
            searchFilter,
            searchTimeout,
            fkSelectorId,
            selectButtonContentRenderer,
            alignPagination,
            paginationPageSizes
        } = props;

        const formObject = useLocalObservable(() => observable({filter}));

        const searchFieldRef = useRef(null);


        useMemo(
            () => {

                // reinitialize filter on opening
                if (isOpen && formObject.filter !== filter)
                {
                    setFilter(formObject, filter);
                }

            },
            [iQuery]
        )

        const haveSearchFilter = !!searchFilter;
        const showSearchFilter = haveSearchFilter && modalFilter !== NO_SEARCH_FILTER && modalFilter !== NO_FILTER;
        const showColumnFilter = (!haveSearchFilter && modalFilter !== NO_FILTER) ||
                                 (haveSearchFilter && modalFilter === NO_SEARCH_FILTER) ||
                                 modalFilter === COLUMN_FILTER;

        //console.log({haveSearchFilter, showSearchFilter, showColumnFilter})

        useEffect(
            () => {
                if (iQuery != null) {
                    return reaction(
                        // the expression creates a new filter expression from the current observable state
                        () => {

                            const { filter } = formObject;
                            if (filter && showSearchFilter)
                            {
                                return createSearchFilter(iQueryType, searchFilter, formObject.filter);
                            }
                            else
                            {
                                return null;
                            }

                        },
                        // and the effect triggers the debounced condition update
                        newCondition => {

                            const cachedVars = iQuery._query.vars;
    
                            const composite = updateComponentCondition(
                                iQuery._query.vars.config.condition,
                                newCondition,
                                fkSelectorId
                            )
    
                            iQuery.updateCondition(
                                composite
                            ).then(() => {
                                if (cachedVars != null) {
                                    iQuery._query.vars = cachedVars;
                                }
                            });
                        },
                        {
                            delay: searchTimeout,
                            equals: comparer.structural
                        }
                    );
                }
            },
            [iQuery]
        );

        const selectButtonContent =
            typeof selectButtonContentRenderer === "function" ?
                selectButtonContentRenderer() :
                i18n("Select");
        const selectButtonTitle  =
            typeof selectButtonContentRenderer === "function" ?
                i18n("Select") : 
                "";

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
                                    tableClassName={
                                        cx(
                                            "table-hover table-striped table-bordered table-sm table-filling-form-controls"
                                        )
                                    }
                                    value={ iQuery }
                                    filterTimeout={ searchTimeout }
                                    alignPagination={ alignPagination }
                                    paginationPageSizes={paginationPageSizes}
                                    isCompact
                                >
                                    <DataGrid.Column
                                        heading={ "Action" }
                                    >
                                        {
                                            row => (
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary"
                                                    onClick={ ev => selectRow(row) }
                                                    title={ selectButtonTitle }
                                                >
                                                    {
                                                        selectButtonContent
                                                    }
                                                </button>
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
                            {
                                !isNonNull(fieldType) && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={ ev => selectRow(null) }
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
    }
);

export default FkSelectorModal
