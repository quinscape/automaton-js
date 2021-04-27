const NO_MATCH = new MatchPathResult(null, null, false, false, false,false);

const MODULE_REGEX = /^\.\/((processes\/(.*?)\/(composites\/|queries\/|states\/)?)|(domain\/)|(queries\/))?(.*?).js(on)?$/;

/**
 *
 * Creates a new MatchPathResult instance
 *
 * @param {String} processName      Name of the process the file is part of or null if it is not part of a process
 * @param {String} shortName        Short name of the file without .js or .json extension
 * @param {boolean} isDomain        true if the file is a domain model
 * @param {boolean} isComposite     true if the file is composite model
 * @param {boolean} isQuery         true if the file is query model
 * @param {boolean} isState         true if the file is state model
 * @constructor
 */
function MatchPathResult(processName, shortName, isDomain, isComposite, isQuery, isState)
{
    this.processName = processName;
    this.shortName = shortName;
    this.isDomain = isDomain;
    this.isComposite = isComposite;
    this.isQuery = isQuery;
    this.isState = isState;
}

/**
 * Categorizes application internal relative js or json paths according to the internal model location rules.
 *
 * @param path   internal path within the application starting with "./"
 * 
 * @returns {MatchPathResult} result (see above)
 */
export default function matchPath(path)
{
    const m = MODULE_REGEX.exec(path);
    if (!m)
    {
        return NO_MATCH;
    }

    const processName = m[3];
    const shortName = m[7];
    const isDomain = !!m[5];
    const isComposite = m[4] === "composites/";
    const isQuery = m[4] === "queries/" || !!m[6];
    const isState = m[4] === "states/";

    return new MatchPathResult(
        processName !== undefined ? processName : null,
        shortName,
        isDomain,
        isComposite,
        isQuery,
        isState
    );
}
