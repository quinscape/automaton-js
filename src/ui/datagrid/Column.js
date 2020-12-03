import PropTypes from "prop-types";
import React, { useMemo } from "react"
import get from "lodash.get"
import { GlobalConfig } from "domainql-form"
import { observer as fnObserver } from "mobx-react-lite"
import { lookupType, unwrapNonNull } from "../../util/type-utils";




/**
 * DataGrid column component
 */
const Column = fnObserver(props => {

    const { name, context, className, children} = props;

    const scalarType = useMemo(
        () => {

            if (!name)
            {
                return null;
            }

            const type = lookupType(context._type, name);
            if (!type)
            {
                throw new Error("Could not resolve type for <Column name=\"" + name + "\"/> for row: " + JSON.stringify(context))
            }
            return unwrapNonNull(type).name;
        },
        [ name ]
    )

    if (typeof children === "function")
    {
        const result = children(context);

        //console.log("FN-RESULT", result);

        return (
            <td>
                {
                    React.isValidElement(result) ?
                        result : (
                            <p
                                className="form-control-plaintext"
                            >
                                {
                                    GlobalConfig.valueOrNone(result)
                                }
                            </p>
                        )
                }
            </td>
        );
    }

    if (!name)
    {
        throw new Error(
            "<DataGrid.Column/> must have a name attribute if it does not have a function as only child." +
            "Either use <DataGrid.Column name=\"field\" ... /> or <DataGrid.Column>{ row => (...) }</DataGrid.Column>)"
        )
    }

    //console.log("context[name] = ", context[name]);

    const value = get(context, name);
    return (
        <td>
            <p
                className="form-control-plaintext"
            >
                {
                    value === null || value === undefined || value === "" ?
                        GlobalConfig.none() :
                        GlobalConfig.renderStatic(scalarType, value)
                }
            </p>
        </td>
    )
});

Column.propTypes = {
    /**
     * Column name / path expression. (e.g. "name", but also "foo.owner.name")
     */
    name: PropTypes.string,
    /**
     * Column heading
     */
    heading: PropTypes.string,
    /**
     * Either a JOOQ / Filter DSL comparison name or a custom filter function (see below)
     */
    filter: PropTypes.oneOfType([

        PropTypes.string,
        PropTypes.func
    ]),
    
    /**
     * Field expression string or field expression FilterDSL map
     */
    sort:
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object
        ])

};

Column.displayName = "DataGrid.Column";

export default Column
