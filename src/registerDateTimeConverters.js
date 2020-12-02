import React from "react"
import config from "./config";
import { getWireFormat } from "./domain";
import { DateTime } from "luxon";
import i18n from "./i18n";
import { registerCustomConverter, GlobalConfig } from "domainql-form";

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

            const dateFormat = (ctx && ctx.dateFormat) || DEFAULT_DATE_FORMAT;
            const dt = DateTime.fromFormat(value, dateFormat);

            return dt.isValid ? null : i18n("Invalid Date: Does not match {0}, {1}", dateFormat, dt.invalidReason);
        },
        (scalar, ctx) => {

            if (!scalar)
            {
                return "";
            }

            const dateFormat = (ctx && ctx.dateFormat) || config.timestampFormat;
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

    GlobalConfig.registerStaticRenderer(
        "Timestamp",
            dt => (
                <span className="static-timestamp">{
                    dt.toFormat(config.timestampFormat)
                }
                </span>
            )
    )
    GlobalConfig.registerStaticRenderer(
        "Date",
            dt => (
                <span className="static-date">
                    {
                        dt.toFormat(config.dateFormat)
                    }
                </span>
            ) )
}
