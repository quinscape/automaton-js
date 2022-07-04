import React, {useContext} from "react";
import {ButtonGroup, ButtonToolbar} from "reactstrap";
import Button from "../Button";
import i18n from "../../i18n";
import {FilterContext} from "./GridStateForm";
import PropTypes from "prop-types";

const DataGridButtonToolbar = (props) => {
    const {
        resetFilterButtonDisabled,
        customizeColumnsButtonDisabled,
        setIsColumnModalOpen
    } = props;

    const filterState = useContext(FilterContext);

    function clearFilterState() {
        const filters = [];
        for(const filter of filterState.filters) {
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
        }
        filterState.filters.replace(filters);
    }

    return (
        <ButtonToolbar className="align-self-end mt-2">
            <ButtonGroup size="lg">
                <Button
                    id="startseitestammdaten_s7_filterzuruecksetzenzuletztbearbeiteteobjekte"
                    name="filterZuruecksetzenZuletztBearbeiteteObjekte"
                    className="btn btn-primary ml-2"
                    text={i18n("resets filters")}
                    tooltip={i18n("resets filters")}
                    disabled={resetFilterButtonDisabled}
                    type="reset"
                    action={clearFilterState}
                >
                    {i18n("Reset Filters")}
                </Button>

                <Button
                    id="startseitestammdaten_s7_spaltenanpassenzuletztbearbeiteteobjekte"
                    name="spaltenAnpassenZuletztBearbeiteteObjekte"
                    className="btn btn-primary ml-2"
                    text={i18n("customizes displayed columns")}
                    tooltip={i18n("customizes displayed columns")}
                    disabled={customizeColumnsButtonDisabled}
                    action={(event) => {
                        setIsColumnModalOpen(true);
                    }}
                >
                    {i18n("Customize Columns")}
                </Button>
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
