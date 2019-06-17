import React, { useContext } from "react"
import { observer as fnObserver } from "mobx-react-lite"
import FilterField from "./FilterField";
import { FilterContext } from "./GridStateForm";

const FilterRow = fnObserver(props => {

    const { columns } = props;

    const filterState = useContext(FilterContext);

    //console.log("FilterRow", {filterState});

    if (filterState == null)
    {
        return false;
    }

    let index = 0;
    return (
        <tr className="filter-row">
            {

                columns.map(
                    (col, idx) => {

                        if (!col.enabled)
                        {
                            return false;
                        }
                        if (!col.filter)
                        {
                            return (
                                <th key={idx}/>
                            );
                        }

                        const entry = filterState.filters[index++];
                        const { values } = entry;

                        return (
                            <th key={idx}>
                                <FilterField
                                    index={ index - 1}
                                    values={ values }
                                />
                            </th>
                        );
                    }
                )
            }
        </tr>
    );

});

export default FilterRow
