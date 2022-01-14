import userEvent from "@testing-library/user-event";

export default function clearAndType(input, text, delay)
{
    input.setSelectionRange(0, input.value.length)
    return userEvent.type(input, text, delay);
}
