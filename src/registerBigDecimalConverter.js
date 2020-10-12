import BigNumber from "bignumber.js";
import { registerCustomConverter } from "domainql-form/lib/InputSchema";
import i18n from "./i18n";
import config from "./config";
import { useMemo } from "react";
import { getWireFormat } from "./domain";
import { getOutputTypeName } from "./util/type-utils";


const DEFAULT_OPTIONS = {
    useFixed: true,
    defaultPrecision: 19,
    defaultScale: 2,

};

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

    // are both precision and scale specified on the field
    if (precision !== undefined && scale !== undefined)
    {
        p = {
            precision,
            scale
        };
    }

    const { inputSchema, decimalPrecision } = config;

    let type;
    const { length: pathLength } = path;

    if (pathLength === 1)
    {
        type = getOutputTypeName(rootType);
    }
    else
    {
        type = getOutputTypeName(inputSchema.resolveType(rootType, path.slice(0, -1)))
    }

    for (let i = 0; i < decimalPrecision.length; i++)
    {
        const { domainType, fieldName, precision, scale } = decimalPrecision[i];

        if (type === domainType && fieldName === path[pathLength - 1])
        {
            p = {
                precision,
                scale
            }
        }

    }

    if (p === null)
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

            const p = getPrecision(ctx, opts);
            return scalar.toFormat(p.scale);
        },
        value => {

            if (!value)
            {
                return null;
            }

            return defaultParser(value, opts);
        }
    )
}
