import React from "react"
import cx from "classnames"
import { useDrag, useDrop } from "react-dnd"
import { Icon, useFormConfig } from "domainql-form";

const DataRow = ({
    idx,
    context,
    workingSet,
    columns,
    moveRowColumn,
    moveRow,
    dropRow,
    className
}) => {

    const formConfig = useFormConfig();
    const rowErrors = formConfig.formContext.getErrorsForRoot(context);
    const isInvalid = rowErrors?.length > 0 ?? false;

    const dropRef = React.useRef(null)
    const dragRef = React.useRef(null)

    const [{ isDragging }, drag, preview] = useDrag({
        type: "DataRow",
        item: { idx },
        collect: monitor => ({
          isDragging: monitor.isDragging(),
        })
    });

    const [{ isOver = false }, drop] = useDrop({
        accept: "DataRow",
        hover: (item, monitor) => {
            if (!moveRow || !dragRef.current || !dropRef.current) {
                return;
            }
            const dragIndex = item.idx
            const hoverIndex = idx
            moveRow(dragIndex, hoverIndex, dragRef.current, dropRef.current, monitor);
        },
        drop: (item, monitor) => {
            if (!moveRow || !dragRef.current || !dropRef.current) {
                return;
            }
            const dragIndex = item.idx
            const hoverIndex = idx
            dropRow(dragIndex, hoverIndex, dragRef.current, dropRef.current, monitor);
        }
    });

    preview(drop(dropRef));
    drag(dragRef);

    return (
        <tr
            className={ cx(
                "data-grid-row data-row",
                className,
                moveRowColumn != null && "draggable",
                isDragging && "dragging",
                isOver && "dragover",
                isInvalid && "is-invalid"
            ) }
            ref={!!moveRow && dropRef}
            data-idx={ idx }
        >
            {
                columns.map(
                    (column, columnIdx) => {
                        const {name, enabled} = column;
                        if (enabled) {
                            if (moveRowColumn != null && moveRowColumn === name) {
                                return (
                                    <td
                                        ref={!!moveRow && dragRef}
                                        key={columnIdx}
                                        className="grip"
                                    >
                                        <p
                                            className="form-control-plaintext nobreak"
                                            title="move"
                                        >
                                            <Icon className="fa-grip-horizontal" />
                                        </p>
                                    </td>
                                );
                            } else {
                                return React.cloneElement(
                                    column.columnElem,
                                    {
                                        key: columnIdx,
                                        context,
                                        workingSet
                                    }
                                );
                            }
                        }
                    }
                )
            }
        </tr>
    );

};

DataRow.displayName = "DataRow";

export default DataRow
