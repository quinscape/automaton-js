const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase, { defaultConfig }) => {
    return {
        // XXX: current deployment on my local machine under "hostname/test/<project>"
        basePath: phase === PHASE_DEVELOPMENT_SERVER ? "" : "/test/automaton-js",
        trailingSlash: true,

        webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {

            //console.log("CONFIG", JSON.stringify(config));

            config.module.rules.push(
                {
                    oneOf: [
                        {
                            test: /\.icon.svg$/,
                            use: [{
                                loader: '@svgr/webpack',
                                options: {
                                    icon: true,
                                    svgo: true,
                                    svgoConfig: {
                                        plugins: {
                                            addClassesToSVGElement: {
                                                classNames: ["icon", "mr-2"]
                                            }
                                        }
                                    }
                                }
                            }]
                        },
                        {
                            test: /\.svg$/,
                            use: ["@svgr/webpack"]

                        }
                    ]
                }

)

            // Important: return the modified config
            return config
        }
    }
}
