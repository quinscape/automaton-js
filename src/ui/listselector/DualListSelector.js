import React, {useState} from "react";
import i18n from "../../i18n";
import {Icon} from "domainql-form";
import SelectionList from "./SelectionList";
import {Container} from "reactstrap";
import PropTypes from "prop-types";

function getPositionInArray(array, name) {
    for(let i = 0; i < array.length; i++) {
        if(array[i].name === name) {
            return i;
        }
    }
    return -1;
}

function deleteElementFromArrayAtPosition(array, position) {
    if(position < 0 || position >= array.length) {
        return array;
    }
    return [
        ...array.slice(0, position),
        ...array.slice(position + 1)
    ];
}

function insertElementIntoArrayAtPosition(array, element, position) {
    if(position == null) {
        return [...array, element];
    }
    return [
        ...array.slice(0, position),
        element,
        ...array.slice(position)
    ];
}

function moveElementInArray(array, position, offset) {
    if(
        offset === 0 ||
        position < 0 ||
        position >= array.length ||
        offset < 0 && position === 0 ||
        offset > 0 && position === array.length - 1
    ) {
        return array;
    }

    const newPosition = Math.min(Math.max(position + offset, 0), array.length - 1);
    const element = array[position];

    const buffer = deleteElementFromArrayAtPosition(array, position);
    return insertElementIntoArrayAtPosition(buffer, element, newPosition);
}

const DualListSelector = (props) => {
    const {
        leftHeader,
        rightHeader,
        leftElements,
        rightElements,
        autoSortLeft,
        leftSortable,
        autoSortRight,
        rightSortable,
        onChange
    } = props;

    const [leftSelectedElement, setLeftSelectedElement] = useState();
    const [rightSelectedElement, setRightSelectedElement] = useState();

    function moveLeftToRight(element) {
        console.log("Moving left to right:", element);
        if(element != null) {
            const position = getPositionInArray(leftElements, element.name);
            if(position >= 0) {
                const newLeftElements = deleteElementFromArrayAtPosition(leftElements, position);
                const newRightElements = insertElementIntoArrayAtPosition(rightElements, element);
                setLeftSelectedElement(null);
                onChange(newLeftElements, newRightElements);
            }
        }
    }

    function moveRightToLeft(element) {
        console.log("Moving right to left:", element);
        if(element != null) {
            const position = getPositionInArray(rightElements, element.name);
            if(position >= 0) {
                const newRightElements = deleteElementFromArrayAtPosition(rightElements, position);
                const newLeftElements = insertElementIntoArrayAtPosition(leftElements, element);
                setRightSelectedElement(null);
                onChange(newLeftElements, newRightElements);
            }
        }
    }

    function moveAllToRight() {
        setLeftSelectedElement(null);
        onChange([], [...leftElements, ...rightElements]);
    }

    function moveAllToLeft() {
        setRightSelectedElement(null);
        onChange([...leftElements, ...rightElements], []);
    }

    function moveElementInLeftList(offset) {
        if(leftSelectedElement == null) {
            return;
        }
        const position = getPositionInArray(leftElements, leftSelectedElement.name);
        const result = moveElementInArray(leftElements, position, offset);
        onChange(result, rightElements);
    }

    function moveElementInRightList(offset) {
        if(rightSelectedElement == null) {
            return;
        }
        const position = getPositionInArray(rightElements, rightSelectedElement.name);
        const result = moveElementInArray(rightElements, position, offset);
        onChange(leftElements, result);
    }

    return (

        <Container fluid={ true }>
            <div className="d-flex flex-row flex-nowrap justify-content-center align-items-stretch">
                <SelectionList
                    header={leftHeader}
                    elements={leftElements}
                    selected={leftSelectedElement?.name}
                    autoSort={autoSortLeft}
                    onChange={setLeftSelectedElement}
                    onMoveElementClick={leftSortable && moveElementInLeftList}
                />

                <div className="d-flex flex-column justify-content-center align-items-stretch m-2">
                    <button
                        type="button"
                        className="btn btn-outline-primary my-1"
                        onClick={ () => {
                            moveAllToRight();
                        } }
                        title={i18n("move all to right")}
                    >
                        <Icon className="fa-angle-double-right m-0"/>
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-primary my-1"
                        onClick={ () => {
                            moveLeftToRight(leftSelectedElement);
                        } }
                        title={i18n("move left to right")}
                    >
                        <Icon className="fa-chevron-right m-0"/>
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-primary my-1"
                        onClick={ () => {
                            moveRightToLeft(rightSelectedElement);
                        } }
                        title={i18n("move right to left")}
                    >
                        <Icon className="fa-chevron-left m-0"/>
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline-primary my-1"
                        onClick={ () => {
                            moveAllToLeft();
                        } }
                        title={i18n("move all to left")}
                    >
                        <Icon className="fa-angle-double-left m-0"/>
                    </button>
                </div>

                <SelectionList
                    header={rightHeader}
                    elements={rightElements}
                    selected={rightSelectedElement?.name}
                    autoSort={autoSortRight}
                    onChange={setRightSelectedElement}
                    onMoveElementClick={rightSortable && moveElementInRightList}
                />
            </div>
        </Container>
    )
}

DualListSelector.propTypes = {
    /**
     * the header of the left list
     */
    leftHeader: PropTypes.string,

    /**
     * the header of the right list
     */
    rightHeader: PropTypes.string,

    /**
     * the elements in the left list
     */
    leftElements: PropTypes.array,

    /**
     * the elements in the right list
     */
    rightElements: PropTypes.array,

    /**
     * whether the left list should be automatically sorted, mutually exclusive with leftSortable
     */
    autoSortLeft: PropTypes.bool,

    /**
     * whether the left list should be sortable by the user, mutually exclusive with autoSortLeft
     */
    leftSortable: PropTypes.bool,

    /**
     * whether the right list should be automatically sorted, mutually exclusive with rightSortable
     */
    autoSortRight: PropTypes.bool,

    /**
     * whether the right list should be sortable by the user, mutually exclusive with autoSortRight
     */
    rightSortable: PropTypes.bool,

    /**
     * the function called on changes to the lists
     */
    onChange: PropTypes.func
}

export default DualListSelector;
