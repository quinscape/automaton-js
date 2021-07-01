import AABB from "./AABB";


/**
 * TreeLayout helper class. Can layout an hierarchical tree to be both space conserving and pretty.
 *
 * based on "Node-Positioning for General Trees", by John Q. Walker II
 */
const defaultOptions = {
    NODE_WIDTH: 50, /* Width of a node?       */
    NODE_HEIGHT: 20, /* Height of a node?      */

    SUBTREE_SEPARATION: 20, /* Gap between subtrees?  */
    SIBLING_SEPARATION: 10, /* Gap between siblings?  */

    LEVEL_GAP: 20, /* Gap between levels?    */
    MAXIMUM_DEPTH: 10, /* Biggest tree?          */

    ROOT_ORIENTATION: "WEST"
};

let idCounter = 0;

export class LayoutNode {

    // These define the tree structure and must be set before layouting.
    parent = null;
    offspring = null;
    leftSibling = null;
    rightSibling = null;

    // must only be set for the root node
    xCoordinate = 0;
    yCoordinate = 0;

    // these get calculated
    prev = null;
    flPrelim = 0;
    flModifier = 0;

    /**
     * Node type field
     */
    type = "";

    // react rendered UI element
    elem = null;

    // user data for the node 
    data = null;

    /**
     * This class is mostly a suggestion. You can extend it in your own code or give
     * in your own type with the expected members.
     *
     */
    constructor(type, data)
    {
        this.id = "tl-item-" + idCounter++;

        this.type = type;
        this.data = data;
    }


    addChild(node)
    {
        node.parent = this;
        node.rightSibling = null;

        if (this.offspring)
        {
            let rightmost = this.offspring;
            let rs;
            while ((rs = rightmost.rightSibling))
            {
                rightmost = rs;
            }

            rightmost.rightSibling = node;
            node.leftSibling = rightmost;
        }
        else
        {
            this.offspring = node;
            node.leftSibling = null;
        }
    }

    get elem ()
    {
        let { elem } = this;

        if (!elem)
        {
            elem = document.getElementById(this.id);
            this.elem = elem;
        }
        return elem;
    }
}


class TreeLayout {
    constructor(options)
    {
        this.options = {
            ... defaultOptions,
            ... options
        };
        
        this.flMeanWidth = 0;

        this.xTopAdjustment = 0;
        this.yTopAdjustment = 0;
        this.aabb = new AABB();
    }


    getConfigValue(name, node)
    {
        const v = this.options[name];

        if (typeof v === "function")
        {
            return v.call(this, node);
        }
        return v;
    }


    _meanNodeSize(pLeftNode, pRightNode)
    {
        this.flMeanWidth = 0;
        /* Initialize this global */

        switch (this.options.ROOT_ORIENTATION)
        {
            case "NORTH":
            case "SOUTH":
                if (pLeftNode)
                {
                    this.flMeanWidth += this.getConfigValue("NODE_WIDTH", pLeftNode) / 2;
                }
                if (pRightNode)
                {
                    this.flMeanWidth += this.getConfigValue("NODE_WIDTH", pRightNode) / 2;
                }
                break;
            case "EAST":
            case "WEST":
                if (pLeftNode)
                {
                    this.flMeanWidth += this.getConfigValue("NODE_HEIGHT", pLeftNode) / 2;
                }
                if (pRightNode)
                {
                    this.flMeanWidth += this.getConfigValue("NODE_HEIGHT", pRightNode) / 2;
                }
                break;
        }
    }


    _getLeftmost(pThisNode, nCurrentLevel, nSearchDepth)
    {
        /*------------------------------------------------------
         * Determine the leftmost descendant of a node at a
         * given depth. This is implemented using a post-order
         * walk of the subtree under pThisNode, down to the
         * level of nSearchDepth. If we've searched to the
         * proper distance, return the currently leftmost node.
         * Otherwise, recursively look at the progressively
         * lower levels.
         *----------------------------------------------------*/

        let pLeftmost;
        /* leftmost descendant at level   */
        let pRightmost;
        /* rightmost offspring in search  */

        if (nCurrentLevel === nSearchDepth)
        {
            return pThisNode;
            /*  searched far enough.    */
        }
        else if (!pThisNode.offspring)
        {
            return null;
            /* This node has no descendants    */
        }
        else
        {
            pRightmost = pThisNode.offspring;
            pLeftmost = this._getLeftmost(pRightmost, nCurrentLevel + 1, nSearchDepth);

            while ((pLeftmost === null) && (pRightmost.rightSibling))
            {
                pRightmost = pRightmost.rightSibling;
                pLeftmost = this._getLeftmost(pRightmost, nCurrentLevel + 1, nSearchDepth);
            }
            return pLeftmost;
        }
    }


