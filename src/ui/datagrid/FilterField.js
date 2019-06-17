import React from "react"

import { Field } from "domainql-form"

const FilterField = props => {

    const { index, values } = props;

    const fields = [];
    for (let i = 0; i < values.length; i++)
    {
        fields.push(
            <Field
                key={ i }
                type={ values[i].type }
                labelClass="sr-only"
                name={ "filters." + index + ".values." + i + ".value" }
            />
        )
    }

    return fields;
};

export default FilterField;
