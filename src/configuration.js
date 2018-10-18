import React from "react"
import DefaultLayout from "./ui/DefaultLayout";

const DEFAULT_OPTS = {
    layout: DefaultLayout,
    translations: {}
};

let config = DEFAULT_OPTS;

export function configuration(opts)
{
    if (opts === undefined)
    {
        return config;
    }

    config = {
        ... DEFAULT_OPTS,
        ... opts
    };
}