    _apportion(pThisNode, nCurrentLevel)
    {
        /*------------------------------------------------------
         * Clean up the positioning of small sibling subtrees.
         * Subtrees of a node are formed independently and
         * placed as close together as possible. By requiring
         * that the subtrees be rigid at the time they are put
         * together, we avoid the undesirable effects that can
         * accrue from positioning nodes rather than subtrees.
         *----------------------------------------------------*/

        let pLeftmost;
        /* leftmost at given level*/
        let pNeighbor;
        /* node left of pLeftmost */
        let pAncestorLeftmost;
        /* ancestor of pLeftmost  */
        let pAncestorNeighbor;
        /* ancestor of pNeighbor  */
        let pTempPtr;
        /* loop control pointer   */
        let i;
        /* loop control           */
        let nCompareDepth = 1;
        /* depth of comparison    */
        /* within this proc       */
        let nDepthToStop;
        /* depth to halt          */
        let nLeftSiblings;
        /* nbr of siblings to the */
        /* left of pThisNode, including pThisNode,  */
        /* til the ancestor of pNeighbor            */
        let flLeftModsum;
        /* sum of ancestral mods  */
        let flRightModsum;
        /* sum of ancestral mods  */
        let flDistance;
        /* difference between     */
        /* where pNeighbor thinks pLeftmost should be   */
        /* and where pLeftmost actually is              */
        let flPortion;
        /* proportion of          */
        /* flDistance to be added to each sibling       */

        pLeftmost = pThisNode.offspring;
        pNeighbor = pLeftmost.prev;

        nCompareDepth = 1;
        nDepthToStop = this.options.MAXIMUM_DEPTH - nCurrentLevel;

        while ((pLeftmost) && (pNeighbor) &&
        (nCompareDepth <= nDepthToStop))
        {

            /* Compute the location of pLeftmost and where it */
            /* should be with respect to pNeighbor.           */
            flRightModsum = flLeftModsum = 0;
            pAncestorLeftmost = pLeftmost;
            pAncestorNeighbor = pNeighbor;

            for (i = 0; i < nCompareDepth; i++)
            {
                pAncestorLeftmost = pAncestorLeftmost.parent;
                pAncestorNeighbor = pAncestorNeighbor.parent;
                flRightModsum += pAncestorLeftmost.flModifier;
                flLeftModsum += pAncestorNeighbor.flModifier;
            }

            /* Determine the flDistance to be moved, and apply*/
            /* it to "pThisNode's" subtree.  Apply appropriate*/
            /* portions to smaller interior subtrees          */

            /* Set the global mean width of these two nodes   */
            this._meanNodeSize(pLeftmost, pNeighbor);

            flDistance = (pNeighbor.flPrelim +
                flLeftModsum +
                this.options.SUBTREE_SEPARATION +
                this.flMeanWidth) -
                (pLeftmost.flPrelim + flRightModsum);

            if (flDistance > 0)
            {
                /* Count the interior sibling subtrees        */
                nLeftSiblings = 0;
                for (pTempPtr = pThisNode; (pTempPtr) && (pTempPtr !== pAncestorNeighbor); pTempPtr = pTempPtr.leftSibling)
                {
                    nLeftSiblings++;
                }

                if (pTempPtr)
                {
                    /* Apply portions to appropriate          */
                    /* leftSibling subtrees.                  */

                    flPortion = flDistance / nLeftSiblings;
                    for (pTempPtr = pThisNode; (pTempPtr !== pAncestorNeighbor); pTempPtr = pTempPtr.leftSibling)
                    {
                        pTempPtr.flPrelim += flDistance;
                        pTempPtr.flModifier += flDistance;

                        flDistance -= flPortion;
                    }
                }
                else
                {
                    /* Don't need to move anything--it needs  */
                    /* to be done by an ancestor because      */
                    /* pAncestorNeighbor and                  */
                    /* pAncestorLeftmost are not siblings of  */
                    /* each other.                            */
                    return;
                }
            }
            /* end of the while                           */

            /* Determine the leftmost descendant of pThisNode */
            /* at the next lower level to compare its         */
            /* positioning against that of its pNeighbor.     */

            nCompareDepth++;

            if (pLeftmost && !pLeftmost.offspring)
            {
                pLeftmost = this._getLeftmost(pThisNode, 0, nCompareDepth);
    //              if (pLeftmost == null)
    //              {
    //              throw new Error("pLeftmost is null for " + pThisNode.name + ", 0, " + nCompareDepth);
    //              }
            }
            else
            {
                pLeftmost = pLeftmost.offspring;
            }
            if (pLeftmost)
            {
                pNeighbor = pLeftmost.prev;
            }
        }
    }


