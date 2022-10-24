/**
 * Appends a counter inside of paranthesis to an existing text.
 *
 * @param text the text
 * @param counter optional counter
 * @return {string|*} the formatted text
 */
export const appendCounter = (text, counter) => {
    if(text) {
        const counterText = counter > 0 ? ` (${counter})` : '';
        return `${text}${counterText}`;
    }
    return text;
}