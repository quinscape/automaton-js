import { DateTime } from "luxon";

const SearchQuery = Object.freeze({
    stringify: (value) => {
        return JSON.stringify(value);
    },
    parse: (text) => {
        return JSON.parse(text, (key, el) => {
            if (el?.scalarType != null) {
                switch (el.scalarType) {
                    case "Date":
                    case "Timestamp": return {
                        scalarType: el.scalarType,
                        type: el.type,
                        value: DateTime.fromISO(value)
                    };
                    case "DateRange": return {
                        scalarType: el.scalarType,
                        type: el.type,
                        value: value?.map(v => DateTime.fromISO(v)) ?? []
                    };
                }
            }
            return el;
        });
    }
});

export default SearchQuery;