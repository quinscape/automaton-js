import config from "../../config";

/**
 * word  = (?:\!?(?:\*\s*)?[^*!&|\s]+(?:\s*\*?\s*[^*!&|\s]+)*(?:\s*\*)?)
 * extra = (?:\s*[&|]\s*${word})*
 * regex = ^(?:${word}${extra})?$
 */
const VALID_FILTER_PATTERN = /^(?:(?:\!?(?:\*\s*)?[^*!&|\s]+(?:\s*\*?\s*[^*!&|\s]+)*(?:\s*\*)?)(?:\s*[&|]\s*(?:\!?(?:\*\s*)?[^*!&|\s]+(?:\s*\*?\s*[^*!&|\s]+)*(?:\s*\*)?))*)?$/;

/**
 * Checks whether the entered String is a valid pattern
 * 
 * @param searchString {string} the search string to be validated
 * @returns {null|string} null if is valid, "Not a valid pattern" otherwise
 */
export function validateSearch(searchString) {
    if (!VALID_FILTER_PATTERN.test(searchString)) {
        return "Not a valid pattern";
    }
    return null;
}

const REGEXP_ESCAPE = /[.+?^${}()|[\]\\]/g;
const SUBSTI_ESCAPE = "\\$&";
const REGEXP_UNESCAPE = /\\([.+?^${}()|[\]\\])/g;
const SUBSTI_UNESCAPE = "$1";

function parseWildcard(searchString) {
    if (!searchString.includes("*")) {
        return `^.*${searchString.replace(REGEXP_ESCAPE, SUBSTI_ESCAPE)}.*$`;
    }
    return `^${searchString.replace(REGEXP_ESCAPE, SUBSTI_ESCAPE).replace(/\*+/g, ".*")}$`;
}

function parseNot(searchString) {
    searchString = searchString.trim();
    if (config.searchStringPatternAllowNot && searchString.startsWith("!")) {
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
    return searchString.split("|").map(parseAnd).join("|");
}

/**
 * Turns a search string into a RegExp string with the following rules:
 * - a wilcard is written as "*"
 * - "and" is written as "&"
 * - "or" is written as "|"
 * - "not" is written as "!" (if allowed)
 * - no brackets
 * - "and" binds stronger than "or"
 * - if there is no expression, just match as contains
 * 
 * @param searchString {string} the search string to be parsed
 * @returns {string} the resulting RegExp string
 */
export function parseSearch(searchString) {
    if (searchString == null || searchString === "") {
        return searchString;
    }
    const usedCombinators = searchString.includes("&") || searchString.includes("|");
    const resultRegExp = usedCombinators ? parseOr(searchString) : parseNot(searchString);
    return resultRegExp;
}


function stringifyWildcard(regExpString) {
    regExpString = regExpString.replace(/^\^|\$$/g, "");
    if (regExpString.startsWith(".*") && regExpString.endsWith(".*")) {
        const sliced = regExpString.slice(2, -2);
        if (!sliced.includes(".*")) {
            return sliced.replace(REGEXP_UNESCAPE, SUBSTI_UNESCAPE);
        }
    }
    return regExpString.replace(/\.\*/g, "*").replace(REGEXP_UNESCAPE, SUBSTI_UNESCAPE);
}

function stringifyNot(regExpString) {
    if (config.searchStringPatternAllowNot && regExpString.startsWith("(?:(?!") && regExpString.endsWith(")^.*$)")) {
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
    return regExpString.split("|").map(stringifyAnd).join(" | ");
}

/**
 * Turns a RegExp string into a search string with the following rules:
 * - a wilcard is written as "*"
 * - "and" is written as "&"
 * - "or" is written as "|"
 * - "not" is written as "!" (if allowed)
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
    const resultString = stringifyOr(regExpString);
    return resultString;
}
