/**
 * Ad-hoc hack to trigger an immediate submit in a form that has autoSubmit enabled.
 *
 * Used by widgets that do not change via a normal input change handler until we decide how to deal with this and
 * other issues.
 */
export default function autoSubmitHack(formConfig)
{
    // XXX: Hack to ensure autosubmit on date change
    if (formConfig.options.autoSubmit)
    {
        // selection is so slow we can submit every time
        formConfig.ctx.submit();
    }
}