    _firstWalk(pThisNode, nCurrentLevel)
    {
        //console.debug("TreeFirstWalk(%s,%d)", pThisNode.name, nCurrentLevel);

        /*------------------------------------------------------
         * In a first post-order walk, every node of the tree is
         * assigned a preliminary x-coordinate (held in field
         * node->flPrelim). In addition, internal nodes are
         * given modifiers, which will be used to move their
         * children to the right (held in field
         * node->flModifier).
         * Returns: TRUE if no errors, otherwise returns FALSE.
         *----------------------------------------------------*/

        let pLeftmost;
        /* left- & rightmost */
        let pRightmost;
        /* children of a node. */
        let flMidpoint;
        /* midpoint between left- */
        /* & rightmost children */

        /* Set up the pointer to previous node at this level */
        pThisNode.prev = this.prevAtLevel[nCurrentLevel] || null;

        this.prevAtLevel[nCurrentLevel] = pThisNode;

        /** determine max level height */
        let name;
        switch (this.options.ROOT_ORIENTATION)
        {
            case "NORTH":
            case "SOUTH":
                name = "NODE_HEIGHT";
                break;
            case "EAST":
            case "WEST":
                name = "NODE_WIDTH";
                break;
        }

        const h = this.getConfigValue(name, pThisNode);
        this.levelHeight[nCurrentLevel] = Math.max(h + this.options.LEVEL_GAP, this.levelHeight[nCurrentLevel] || 0);
        //console.debug("level %s: h is %s, this.levelHeight = %o", nCurrentLevel, h, this.levelHeight);

        /* Clean up old values in a node's flModifier */
        pThisNode.flModifier = 0;

        if (!pThisNode.offspring || nCurrentLevel === this.options.MAXIMUM_DEPTH)
        {
            if (pThisNode.leftSibling)
            {
                /*--------------------------------------------
                 * Determine the preliminary x-coordinate
                 *   based on:
                 * - preliminary x-coordinate of left sibling,
                 * - the separation between sibling nodes, and
                 * - mean width of left sibling & current node.
                 *--------------------------------------------*/
                /* Set the mean width of these two nodes */
                this._meanNodeSize(pThisNode.leftSibling, pThisNode);
                pThisNode.flPrelim = pThisNode.leftSibling.flPrelim + this.options.SIBLING_SEPARATION + this.flMeanWidth;
            }
            else
            {
                /* no sibling on the left to worry about */
                pThisNode.flPrelim = 0;
            }
        }
        else
        {
            /* Position the leftmost of the children */
            if (this._firstWalk(pLeftmost = pRightmost = pThisNode.offspring, nCurrentLevel + 1))
            {
                /* Position each of its siblings to its right */
                while (pRightmost.rightSibling)
                {
                    if (!this._firstWalk(pRightmost = pRightmost.rightSibling, nCurrentLevel + 1))
                    {
                        return false;
                    }
                }

                /* Calculate the preliminary value between */
                /* the children at the far left and right */
                flMidpoint = (pLeftmost.flPrelim + pRightmost.flPrelim) / 2;

                /* Set global mean width of these two nodes */
                this._meanNodeSize(pThisNode.leftSibling, pThisNode);

                if (pThisNode.leftSibling)
                {
                    pThisNode.flPrelim = pThisNode.leftSibling.flPrelim + this.options.SIBLING_SEPARATION + this.flMeanWidth;
                    pThisNode.flModifier = pThisNode.flPrelim - flMidpoint;

                    this._apportion(pThisNode, nCurrentLevel);
                }
                else
                {
                    pThisNode.flPrelim = flMidpoint;
                }
            }
            else
            {
                return false;
                /* Couldn't get an element */
            }
        }
        return true;
    }


