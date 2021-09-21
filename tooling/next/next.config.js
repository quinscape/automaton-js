const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

module.exports = (phase, { defaultConfig }) => {
    return {
        basePath: "/automaton-js",
        assetPrefix: '/automaton-js/',
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

                        },
                        {
                            test: /\.(jpe?g|gif|png|svg)$/i,
                            use: [
                                {
                                    loader: 'url-loader',
                                    options: {
                                        limit: 10000
                                    }
                                }
                            ]
                        }
                    ]
                }

)

            // Important: return the modified config
            return config
        }
    }
}
