document.addEventListener("DOMContentLoaded", () => {
    const clues = document.querySelectorAll("td ul li");

    clues.forEach(clue => {
        // Extract the value, question, and answer
        const valueText = clue.querySelector("strong:nth-of-type(1)").nextSibling.textContent.trim();
        const value = valueText.replace("Value: ", ""); // Extract dollar value
        const question = clue.querySelector("strong:nth-of-type(2)").nextSibling.textContent.trim();
        const answer = clue.querySelector("strong:nth-of-type(3)").nextSibling.textContent.trim();

        // Store the original value in a dataset for later reference
        clue.dataset.question = question;
        clue.dataset.answer = answer;

        // Set initial display to just the dollar value
        clue.innerHTML = `<span class="value">${value}</span>`;

        // Add click event to show the popup
        clue.addEventListener("click", () => {
            showPopup(clue);
        });
    });
});

// Function to display the pop-up
function showPopup(clue) {
    let popup = document.createElement("div");
    popup.classList.add("popup");
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-btn">&times;</span>
            <p><strong>Question:</strong> ${clue.dataset.question}</p>
            <p><strong>Answer:</strong> ${clue.dataset.answer}</p>
        </div>
    `;

    document.body.appendChild(popup);

    // Close button functionality
    popup.querySelector(".close-btn").addEventListener("click", () => {
        popup.remove();
        markClueAnswered(clue);
    });
}

// Function to blank out the clue after it has been viewed
function markClueAnswered(clue) {
    clue.innerHTML = "";
    clue.classList.add("answered");
}
