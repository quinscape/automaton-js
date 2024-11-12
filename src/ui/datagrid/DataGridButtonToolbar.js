import React, {useContext} from "react";
import {ButtonGroup, ButtonToolbar} from "reactstrap";
import Button from "../Button";
import i18n from "../../i18n";
import {FilterContext} from "./GridStateForm";
import PropTypes from "prop-types";

const DataGridButtonToolbar = (props) => {
    const {
        id,
        name,
        resetFilterButtonDisabled,
        customizeColumnsButtonDisabled,
        setIsColumnModalOpen
    } = props;

    const filterState = useContext(FilterContext);

    function clearFilterState() {
        const filters = [];
        for (const filter of filterState.filters) {
            if (filter != null) {
                const clearedFilter = {
                    ...filter,
                    values: filter.values.map((v) => {
                        return {
                            ...v,
                            value: null
                        };
                    })
                }
                filters.push(clearedFilter);
            } else {
                filters.push(filter);
            }
        }
        filterState.setFilters(filters);
    }

    return (
        <ButtonToolbar className="align-self-end mt-2">
            <ButtonGroup size="lg">
                {
                    !resetFilterButtonDisabled ? (
                        <Button
                            id={id + "_resetFilters"}
                            name={name + "_resetFilters"}
                            className="btn btn-primary ml-2"
                            text={i18n("resets filters")}
                            tooltip={i18n("resets filters")}
                            type="reset"
                            action={clearFilterState}
                        >
                            {i18n("Reset Filters")}
                        </Button>
                    ) : ""
                }

                {
                    !customizeColumnsButtonDisabled ? (
                        <Button
                            id={id + "_customizeColumns"}
                            name={name + "_customizeColumns"}
                            className="btn btn-primary ml-2"
                            text={i18n("customizes displayed columns")}
                            tooltip={i18n("customizes displayed columns")}
                            action={(event) => {
                                setIsColumnModalOpen(true);
                            }}
                        >
                            {i18n("Customize Columns")}
                        </Button>
                    ) : ""
                }
                
            </ButtonGroup>
        </ButtonToolbar>
    )
}

DataGridButtonToolbar.propTypes = {
    /**
     * set whether the "Reset Filters" button is disabled or not
     */
    resetFilterButtonDisabled: PropTypes.bool,

    /**
     * set whether the "Customize Columns" button is disabled or not
     */
    customizeColumnsButtonDisabled: PropTypes.bool,

    /**
     * function that opens the user config customisation Modal
     */
    setIsColumnModalOpen: PropTypes.func
}

export default DataGridButtonToolbar;
