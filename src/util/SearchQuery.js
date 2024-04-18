import { DateTime } from "luxon";

const SearchQuery = Object.freeze({
    stringify: (value) => {
        return JSON.stringify(value);
    },
    parse: (text) => {
        return JSON.parse(text, (key, reviverValue) => {
            if (reviverValue?.scalarType != null) {
                switch (reviverValue.scalarType) {
                    case "Date":
                    case "Timestamp": return {
                        scalarType: reviverValue.scalarType,
                        type: reviverValue.type,
                        value: DateTime.fromISO(reviverValue.value)
                    };
                    case "DateRange": return {
                        scalarType: reviverValue.scalarType,
                        type: reviverValue.type,
                        value: reviverValue.value?.map(v => DateTime.fromISO(v)) ?? []
                    };
                }
            }
            return reviverValue;
        });
    }
});

export default SearchQuery;