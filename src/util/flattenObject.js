export default function flattenObject(obj, res={}) {
    if (typeof obj != "object") {
        return obj;
    }
    for (const key in obj) {
        const value = obj[key];
        if (typeof value == "object") {
            const flatObj = flattenObject(value);
            for (const flatKey in flatObj) {
                res[`${key}.${flatKey}`] = flatObj[flatKey];
            }
        } else {
            res[key] = value;
        }
    }
    return res;
}