import React from "react";
import useViewIntersect from "./useViewIntersect";
import SectionLink from "./SectionLink";

function Section({id, link, title, content, level, intersect = true})
{
    const sectionRef = useViewIntersect();
    if (!intersect)
    {
        return (
            <section
                id={id}
            >
                {
                    React.createElement("h" + level, null, title,
                        link && (<SectionLink link={ link } />)
                    )
                }
                <div
                    dangerouslySetInnerHTML={{
                        __html: content
                    }}
                />
            </section>
        );
    }
    return (
        <section
            ref={sectionRef}
            id={id}
        >
            {
                React.createElement("h" + level, null, title,
                    link && (<SectionLink link={ link } />)
                )
            }
            <div
                dangerouslySetInnerHTML={{
                    __html: content
                }}
            />
        </section>
    );
}


function MarkdownSection({name, markdown})
{
    return (
        <>
        {
            markdown.sections.map(
                (section, idx) => {
                    return (
                        <Section
                            key={section.stub}
                            id={name && idx === 0 ? name : section.stub}
                            link={idx === 0 ? null : `${section.basePath}#${section.stub}`}
                            title={section.title}
                            content={section.content}
                            level={section.level}
                            intersect={idx !== 0}
                        />
                    );
                }
            )
        }
        </>
    );
}

export default MarkdownSection
