/**
 * Represents an axis-aligned bounding box and offers an extension operator
 */
export default class AABB {
    constructor()
    {
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
    }


    extend(x, y)
    {
        this.minX = Math.min(this.minX, x);
        this.minY = Math.min(this.minY, y);
        this.maxX = Math.max(this.maxX, x);
        this.maxY = Math.max(this.maxY, y);
    }


    width()
    {
        return (this.maxX - this.minX) | 0;
    }


    height()
    {
        return (this.maxY - this.minY) | 0;
    }
}
