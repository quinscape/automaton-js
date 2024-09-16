import React, { useContext } from "react"
import { observer as fnObserver } from "mobx-react-lite"
import { Select, Field } from "domainql-form"
import i18n from "../../../i18n"
import I18nTranslation from "../../I18nTranslation";
import { FilterContext } from "../GridStateForm";
import DateRangeField from "../../form/date/DateRangeField";
import {getCustomFilterRenderer} from "../../../util/filter/CustomFilterRenderer";
import PropTypes from "prop-types";

const BOOLEAN_VALUES = [
    {
        name : "Boolean:False",
        value: false
    },
    {
        name : "Boolean:True",
        value: true
    }
].map(({name, value}) => {
    return (
        <I18nTranslation
            key={value}
            value={name}
            selectValue={value}
            renderer={(translation) => (
                <option
                    key={value}
                    value={value}
                >
                    {
                        translation
                    }
                </option>
            )
        } />
    );
});

const FilterRow = fnObserver(props => {

    const { columns, moveRowColumn } = props;

    const filterState = useContext(FilterContext);

    const currentFilters = filterState.filters;

    if (currentFilters.length === 0) {
        return false;
    }
    
    const filterColumnElements = [];

    columns.forEach(
        (column, columnIdx) => {

            const { name, enabled, filter, filterIndex,  renderFilter } = column;

            if (enabled)
            {
                if (!filter || (moveRowColumn != null && moveRowColumn === name))
                {
                    filterColumnElements.push(
                        <th key={ columnIdx }/>
                    );
                }
                else
                {
                    const currentFilter = currentFilters[filterIndex];
                    if (currentFilter != null) {
                        const { values } = currentFilter;

                        const filterElems = [];
                        for (let i = 0; i < values.length; i++)
                        {
                            const fieldName = "filters." + filterIndex + ".values." + i + ".value";
                            const fieldType = values[i].type;
                            const label = i18n("Argument {0} for filter on {1}", i +1 , name);

                            const key = filterIndex + "." + i;

                            if (renderFilter)
                            {
                                const resolvedFilterRenderer = getCustomFilterRenderer(renderFilter) ?? renderFilter;
                                if (typeof resolvedFilterRenderer === "function") {
                                    const customElem = resolvedFilterRenderer(fieldName, fieldType, label, i);
                                    filterElems.push(
                                        React.cloneElement(
                                            customElem,
                                            {
                                                key
                                            }
                                        )
                                    );
                                }
                            }
                            else if (fieldType === "Boolean")
                            {
                                filterElems.push(
                                    <Select
                                        key={ key }
                                        labelClass="sr-only"
                                        label={ label }
                                        name={ fieldName }
                                        valueProperty="selectValue"
                                        values={ BOOLEAN_VALUES }
                                        type={ fieldType }
                                    />
                                );
                            }
                            else if(fieldType === "Timestamp")
                            {
                                filterElems.push(
                                    <DateRangeField
                                        key={ key }
                                        labelClass="sr-only"
                                        label={ label }
                                        name={ fieldName }
                                        type="DateRange"
                                    />
                                );
                            }
                            else
                            {
                                filterElems.push(
                                    <Field
                                        key={ key }
                                        labelClass="sr-only"
                                        label={ label }
                                        name={fieldName}
                                        type={ fieldType }
                                    />
                                );
                            }

                        }
                        filterColumnElements.push(
                        <th key={ columnIdx }>
                                {
                                    filterElems
                                }
                            </th>
                        );
                    }

                }
            }
        }
    );

    return (
        <tr className="data-grid-row filter">
            {
                filterColumnElements
            }
        </tr>
    );

});

FilterRow.displayName = "FilterRow";

FilterRow.propTypes = {
    /**
     * the rows of the data grid
     */
    columns: PropTypes.array
}

export default FilterRow
