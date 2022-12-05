import PropTypes from "prop-types";
import React, { useMemo } from "react"
import get from "lodash.get"
import cx from "classnames"
import { GlobalConfig, useFormConfig } from "domainql-form"
import { observer as fnObserver } from "mobx-react-lite"
import { lookupType, unwrapNonNull } from "../../util/type-utils";
import { resolveFieldDependencies, resolveFieldDependenciesValue } from "../../util/dependencyUtilities";

/**
 * DataGrid column component
 */
const Column = fnObserver(props => {

    const {
        name,
        context,
        workingSet,
        width,
        minWidth,
        maxWidth,
        nobreak,
        className,
        children
    } = props;

    const formConfig = useFormConfig();
    const rowErrors = formConfig.formContext.getErrorsForRoot(context);
    const fieldError = formConfig.formContext.findError(context, name);
    const isInvalid = fieldError?.length > 0 ?? false;

    const scalarType = useMemo(
        () => {

            if (!name || typeof children === "function")
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

    const effectiveClass = typeof className === "function" ? className(context) : className;

    if (typeof children === "function")
    {
        const result = children(context, {fieldError, rowErrors});

        return (
            <td
                className={cx(
                    "data-grid-cell",
                    effectiveClass,
                    isInvalid && "is-invalid"
                )}
                style={ { width, minWidth, maxWidth } }
            >
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
    
    const value = isInvalid ? fieldError[0] : resolveFieldDependenciesValue(workingSet, context, name);

    const renderedValue = value === null || value === undefined || value === "" ?
        GlobalConfig.none() :
        GlobalConfig.renderStatic(scalarType, value);

    return (
        <td
            className={cx(
                "data-grid-cell",
                effectiveClass,
                isInvalid && "is-invalid"
            )}
            style={ { width, minWidth, maxWidth } }
        >
            <p
                className={cx(
                    "form-control-plaintext",
                    nobreak && "nobreak")
                }
                title={ nobreak && renderedValue }
            >
                { renderedValue }
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
     * Column width. Can be a css size string (e.g. "20vw", "50%" or "10xm") or a number for pixels.
     */
    width: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]),
    /**
     * Column minimal width. Can be a css size string (e.g. "20vw", "50%" or "10xm") or a number for pixels.
     */
    minWidth: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]),
    /**
     * Column maximal width. Can be a css size string (e.g. "20vw", "50%" or "10xm") or a number for pixels.
     * Takes effect only after the table stretches beyond its boundaries.
     */
    maxWidth: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]),
    /**
     * Defines if the column contents should be ellipsed instead of using linebreaks after it reaches its maximal width.
     * Additionally sets a title attribute containing the full content.
     */
    nobreak: PropTypes.bool,

    /**
     * Additional classes to add to the cells for this column. Can be either string to apply to all columns or a function
     * that produces classes given the row object ( row => classes ) 
     */
    className: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]),

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
     * Defines if sorting by the column should be suppressed
     */
     suppressSort: PropTypes.bool,
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
