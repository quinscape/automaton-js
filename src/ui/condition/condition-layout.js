import React from "react";

import { Type } from "../../FilterDSL";

export function join(path, name)
{
    return path ? path + "." + name : name;
}

export const STRUCTURAL_CONDITIONS = {
    "and" : true,
    "or" : true,
    "not" : true,
    "andNot" : true,
    "orNot" : true,
}


export function isStructuralCondition(condition)
{
    return condition.type === Type.CONDITION && STRUCTURAL_CONDITIONS[condition.name] ||
           condition.type === Type.COMPONENT
}


/**
 * Axis-aligned bounding box
 */
export class AABB {

    minX = Infinity;
    minY = Infinity;
    maxX = -Infinity;
    maxY = -Infinity;

    add(x, y)
    {
        this.minX = Math.min(this.minX, x);
        this.minY = Math.min(this.minY, y);
        this.maxX = Math.max(this.maxX, x);
        this.maxY = Math.max(this.maxY, y);
    }

    get width()
    {
        return (this.maxX|0) - (this.minX|0);
    }


    get height()
    {
        return (this.maxY|0) - (this.minY|0);
    }

    reset()
    {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
    }

    static equals(a,b)
    {
        if (!a && !b)
        {
            return true;
        }
        else if (a && !b)
        {
            return false;
        }
        else if (!a && b)
        {
            return false;
        }
        else
        {
            return a.minX === b.minX && a.minY === b.minY && a.maxX === b.maxX && a.maxY === b.maxY;
        }
    }
}
