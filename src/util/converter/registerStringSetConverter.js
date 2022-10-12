import {registerCustomConverter} from "domainql-form";
import i18n from "../../i18n";

const SEPARATOR = ",";

export default function registerStringSetConverter() {
    registerCustomConverter(
        "StringSet",
        (value) => {
            if (isScalarArrayOfStirng(value) || typeof value === "string") {
                return null;
            }
            return i18n("Not an array of string");
        },
        (scalar) => {
            return scalar.join(SEPARATOR);
        },
        (value) => {
            return typeof value === "string" ? value.split(SEPARATOR) : value;
        }
    );
}

function isScalarArrayOfStirng(scalar) {
    return Array.isArray(scalar) && scalar.every((entry) => typeof entry === "string");
}
