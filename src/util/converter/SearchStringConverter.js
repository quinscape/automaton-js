function parseWildcard(searchString) {
    if (!searchString.includes("*")) {
        return `^.*${searchString}.*$`;
    }
    return `^${searchString.replace(/\*+/g, ".*")}$`;
}

function parseNot(searchString) {
    searchString = searchString.trim();
    if (searchString.startsWith("!")) {
        return `(?:(?!${parseWildcard(searchString.slice(1))})^.*$)`;
    }
    return parseWildcard(searchString);
}

function parseAnd(searchString) {
    const result = searchString.split("&").map(parseNot);
    if (result.length > 1) {
        return `(?=${result.join(")(?=")}).*`;
    }
    return result[0];
}

function parseOr(searchString) {
    return searchString.split("/").map(parseAnd).join("|");
}

/**
 * Turns a search string into a RegExp string with the following rules:
 * - a wilcard is written as "*"
 * - "and" is written as "&"
 * - "or" is written as "/"
 * - "not" is written as "!"
 * - no brackets
 * - "and" binds stronger than "or"
 * - if there is no expression, just match as contains
 * 
 * @param searchString {string} the search string to be parsed
 * @returns {string} the resulting RegExp string
 */
export function parseSearch(searchString) {
    if (searchString == null || searchString === "" || (!searchString.includes("&") && !searchString.includes("/") && !searchString.includes("*") && !searchString.includes("!"))) {
        return searchString;
    }
    console.group("parseSearch")
    console.log("String to parse:", searchString);
    const resultRegExp = parseOr(searchString);
    console.log("resulting RegExp:", resultRegExp);
    console.groupEnd("parseSearch")
    return resultRegExp;
}


function stringifyWildcard(regExpString) {
    regExpString = regExpString.replace(/^\^|\$$/g, "");
    if (regExpString.startsWith(".*") && regExpString.endsWith(".*")) {
        const sliced = regExpString.slice(2, -2);
        if (!sliced.includes(".*")) {
            return sliced;
        }
    }
    return regExpString.replace(/\.\*/g, "*");
}

function stringifyNot(regExpString) {
    if (regExpString.startsWith("(?:(?!") && regExpString.endsWith(")^.*$)")) {
        return `!${stringifyWildcard(regExpString.slice(6, -6))}`;
    }
    return stringifyWildcard(regExpString);
}

function stringifyAnd(regExpString) {
    if (regExpString.startsWith("(?=") && regExpString.endsWith(").*")) {
        return regExpString.slice(3, -3).split(")(?=").map(stringifyNot).join(" & ");
    }
    return stringifyNot(regExpString);
}

function stringifyOr(regExpString) {
    return regExpString.split("|").map(stringifyAnd).join(" / ");
}

/**
 * Turns a RegExp string into a search string with the following rules:
 * - a wilcard is written as "*"
 * - "and" is written as "&"
 * - "or" is written as "/"
 * - "not" is written as "!"
 * - no brackets
 * - "and" binds stronger than "or"
 * - if there is no expression, just match as contains
 * 
 * @param regExpString {string} the RegExp string to be parsed
 * @returns {string} the resulting search string
 */
export function stringifySearch(regExpString) {
    if (regExpString == null || regExpString === "") {
        return regExpString;
    }
    console.group("stringifySearch");
    console.log("RegExp to stringify:", regExpString);
    const resultString = stringifyOr(regExpString);
    console.log("resulting String:", resultString);
    console.groupEnd("stringifySearch");
    return resultString;
}
