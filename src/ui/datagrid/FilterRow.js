import React, { useContext } from "react"
import { observer as fnObserver } from "mobx-react-lite"
import { Select } from "domainql-form"
import i18n from "../../i18n"
import { FilterContext } from "./GridStateForm";
import { Field } from "domainql-form"
import {DateRangeField} from "../../index";
import {getCustomFilterRenderer} from "../../util/filter/CustomFilterRenderer";
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

    const { columns } = props;

    const filterState = useContext(FilterContext);

    //console.log("FilterRow", {filterState});

    if (filterState.filters.length === 0)
    {
        return false;
    }

    const filterColumnElements = [];

    let internalFilterIndex = 0;

    columns.forEach(
        (col, idx) => {

            const { name, enabled, filter, filterIndex,  renderFilter } = col;

            if (enabled)
            {
                if (!filter)
                {
                    filterColumnElements.push(
                        <th key={ idx }/>
                    );
                }
                else
                {
                    const { values } = filterState.filters[internalFilterIndex];

                    const filterElems = [];
                    for (let i = 0; i < values.length; i++)
                    {
                        const fieldName = "filters." + filterIndex + ".values." + i + ".value";
                        const fieldType = values[i].type;
                        const label = i18n("Argument {0} for filter on {1}", i +1 , name);

                        const key = idx + "." + i;

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
                            filterElems.push(<DateRangeField
                                key={ key }
                                labelClass="sr-only"
                                label={ label }
                                name={ fieldName }
                                type="DateRange"
                            />);
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
                        <th key={ idx }>
                            {
                                filterElems
                            }
                        </th>
                    );

                    internalFilterIndex++;

                }
            }
        }
    );

    return (
        <tr className="filter">
            {
                filterColumnElements
            }
        </tr>
    );

});

FilterRow.propTypes = {
    /**
     * the rows of the data grid
     */
    columns: PropTypes.array
}

export default FilterRow
