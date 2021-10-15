import React, { useMemo } from "react"
import cx from "classnames"
import { useDrag, useDrop } from "react-dnd"
import PropTypes from "prop-types"

const DataRow = ({
    idx,
    context,
    columns,
    moveRow,
    className
}) => {

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
            if (!moveRow || !dropRef.current) {
                return;
            }
            const dragIndex = item.idx
            const hoverIndex = idx
            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return
            }
            // Determine rectangle on screen
            const hoverBoundingRect = dropRef.current.getBoundingClientRect()
            // Get vertical middle
            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
            // Determine mouse position
            const clientOffset = monitor.getClientOffset()
            // Get pixels to the top
            const hoverClientY = clientOffset.y - hoverBoundingRect.top
            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return
            }
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return
            }
            // Time to actually perform the action
            moveRow(dragIndex, hoverIndex);
            /* item.idx = hoverIndex */
        }
    });

    preview(drop(dropRef));
    drag(dragRef);

    return (
        <>
            <tr
                className={ cx(className, isDragging && "dragging", isOver && "dragover") }
                ref={!!moveRow && dropRef}
            >
                <td
                    ref={!!moveRow && dragRef}
                >
                    move
                </td>
                {
                    columns.map(
                        (column, columnIdx) => column.enabled && (
                            React.cloneElement(
                                column.columnElem,
                                {
                                    key: columnIdx,
                                    context
                                }
                            )
                        )
                    )
                }
            </tr>
        </>
    );

};

DataRow.displayName = "DataRow";

export default DataRow