    _secondWalk(pThisNode, nCurrentLevel, curHeight)
    {
        //console.debug("TreeSecondWalk(%s,%d)", pThisNode.name, nCurrentLevel);

        /*------------------------------------------------------
         * During a second pre-order walk, each node is given a
         * final x-coordinate by summing its preliminary
         * x-coordinate and the modifiers of all the node's
         * ancestors.  The y-coordinate depends on the height of
         * the tree.  (The roles of x and y are reversed for
         * RootOrientations of EAST or WEST.)
         * Returns: TRUE if no errors, otherwise returns FALSE.
         *----------------------------------------- ----------*/

        let bResult = true;
        /* assume innocent        */
        let lxTemp, lyTemp;
        /* hold calculations here */
        let flNewModsum;
        /* local modifier value   */

        if (nCurrentLevel <= this.options.MAXIMUM_DEPTH)
        {
            flNewModsum = this.flModsum;
            /* Save the current value  */
            switch (this.options.ROOT_ORIENTATION)
            {
                case "NORTH":
                    lxTemp = this.xTopAdjustment + (pThisNode.flPrelim + this.flModsum);
                    lyTemp = this.yTopAdjustment + curHeight;
                    break;
                case "SOUTH":
                    lxTemp = this.xTopAdjustment + (pThisNode.flPrelim + this.flModsum);
                    lyTemp = this.yTopAdjustment - curHeight;
                    break;
                case "EAST":
                    lxTemp = this.xTopAdjustment - curHeight;
                    lyTemp = this.yTopAdjustment - (pThisNode.flPrelim + this.flModsum);
                    break;
                case "WEST":
                    lxTemp = this.xTopAdjustment + curHeight;
                    lyTemp = this.yTopAdjustment - (pThisNode.flPrelim + this.flModsum);
                    break;
            }

            /* The values are within the allowable range */
            lxTemp = lxTemp | 0;
            lyTemp = lyTemp | 0;

            pThisNode.xCoordinate = lxTemp;
            pThisNode.yCoordinate = lyTemp;

            this.aabb.extend(lxTemp, lyTemp);
            this.aabb.extend(lxTemp + this.getConfigValue("NODE_WIDTH", pThisNode), lyTemp + this.getConfigValue("NODE_HEIGHT", pThisNode));

            if (pThisNode.offspring)
            {
                /* Apply the flModifier value for this    */
                /* node to all its offspring.             */
                this.flModsum = flNewModsum = flNewModsum + pThisNode.flModifier;

                bResult = this._secondWalk(pThisNode.offspring, nCurrentLevel + 1, curHeight + this.levelHeight[nCurrentLevel]);
                flNewModsum = flNewModsum - pThisNode.flModifier;
            }

            if (pThisNode.rightSibling && bResult)
            {
                this.flModsum = flNewModsum;
                bResult = this._secondWalk(pThisNode.rightSibling, nCurrentLevel, curHeight);
            }
        }
        return bResult;
    }


    layout(pApexNode)
    {
        /*------------------------------------------------------
         * Determine the coordinates for each node in a tree.
         * Input: Pointer to the apex node of the tree
         * Assumption: The x & y coordinates of the apex node
         * are already correct, since the tree underneath it
         * will be positioned with respect to those coordinates.
         * Returns: TRUE if no errors, otherwise returns FALSE.
         *----------------------------------------------------*/

        this.prevAtLevel = [];
        this.levelHeight = [];

        this.flModsum = 0;

        if (pApexNode)
        {
            /* Generate the properly-placed tree nodes.      */
            /* TreeFirstWalk: a post-order walk              */
            /* TreeSecondWalk: a pre-order walk              */
            if (this._firstWalk(pApexNode, 0))
            {
                /* Determine how to adjust the nodes with     */
                /* respect to the location of the apex of the */
                /* tree being positioned.                     */
                switch (this.options.ROOT_ORIENTATION)
                {
                    case "NORTH":
                    case "SOUTH":
                        /* Create the adjustment from x-coord  */
                        this.xTopAdjustment = pApexNode.xCoordinate - pApexNode.flPrelim;
                        this.yTopAdjustment = pApexNode.yCoordinate;
                        break;
                    case "EAST":
                    case "WEST":
                        /* Create the adjustment from y-coord  */
                        this.xTopAdjustment = pApexNode.xCoordinate;
                        this.yTopAdjustment = pApexNode.yCoordinate + pApexNode.flPrelim;
                        break;
                }

                return this._secondWalk(pApexNode, 0, 0);
            }
            else
            {
                return false;
                /*  Couldn't get an element   */
            }
        }
        else
        {
            return true;
            /*  Easy: null pointer was passed  */
        }
    }
}


export default TreeLayout;
