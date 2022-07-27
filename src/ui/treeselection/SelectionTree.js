import React from "react";
import Tree from "../tree/Tree";
import PropTypes from "prop-types";

const SelectionTree = (props) => {
    const {
        treeContent,
        selectedElements = [],
        onSelectedElementsChange,
        onExpandDirectory,
        onCollapseDirectory,
        valueRenderer,
        singleSelect
    } = props;

    return (
        <Tree
            selectedElements={selectedElements}
            onSelectedElementsChange={onSelectedElementsChange}
        >
            {
                renderObject(treeContent, valueRenderer, singleSelect, onExpandDirectory, onCollapseDirectory)
            }
        </Tree>
    )
}

function renderObject(
    treeObject,
    valueRenderer,
    singleSelect,
    onExpandDirectory,
    onCollapseDirectory,
    path = ""
) {
    const renderedElements = [];

    for(const treeElement in treeObject) {
        const newPath = path ? `${path}.${treeElement}` : treeElement;
        if(typeof treeObject[treeElement] === "object") {
            renderedElements.push(
                <Tree.TreeNode
                    key={newPath}
                    selectionId={newPath}
                    renderer={valueRenderer}
                    renderCheckbox
                    singleSelect={singleSelect}
                    forceDirectory
                    onExpandDirectory={onExpandDirectory}
                    onCollapseDirectory={onCollapseDirectory}
                >
                    {
                        renderObject(
                            treeObject[treeElement],
                            valueRenderer,
                            singleSelect,
                            onExpandDirectory,
                            onCollapseDirectory,
                            newPath
                        )
                    }
                </Tree.TreeNode>
            )
        } else {
            renderedElements.push(
                <Tree.TreeNode
                    key={newPath}
                    selectionId={newPath}
                    renderer={valueRenderer}
                    renderCheckbox
                    singleSelect={singleSelect}
                />
            )
        }
    }

    return renderedElements;
}

SelectionTree.propTypes = {
    /**
     * the elements of the tree
     */
    treeContent: PropTypes.object,

    /**
     * list of selected elements
     */
    selectedElements: PropTypes.arrayOf(PropTypes.string),

    /**
     * callback function called on changes to selected elements
     */
    onSelectedElementsChange: PropTypes.func,
    
    /**
     * callback function called on directory expand
     */
    onExpandDirectory: PropTypes.func,

    /**
     * callback function called on directory collapse
     */
    onCollapseDirectory: PropTypes.func,

    /**
     * rendering function for rendering tree element values
     */
    valueRenderer: PropTypes.func,

    /**
     * if the tree is in single select mode
     */
    singleSelect: PropTypes.bool
}

export default SelectionTree;
