import { createContext } from "react"

function sortIntersections(a, b) {
    if (a.ratio < b.ratio) {
        return 1;
    }
    if (a.ratio > b.ratio) {
        return -1;
    }
    const aTop = a.element.getBoundingClientRect().top;
    const bTop = b.element.getBoundingClientRect().top;
    if (aTop < bTop) {
        return -1;
    }
    if (aTop > bTop) {
        return 1;
    }
    return 0;
}

export class ReadingPositionState {

    intersectionObserver = null;
    intersections;
    section = "";

    constructor(intersectionObserver, intersections = {}) {
        this.intersectionObserver = intersectionObserver;
        this.intersections = intersections;
        // calculate the section link that should be marked
        const weighted = Object.values(this.intersections).sort(sortIntersections);
        this.section = weighted.length ? weighted[0].element.id : "";
        // console.log(this);
    }

    withIntersection = (element, ratio) =>
    {
        let newIntersections = null;
        if (ratio > 0) {
            newIntersections = {
                ... this.intersections,
                [element.id]: {element, ratio}
            }
        } else {
            const {
                [element.id]: removed,
                ... remaining
            } = this.intersections;
            newIntersections = remaining;
        }
        return new ReadingPositionState(this.intersectionObserver, newIntersections);
    }

}

const ReadingPosition = createContext(null);

export default ReadingPosition;
