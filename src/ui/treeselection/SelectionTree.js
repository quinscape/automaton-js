import React, { useMemo } from "react";
import Tree from "../tree/Tree";
import PropTypes from "prop-types";

const NODE_TYPE_ENTRY = "entry";
const NODE_TYPE_DIRECTORY = "directory";

const SelectionTree = (props) => {
    const {
        treeContent,
        selectedElements = [],
        onSelectedElementsChange,
        onExpandDirectory,
        onCollapseDirectory,
        valueRenderer,
        singleSelect,
        sorted
    } = props;

    const preparedTree = useMemo(() => {
        return prepareTree(treeContent, valueRenderer, "", sorted);
    }, [
        treeContent,
        valueRenderer,
        sorted
    ]);

    return (
        <Tree
            selectedElements={selectedElements}
            onSelectedElementsChange={onSelectedElementsChange}
        >
            {
                renderTree(preparedTree, singleSelect, onExpandDirectory, onCollapseDirectory)
            }
        </Tree>
    )
}

function prepareTree(
    treeContent,
    valueRenderer, 
    path = "",
    sorted = false
) {
    const result = [];

    for(const treeElement in treeContent) {
        const newPath = path ? `${path}.${treeElement}` : treeElement;
        if(typeof treeContent[treeElement] === "object") {
            const value = renderNodeValue(valueRenderer, newPath, true);
            const children = prepareTree(
                treeContent[treeElement],
                valueRenderer,
                newPath,
                sorted
            );
            result.push({
                type: NODE_TYPE_DIRECTORY,
                selectionId: newPath,
                value,
                children
            });
        } else {
            const value = renderNodeValue(valueRenderer, newPath, false);
            result.push({
                type: NODE_TYPE_ENTRY,
                selectionId: newPath,
                value
            });
        }
    }

    if (sorted) {
        result.sort(nodeComparator);
    }

    return result;
}

function renderTree(
    treeContent,
    singleSelect,
    onExpandDirectory,
    onCollapseDirectory
) {
    const renderedElements = [];

    for(const treeElement of treeContent) {
        const {type, selectionId, value, children} = treeElement;
        if (type === NODE_TYPE_DIRECTORY) {
            renderedElements.push(
                <Tree.TreeNode
                    key={selectionId}
                    selectionId={selectionId}
                    renderer={value}
                    renderCheckbox
                    singleSelect={singleSelect}
                    forceDirectory
                    onExpandDirectory={onExpandDirectory}
                    onCollapseDirectory={onCollapseDirectory}
                >
                    {
                        renderTree(
                            children,
                            singleSelect,
                            onExpandDirectory,
                            onCollapseDirectory
                        )
                    }
                </Tree.TreeNode>
            )
        } else {
            renderedElements.push(
                <Tree.TreeNode
                    key={selectionId}
                    selectionId={selectionId}
                    renderer={value}
                    renderCheckbox
                    singleSelect={singleSelect}
                />
            )
        }
    }

    return renderedElements;
}

function renderNodeValue(renderer, selectionId, isDirectory) {
    return typeof renderer === "function" ? renderer(selectionId, {
        isTree: true,
        isDirectory
    }) : renderer ?? selectionId
}

function nodeComparator(a, b) {
    const {type: aType, value: aValue} = a;
    const {type: bType, value: bValue} = b;
    if (aType === bType) {
        return extractText(aValue).toLowerCase().localeCompare(extractText(bValue).toLowerCase());
    }
    if (aType === NODE_TYPE_ENTRY) {
        return -1;
    }
    if (aType === NODE_TYPE_DIRECTORY) {
        return 1;
    }
}

function extractText(node) {
    if (node == null || typeof node === "boolean") {
        return "";
    }
    if (typeof node === "number") {
        return node.toString();
    }
    if (typeof node === "string") {
        return node;
    }
    if (Array.isArray(node)) {
        return node.map(extractText).join("");
    }
    if (node.props != null && "children" in node.props) {
        return extractText(node.props.children);
    }
    return "";
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
    singleSelect: PropTypes.bool,

    /**
     * if the tree will be sorted
     * sorting first by type, to enforce directories to the bottom, then by inner text
     */
    sorted: PropTypes.bool
}

export default SelectionTree;
