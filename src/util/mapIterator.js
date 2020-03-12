/**
 * Calls the given callback once for every entry in a ES6 Map and return all return values
 * as array
 *
 * @param {Map} map     input map
 * @param {Function<>}cb
 * @returns {[]}
 */
export default function mapIterator(map, cb) {
    const agg = [];
    if (map)
    {
        for (let [key, value] of map)
        {
            agg.push(
                cb(value, key)
            );
        }
    }
    return agg;
};
