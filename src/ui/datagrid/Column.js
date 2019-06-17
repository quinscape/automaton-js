import PropTypes from "prop-types";
import React from "react"
import get from "lodash.get"
import { observer as fnObserver } from "mobx-react-lite"

/**
 * DataGrid column component
 */
const Column = fnObserver(props => {


    const {name, context, children} = props;

    if (typeof children === "function")
    {
        const result = children(context);

        //console.log("FN-RESULT", result);

        return (
            <td>
                {
                    typeof result === "string" ?
                        <p
                            className="form-control-plaintext"
                        >
                            {
                                result
                            }
                        </p> : result
                }
            </td>
        );
    }

    //console.log("context[name] = ", context[name]);

    return (
        <td>
            <p
                className="form-control-plaintext"
            >
                {
                    String(get(context, name))
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
    ])
};

Column.displayName = "DataGrid.Column";

export default Column
