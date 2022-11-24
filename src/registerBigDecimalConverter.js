import React from "react";
import BigNumber from "bignumber.js";
import { registerCustomConverter, GlobalConfig, resolveStaticRenderer } from "domainql-form";

import i18n from "./i18n";
import config from "./config";
import { getWireFormat } from "./domain";
import { getOutputTypeName, getParentObjectType, unwrapNonNull } from "./util/type-utils";
import { NO_DEFAULT } from "./registerDateTimeConverters";


const DEFAULT_OPTIONS = {
    useFixed: true,
    defaultPrecision: 19,
    defaultScale: 2,

};

const DECIMAL_TRIM_REGEX = /(?:,[0 ]*|(,[0-9 ]*?[1-9 ])[0 ]*)$/gm;
const DECIMAL_TRIM_REPLACER = "$1";

function defaultParser(value, opts)
{
    const { prefix, groupSeparator, decimalSeparator, fractionGroupSeparator, suffix } = BigNumber.config().FORMAT;

    if (prefix && value.indexOf(prefix) === 0)
    {
        value = value.substr(prefix.length);
    }
    if (suffix)
    {
        const suffixStart = value.length - suffix.length;
        if (value.lastIndexOf(suffix) === suffixStart)
        {
            value = value.substr(0, suffixStart);
        }
    }

    let cleaned = "";
    for (let i = 0; i < value.length; i++)
    {
        const c = value[i];

        if (c === decimalSeparator)
        {
            cleaned += ".";
        }
        else if (c !== groupSeparator && c !== fractionGroupSeparator)
        {
            cleaned += c;
        }
    }
    return new BigNumber(cleaned);
}

const precisions = new WeakMap();

function getPrecision(ctx, opts)
{
    // without field context, use defaults
    if (!ctx)
    {
        return {
            precision: opts.defaultPrecision,
            scale: opts.defaultScale,
        };
    }

    let p = precisions.get(ctx);
    if (p)
    {
        return p;
    }

    const {path, rootType, precision, scale} = ctx;

    p = {
        precision: opts.defaultPrecision,
        scale: opts.defaultScale,
    };

    if (precision == null || scale == null)
    {
        const { inputSchema } = config;

        let type;
        const { length: pathLength } = path;

        if (pathLength === 1)
        {
            type = getOutputTypeName(rootType);
        }
        else
        {
            type = getOutputTypeName(getParentObjectType(rootType, path))
        }

        const metaPrecision = inputSchema.getFieldMeta(type, path[pathLength - 1], "decimalPrecision")
        if (metaPrecision !== null)
        {
            p = metaPrecision
        }
    }

    if (ctx.precision != null) {
        p.precision = ctx.precision;
    }
    if (ctx.scale != null) {
        p.scale = ctx.scale;
    }
    
    if (p.precision == null || p.scale == null) /* check for null AND undefined */
    {
        throw new Error(
            "Could not find precision/scale for " + type + "." + path + ", " +
            "information is missing from config.decimalPrecision. " +
            "Either include the values for that field or define precision and scale as <DecimalField/> prop"
        );
    }

    precisions.set(ctx, p);
    return p;
}


/**
 * Registers a custom converter for the "BigDecimal" type based on the given BigNumber construBigNumber. By default the
 * standard BigNumber constructor is used, so you can either reconfigure the standard constructor or create a
 * newly configured clone
 *
 * @param {Object} [opts]                     options
 * @param {boolean} opts.defaultPrecision   Default numerical precision
 * @param {boolean} opts.defaultScale       Default numerical scale
 */
export default function registerBigDecimalConverter(opts) {

    opts = {
        ...DEFAULT_OPTIONS,
        ...opts
    };

    getWireFormat().registerConverter("BigDecimal", value => {
        if (value === null)
        {
            return null;
        }

        return new BigNumber(value);
    }, value => {
        if (value === null)
        {
            return null;
        }
        return value.toPrecision();
    })

    registerCustomConverter(
        "BigDecimal",
        (value, ctx) => {
            if (value === null)
            {
                return null;
            }
            const p = getPrecision(ctx, opts);
            const num = defaultParser(value, opts);
            if (num.isNaN())
            {
                return i18n("Invalid Big Decimal");
            }

            if (!num.isFinite() || num.precision() > p.precision)
            {
                return i18n("Out of range");
            }

            return null;
        },
        (scalar, ctx) => {

            if (!scalar)
            {
                return "";
            }
            if (!(scalar instanceof BigNumber)) {
                return scalar;
            }

            const p = getPrecision(ctx, opts);
            if (ctx != null && ctx.padToScale) {
                return scalar.toFormat(p.scale);
            } else {
                return scalar.toFormat(p.scale).replace(DECIMAL_TRIM_REGEX, DECIMAL_TRIM_REPLACER);
            }
        },
        value => {

            if (!value)
            {
                return null;
            }

            return defaultParser(value, opts);
        }
    )

    const staticRenderer = resolveStaticRenderer("BigDecimal", NO_DEFAULT);

    if (!staticRenderer)
    {
        GlobalConfig.registerStaticRenderer(
            "BigDecimal",
            bd => (
                <span className="bd-wrapper">
                    <span className="bd-inner">{
                        bd instanceof BigNumber ?
                            bd.toFormat(getPrecision(null, opts).scale).replace(DECIMAL_TRIM_REGEX, DECIMAL_TRIM_REPLACER) :
                            bd
                    }</span>
                </span>
            )
        )
    }
}
