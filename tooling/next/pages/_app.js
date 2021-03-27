import Head from "next/head";
import { useRouter } from "next/router";

const UNTITLED = "Untitled";

import CSS from "./style.css"


export default function MyApp({Component, pageProps}) {

    const router = useRouter();

    const { title = UNTITLED } = pageProps;


    if (title === UNTITLED)
    {
        console.warn("Untitled page: ", router.basePath );
    }

    return (
        <>
            <Head>
                <meta charSet="utf-8"/>
                <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>

                <title>
                    Automaton-Js Documentation - { title }
                </title>


                <link rel="stylesheet" type="text/css" href={ router.basePath + "/css/fontawesome.min.css" }/>
                <link rel="stylesheet" type="text/css" href={ router.basePath + "/css/brands.min.css" }/>
                <link rel="stylesheet" type="text/css" href={ router.basePath + "/css/solid.min.css" }/>
                <link rel="stylesheet" type="text/css" href={ router.basePath + "/css/bootstrap-automaton-condensed.min.css" }/>
            </Head>

            <Component {...pageProps} />
        </>
    )
}
