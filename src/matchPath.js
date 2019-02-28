const NO_MATCH = new MatchPathResult(null, null, false, false);

const MODULE_REGEX = /^\.\/((processes\/(.*?)\/(composites\/)?)|(domain\/))?(.*?).js(on)?$/;

/**
 * Creates a new MatchPathResult instance
 *
 * @param {String} processName      Name of the process the file is part of or null if it is not part of a process
 * @param {String} shortName        Short name of the file without .js or .json extension
 * @param {boolean} isDomain        true if the file is a domain model
 * @param {boolean} isComposite     true if the file is composite model
 * @constructor
 */
function MatchPathResult(processName, shortName, isDomain, isComposite)
{
    this.processName = processName;
    this.shortName = shortName;
    this.isDomain = isDomain;
    this.isComposite = isComposite;
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

    return new MatchPathResult(
        m[3],
        m[6],
        !!m[5],
        !!m[4]
    );
}
