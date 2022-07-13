import React, {useState} from "react";

const QueryEditor = (props) => {
    const {
        header
    } = props;

    const [selectedColumns, setSelectedColumns] = useState([]);
    const [queryCondition, setQueryCondition] = useState({})

    return (
        <div>
            <div>
                {
                    typeof header === "function" ? header() : (
                        <h3>
                            {
                                header
                            }
                        </h3>
                    )
                }
            </div>
            <div>
                //TODO: horizontal token list; on edit button click: column select
            </div>
            <div>
                //TODO: condition editor
            </div>
        </div>
    )
}

export default QueryEditor;
