import React, { useContext } from "react"
import { observer as fnObserver } from "mobx-react-lite"
import { Select, Field } from "domainql-form"
import i18n from "../../../i18n"
import { FilterContext } from "../GridStateForm";
import DateRangeField from "../../form/date/DateRangeField";
import {getCustomFilterRenderer} from "../../../util/filter/CustomFilterRenderer";
import PropTypes from "prop-types";

const BOOLEAN_VALUES = [
    {
        name : i18n("Boolean:False"),
        value: false
    },
    {
        name : i18n("Boolean:True"),
        value: true
    }
];

const FilterRow = fnObserver(props => {

    const { columns, moveRowColumn } = props;

    const filterState = useContext(FilterContext);

    if (filterState.filters.length === 0)
    {
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
                    const { values } = filterState.filters[filterIndex];

                    const filterElems = [];
                    for (let i = 0; i < values.length; i++)
                    {
                        const fieldName = "filters." + filterIndex + ".values." + i + ".value";
                        const fieldType = values[i].type;
                        const label = i18n("Argument {0} for filter on {1}", i +1 , name);

                        const key = columnIdx + "." + i;

                        if (renderFilter)
                        {
                            const resolvedFilterRenderer = getCustomFilterRenderer(renderFilter) ?? renderFilter;
                            const customElem = resolvedFilterRenderer(fieldName, fieldType, label, i);
                            filterElems.push(
                                React.cloneElement(
                                    customElem,
                                    {
                                        key,
                                        suspendAutoUpdate: true
                                    }
                                )
                            );
                        }
                        else if (fieldType === "Boolean")
                        {
                            filterElems.push(
                                <Select
                                    key={ key }
                                    labelClass="sr-only"
                                    label={ label }
                                    name={ fieldName }
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
                                    suspendAutoUpdate
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
