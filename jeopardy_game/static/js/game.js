let players = [];
let currentValue = 0;

document.addEventListener("DOMContentLoaded", () => {
    // Add player management
    const addPlayerBtn = document.getElementById("add-player-btn");
    const playerNameInput = document.getElementById("player-name-input");
    
    addPlayerBtn.addEventListener("click", () => {
        if (playerNameInput.style.display === "none") {
            playerNameInput.style.display = "inline";
            addPlayerBtn.textContent = "Confirm";
        } else {
            const playerName = playerNameInput.value.trim();
            if (playerName) {
                addPlayer(playerName);
                playerNameInput.value = "";
                playerNameInput.style.display = "none";
                addPlayerBtn.textContent = "Add Player";
            }
        }
    });

    const clues = document.querySelectorAll("td ul li");

    clues.forEach(clue => {
        const question = clue.dataset.question;
        const answer = clue.dataset.answer;
        const isDailyDouble = clue.classList.contains("daily-double");
        const isFinalJeopardy = clue.classList.contains("final-jeopardy-clue");

        if (isFinalJeopardy) {
            clue.innerHTML = `<span class="value">Click to Reveal</span>`;
        } else {
            clue.innerHTML = `<span class="value">${clue.innerHTML}</span>`;
        }

        clue.addEventListener("click", () => {
            showPopup(clue, isDailyDouble, isFinalJeopardy);
        });
    });
});

function addPlayer(name) {
    const player = {
        name: name,
        score: 0,
        id: Date.now()
    };
    players.push(player);
    updatePlayersDisplay();
}

function updatePlayersDisplay() {
    const playersList = document.getElementById("players-list");
    playersList.innerHTML = players.map(player => `
        <div class="player-card" data-player-id="${player.id}">
            <div class="player-name">${player.name}</div>
            <div class="player-score">$${player.score}</div>
        </div>
    `).join("");
}

function updateScore(playerId, isCorrect) {
    const player = players.find(p => p.id === playerId);
    if (player) {
        player.score += isCorrect ? currentValue : -currentValue;
        updatePlayersDisplay();
    }
}

function getMaximumWager() {
    const highestScore = players.length > 0 
        ? Math.max(...players.map(p => p.score))
        : 0;

    const isDoubleJeopardy = document.querySelector('h2').textContent.includes('Double');
    const maxClueValue = isDoubleJeopardy ? 2000 : 1000;

    return Math.max(highestScore, maxClueValue);
}

function showPopup(clue, isDailyDouble, isFinalJeopardy) {
    currentValue = parseInt(clue.querySelector('.value').textContent.replace('$', ''));

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    document.body.appendChild(overlay);

    let popup = document.createElement("div");
    popup.classList.add("popup");

    let header = "";
    if (isDailyDouble) {
        header = `
            <h2 class='daily-double-header'>Daily Double!</h2>
            <div class="wager-section">
                <p>Current maximum wager: $${getMaximumWager()}</p>
                <input type="number" id="wager-input" min="0" max="${getMaximumWager()}" placeholder="Enter wager">
                <button id="confirm-wager-btn">Confirm Wager</button>
            </div>
        `;
    } else if (isFinalJeopardy) {
        header = "<h2 class='final-jeopardy-header'>Final Jeopardy!</h2>";
    }

    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-btn">&times;</span>
            ${header}
            <div class="question-section" style="${isDailyDouble ? 'display: none;' : ''}">
                <p><strong>Question:</strong> ${clue.dataset.question}</p>
                <button class="reveal-answer-btn">Reveal Answer</button>
                <p class="hidden-answer" style="display: none;"><strong>Answer:</strong> ${clue.dataset.answer}</p>
                <div class="popup-controls" style="display: none;">
                    ${players.map(player => `
                        <div class="player-scoring">
                            <div>${player.name}</div>
                            <button class="score-button correct-btn" data-player-id="${player.id}" data-correct="true">Correct</button>
                            <button class="score-button wrong-btn" data-player-id="${player.id}" data-correct="false">Wrong</button>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(popup);

    popup.querySelector(".close-btn").addEventListener("click", () => {
        closePopup(clue, popup, overlay);
    });

    const revealButton = popup.querySelector(".reveal-answer-btn");
    const answerElement = popup.querySelector(".hidden-answer");
    const popupControls = popup.querySelector(".popup-controls");
    
    revealButton.addEventListener("click", () => {
        answerElement.style.display = "block";
        revealButton.style.display = "none";
        popupControls.style.display = "block";
    });

    popup.querySelectorAll('.score-button').forEach(button => {
        button.addEventListener('click', () => {
            const playerId = parseInt(button.dataset.playerId);
            const isCorrect = button.dataset.correct === "true";
            updateScore(playerId, isCorrect);
        });
    });

    if (isDailyDouble) {
        const wagerInput = popup.querySelector("#wager-input");
        const confirmWagerBtn = popup.querySelector("#confirm-wager-btn");
        const questionSection = popup.querySelector(".question-section");

        confirmWagerBtn.addEventListener("click", () => {
            const wager = parseInt(wagerInput.value);
            const maxWager = getMaximumWager();

            if (wager >= 0 && wager <= maxWager) {
                currentValue = wager;
                popup.querySelector(".wager-section").style.display = "none";
                questionSection.style.display = "block";
            } else {
                alert(`Please enter a valid wager between $0 and $${maxWager}`);
            }
        });
    }

    overlay.addEventListener("click", () => {
        closePopup(clue, popup, overlay);
    });
}

function closePopup(clue, popup, overlay) {
    popup.remove();
    overlay.remove();
    clue.innerHTML = "";
    clue.classList.add("answered");
}
