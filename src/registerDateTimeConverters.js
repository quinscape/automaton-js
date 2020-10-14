import React from "react"
import { getWireFormat } from "./domain";
import { DateTime } from "luxon";
import i18n from "./i18n";
import { registerCustomConverter, GlobalConfig } from "domainql-form";

export const DEFAULT_TIMESTAMP_FORMAT = "d.M.yyyy H:mm:ss.SSS";
export const DEFAULT_DATE_FORMAT = "d.M.yyyy";

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
            console.log("wireFormat.Date", dt.toISO())
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

            const timestampFormat = (ctx && ctx.timestampFormat) || DEFAULT_TIMESTAMP_FORMAT;
            const dt = DateTime.fromFormat(value, timestampFormat);

            return dt.isValid ? null : i18n("Invalid Date: Does not match {0}, {1}", timestampFormat, dt.invalidReason)
        },
        (scalar, ctx) => {

            if (!scalar)
            {
                return "";
            }

            const timestampFormat = (ctx && ctx.timestampFormat) || DEFAULT_TIMESTAMP_FORMAT;
            return scalar.toFormat(timestampFormat);
        },
        (value, ctx) => {

            if (!value)
            {
                return null;
            }

            const timestampFormat = (ctx && ctx.timestampFormat) || DEFAULT_TIMESTAMP_FORMAT;
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

            const dateFormat = (ctx && ctx.dateFormat) || DEFAULT_DATE_FORMAT;
            const dt = DateTime.fromFormat(value, dateFormat);

            return dt.isValid ? null : i18n("Invalid Date: Does not match {0}, {1}", dateFormat, dt.invalidReason);
        },
        (scalar, ctx) => {

            if (!scalar)
            {
                return "";
            }

            const dateFormat = (ctx && ctx.dateFormat) || DEFAULT_DATE_FORMAT;
            return scalar.toFormat(dateFormat);
        },
        (value, ctx) => {

            if (!value)
            {
                return null;
            }

            const dateFormat = (ctx && ctx.dateFormat) || DEFAULT_DATE_FORMAT;
            return DateTime.fromFormat(value, dateFormat);
        }
    )

    GlobalConfig.registerStaticRenderer(
        "Timestamp",
            dt => (
                <span className="static-timestamp">{
                    dt.toFormat(DEFAULT_TIMESTAMP_FORMAT)
                }
                </span>
            )
    )
    GlobalConfig.registerStaticRenderer(
        "Date",
            dt => (
                <span className="static-date">
                    {
                        dt.toFormat(DEFAULT_DATE_FORMAT)
                    }
                </span>
            ) )

}
