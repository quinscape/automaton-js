import useViewIntersect from "./useViewIntersect";

function Section({id, children})
{
    const sectionRef = useViewIntersect();
    return (
        <section
            ref={sectionRef}
            id={id}
        >
            {
                children
            }
        </section>
    );
}

function MarkdownDiv({name, markdown})
{
    return (
        <>
        {
            markdown.sections.map(
                (section, idx) => (
                    <Section
                        key={section.stub}
                        id={name && idx === 0 ? name : section.stub}
                        dangerouslySetInnerHTML={{
                            __html: section.content
                        }}
                    />
                )
            )
        }
        </>
    );
}

export default MarkdownDiv
