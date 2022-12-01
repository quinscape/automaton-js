import React from "react"
import config from "./config";
import { getWireFormat } from "./domain";
import { DateTime } from "luxon";
import i18n from "./i18n";
import { registerCustomConverter, GlobalConfig, resolveStaticRenderer } from "domainql-form";

const DATE_RANGE_SEPARATOR = " - ";

export const NO_DEFAULT = { default: false };

export default function registerDateTimeConverters()
{
    const wireFormat = getWireFormat();
    
    wireFormat.registerConverter(
        "Date",
            value => {
            if (value === null)
            {
                return null;
            }
            const dt = DateTime.fromISO(value);
            return dt;
        },
            value => {
            if (value === null)
            {
                return null;
            }
            return value.toISODate();
        }
    );

    wireFormat.registerConverter(
        "Timestamp",
            value => {
            if (value === null)
            {
                return null;
            }
            return DateTime.fromISO(value).toLocal();
        },
            value => {
            if (value === null)
            {
                return null;
            }       
            return value.toUTC().toISO();
        }
    );

    registerCustomConverter(
        "Timestamp",
        (value, ctx) => {
            if (value === null)
            {
                return null;
            }

            const timestampFormat = (ctx && ctx.timestampFormat) || config.timestampFormat;
            const dt = DateTime.fromFormat(value, timestampFormat);

            return dt.isValid ? null : i18n("Invalid Date: Does not match {0}, {1}", timestampFormat, dt.invalidReason)
        },
        (scalar, ctx) => {

            if (!scalar)
            {
                return "";
            }

            const timestampFormat = (ctx && ctx.timestampFormat) || config.timestampFormat;
            return scalar.toFormat(timestampFormat);
        },
        (value, ctx) => {

            if (!value)
            {
                return null;
            }

            const timestampFormat = (ctx && ctx.timestampFormat) || config.timestampFormat;
            return DateTime.fromFormat(value, timestampFormat);
        }
    )

    registerCustomConverter(
        "Date",
        (value, ctx) => {
            if (value === null)
            {
                return null;
            }

            const dateFormat = (ctx && ctx.dateFormat) || config.dateFormat;
            const dt = DateTime.fromFormat(value, dateFormat);

            return dt.isValid ? null : i18n("Invalid Date: Does not match {0}, {1}", dateFormat, dt.invalidReason);
        },
        (scalar, ctx) => {

            if (!scalar)
            {
                return "";
            }

            const dateFormat = (ctx && ctx.dateFormat) || config.dateFormat;
            return scalar.toFormat(dateFormat);
        },
        (value, ctx) => {

            if (!value)
            {
                return null;
            }

            const dateFormat = (ctx && ctx.dateFormat) || config.dateFormat;
            return DateTime.fromFormat(value, dateFormat);
        }
    )


    registerCustomConverter(
        "DateRange",
        (value, ctx) => {
            if (value === null) {
                return null;
            }

            const dateFormat = ctx?.dateFormat ?? config.dateFormat;
            if (!Array.isArray(value)) {
                value = value.split(DATE_RANGE_SEPARATOR).map(dateString => {
                    return DateTime.fromFormat(dateString, dateFormat);
                });
            }

            if(value.length > 2) {
                return i18n("Too many elements in DateRange ({0}), DateRange must have at most 2 elements.", value.length);
            }
            const isValid = value.reduce((acc, dateTime) => {
                if(!dateTime.isValid) {
                    acc[0] = false;
                    acc.push(dateTime.invalidReason);
                }
                return acc;
            }, [true]);

            return isValid.shift() ? null : i18n("Invalid DateRange Object: Does not match {0}, {1}", dateFormat, isValid.join(", "));
        },
        (scalar, ctx) => {
            if (scalar?.[0] == null) {
                return "";
            }

            const dateFormat = ctx?.dateFormat ?? config.dateFormat;

            if (scalar[0].equals(scalar[1])) {
                return scalar[0].toFormat(dateFormat);
            }

            return scalar.map(dateTime => {
                return dateTime.toFormat(dateFormat);
            }).join(DATE_RANGE_SEPARATOR);
        },
        (value, ctx) => {
            if (!value) {
                return [];
            }
            if (Array.isArray(value)) {
                return value;
            }

            const dateFormat = ctx?.dateFormat ?? config.dateFormat;
            const values = value.split(DATE_RANGE_SEPARATOR).map(dateString => {
                return DateTime.fromFormat(dateString, dateFormat);
            });

            if (values.length === 0) {
                values.push(DateTime.now());
                values.push(DateTime.now());
            } else if (values.length === 1) {
                values.push(values[0]);
            }

            return values;
        }
    )

    if (!resolveStaticRenderer("Timestamp", NO_DEFAULT))
    {
        GlobalConfig.registerStaticRenderer(
            "Timestamp",
            dt => (
                <span className="static-timestamp">{
                    dt.toFormat(config.timestampFormat)
                }
                </span>
            )
        )
    }


    if (!resolveStaticRenderer("Date", NO_DEFAULT))
    {
        GlobalConfig.registerStaticRenderer(
            "Date",
            dt => (
                <span className="static-date">
                    {
                        typeof dt === "string" ? dt : dt.toFormat(config.dateFormat)
                    }
                </span>
            ))
    }
}
