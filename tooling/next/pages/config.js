import Layout from "../components/Layout";
import cx from "classnames";
import { getPageDefaults } from "../service/docs";
import TOCLink from "../components/TOCLink";
import { useState } from "react";
import MarkdownPage from "../components/MarkdownPage";

const Category = ({title, docs, names : namesFromProps, search}) => {

    const names = search ?
        namesFromProps.filter(name => name.toLocaleLowerCase().indexOf(search.toLocaleLowerCase()) >= 0) :
        namesFromProps;


    return (
        <>
            <h3>
                {
                    title
                }
            </h3>
            {
                !names.length && "---"
            }
            {
                names.map(name => <TOCLink key={name} doc={docs.docs[name]}/>)
            }
        </>
    )
};

function ConfigPage(props)
{
    return (
        <Layout {...props}>
            <MarkdownPage docs={ props.docs } path="config.md"/>
        </Layout>
    )
}

export default ConfigPage


export async function getStaticProps(context)
{
    return getPageDefaults({
        title: "Automaton-Js Static Configuration"
    })
}

