document.addEventListener("DOMContentLoaded", () => {
    const clues = document.querySelectorAll("td ul li");

    clues.forEach(clue => {
        // Extract the value
        const valueText = clue.querySelector("strong:nth-of-type(1)").nextSibling.textContent.trim();
        const value = valueText.replace("Value: ", ""); // Extract the dollar value (e.g., "200")

        // Extract the question and answer
        const question = clue.querySelector("strong:nth-of-type(2)").nextSibling.textContent.trim();
        const answer = clue.querySelector("strong:nth-of-type(3)").nextSibling.textContent.trim();

        // Set initial display to just the dollar value
        clue.innerHTML = `<span class="value">$${value}</span>`;

        // Add click event to reveal question and answer
        clue.addEventListener("click", () => {
            clue.innerHTML = `
                <strong>Question:</strong> ${question}<br>
                <strong>Answer:</strong> ${answer}
            `;
            clue.classList.add("answered"); // Add 'answered' class to indicate the clue has been clicked
        });
    });
});
