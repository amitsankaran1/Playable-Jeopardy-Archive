document.addEventListener("DOMContentLoaded", () => {
    const clues = document.querySelectorAll("td ul li");

    clues.forEach(clue => {
        // Extract question and answer from dataset
        const question = clue.dataset.question;
        const answer = clue.dataset.answer;
        const isDailyDouble = clue.classList.contains("daily-double");
        const isFinalJeopardy = clue.classList.contains("final-jeopardy-clue");

        // Set initial display: "Click to Reveal" for Final Jeopardy, dollar value for others
        if (isFinalJeopardy) {
            clue.innerHTML = `<span class="value">Click to Reveal</span>`;
        } else {
            clue.innerHTML = `<span class="value">${clue.innerHTML}</span>`;
        }

        // Add click event to show the popup
        clue.addEventListener("click", () => {
            showPopup(clue, isDailyDouble, isFinalJeopardy);
        });
    });
});

// Function to display the popup
function showPopup(clue, isDailyDouble, isFinalJeopardy) {
    // Add a transparent overlay to block interactions
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    document.body.appendChild(overlay);

    let popup = document.createElement("div");
    popup.classList.add("popup");

    let header = "";
    if (isDailyDouble) {
        header = "<h2 class='daily-double-header'>Daily Double!</h2>";
    } else if (isFinalJeopardy) {
        header = "<h2 class='final-jeopardy-header'>Final Jeopardy!</h2>";
    }

    // Create the popup content
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-btn">&times;</span>
            ${header}
            <p><strong>Question:</strong> ${clue.dataset.question}</p>
            <button class="reveal-answer-btn">Reveal Answer</button>
            <p class="hidden-answer" style="display: none;"><strong>Answer:</strong> ${clue.dataset.answer}</p>
        </div>
    `;

    document.body.appendChild(popup);

    // Close button functionality
    popup.querySelector(".close-btn").addEventListener("click", () => {
        closePopup(clue, popup, overlay);
    });

    // Add functionality to reveal the answer
    const revealButton = popup.querySelector(".reveal-answer-btn");
    const answerElement = popup.querySelector(".hidden-answer");
    revealButton.addEventListener("click", () => {
        answerElement.style.display = "block"; // Show the answer
        revealButton.style.display = "none"; // Hide the button
    });

    // Close popup when clicking outside of it
    overlay.addEventListener("click", () => {
        closePopup(clue, popup, overlay);
    });
}

// Function to close the popup and mark the clue as answered
function closePopup(clue, popup, overlay) {
    popup.remove();
    overlay.remove();

    // Mark the clue as answered
    clue.innerHTML = ""; // Clear the clue's content
    clue.classList.add("answered"); // Add the "answered" class for styling
}
