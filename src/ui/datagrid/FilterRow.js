import React, { useContext } from "react"
import { observer as fnObserver } from "mobx-react-lite"
import { Select } from "domainql-form"
import i18n from "../../i18n"
import { FilterContext } from "./GridStateForm";
import { Field } from "domainql-form"


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

    let filterIndex = 0;

    columns.forEach(
        (col, idx) => {

            const { name, enabled, filter, renderFilter } = col;

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
                    const { values } = filterState.filters[filterIndex];

                    const filterElems = [];
                    for (let i = 0; i < values.length; i++)
                    {
                        const fieldName = "filters." + filterIndex + ".values." + i + ".value";
                        const fieldType = values[i].type;
                        const label = i18n("Argument {0} for filter on {1}", i +1 , name);

                        const key = idx + "." + i;

                        if (fieldType === "Boolean")
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
                        else if (renderFilter)
                        {
                            const customElem = renderFilter(fieldName, fieldType, label, i);
                            filterElems.push(
                                React.cloneElement(
                                    customElem,
                                    {
                                        key
                                    }
                                )
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
                        <th key={ idx }>
                            {
                                filterElems
                            }
                        </th>
                    );

                    filterIndex++;

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

export default FilterRow
