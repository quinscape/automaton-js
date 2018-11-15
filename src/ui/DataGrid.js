import React from "react"


class Column extends React.Component {

    render()
    {
        const {name, context, children} = this.props;

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
                        context[name]
                    }
                </p>
            </td>
        )
    }
}


/**
 * Data grid what works based on degenerified Paged<DomainObject> types.
 */
class DataGrid extends React.Component {

    render()
    {
        const {value, children} = this.props;
        const {rows, rowCount} = value;

        return (
            <table className="table table-hover table-striped table-responsive">
                <thead>
                <tr>
                    {
                        React.Children.map(
                            children,
                            col => (
                                <th>
                                    {
                                        col.props.heading
                                    }
                                </th>
                            )
                        )
                    }
                </tr>
                </thead>
                <tbody>
                {
                    rows.map(
                        (context, idx) => (
                            <tr key={idx}>
                                {
                                    React.Children.map(
                                        children,
                                        col => (
                                            React.cloneElement(
                                                col,
                                                {
                                                    context
                                                }
                                            )
                                        )
                                    )
                                }
                            </tr>
                        )
                    )
                }
                </tbody>
            </table>
        )
    }


    static Column = Column;
}


export default DataGrid
