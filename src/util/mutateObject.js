export function setInObjectAtPath(object, path, value) {
    const pathArray = path.split(".");
    const current = pathArray.shift();
    if (pathArray.length > 0) {
        if (object[current] == null) {
            object[current] = {};
        }
        if (typeof object[current] !== "object") {
            return false;
        }
        return setInObjectAtPath(object[current], pathArray.join("."), value);
    }
    object[current] = value;
    return true;
}

export function setInObjectAtPathImmutable(object, path, value, result = {}) {
    const pathArray = path.split(".");
    const current = pathArray.shift();
    for (const key in object) {
        result[key] = object[key];
    }
    if (pathArray.length > 0) {
        if (result[current] == null) {
            result[current] = {};
        }
        if (typeof object[current] !== "object") {
            return false;
        }
        return setInObjectAtPathImmutable(object[current], pathArray.join("."), value, result[current]);
    }
    result[current] = value;
    return true;
}

export function removeFromObjectAtPath(object, path) {
    const pathArray = path.split(".");
    const current = pathArray.shift();
    if (pathArray.length > 0) {
        if (object[current] == null || typeof object[current] !== "object") {
            return false;
        }
        return removeFromObjectAtPath(object[current], pathArray.join("."));
    }
    delete object[current];
    return true;
}
