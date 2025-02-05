const GAME_STATES = {
    PLAYER_SELECTION: 'player_selection',
    JEOPARDY: 'jeopardy',
    DOUBLE_JEOPARDY: 'double_jeopardy',
    FINAL_JEOPARDY: 'final_jeopardy'
};

let players = [];
let currentValue = 0;
let currentState = GAME_STATES.PLAYER_SELECTION;

document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM Content Loaded');
    initializeGame();
    
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

function initializeGame() {
    console.log('Initializing game...');
    
    // Hide all rounds initially
    document.querySelectorAll('.round').forEach(round => {
        round.style.display = 'none';
    });
    
    // Show only player selection initially
    const playerSection = document.querySelector('.score-container');
    console.log('Player section found:', playerSection);
    playerSection.style.display = 'block';
    
    // Create and append the Start Game button
    const startButton = document.createElement('button');
    startButton.id = 'start-game-btn';
    startButton.textContent = 'Start Game';
    startButton.style.display = 'none';  // Hidden until at least one player added
    startButton.className = 'start-game-btn'; // Add a class for styling
    playerSection.appendChild(startButton);
    console.log('Start button created:', startButton);
    
    startButton.addEventListener('click', () => {
        if (players.length > 0) {
            transitionToState(GAME_STATES.JEOPARDY);
        } else {
            alert('Please add at least one player to start the game.');
        }
    });
}

function addPlayer(name) {
    const player = {
        name: name,
        score: 0,
        id: Date.now()
    };
    players.push(player);
    updatePlayersDisplay();
    
    // Show start button once we have at least one player
    const startButton = document.getElementById('start-game-btn');
    if (startButton) {
        startButton.style.display = 'block';
    }
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
        
        const playerCard = document.querySelector(`[data-player-id="${playerId}"] .player-score`);
        playerCard.classList.add(isCorrect ? 'score-change-positive' : 'score-change-negative');
        
        setTimeout(() => {
            playerCard.classList.remove('score-change-positive', 'score-change-negative');
        }, 500);
        
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
        clue.classList.add('revealed');
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

    if (isDailyDouble) {
        const wagerInput = popup.querySelector("#wager-input");
        const confirmWagerBtn = popup.querySelector("#confirm-wager-btn");
        const questionSection = popup.querySelector(".question-section");
        const wagerSection = popup.querySelector(".wager-section");

        confirmWagerBtn.addEventListener("click", () => {
            const wager = parseInt(wagerInput.value);
            const maxWager = getMaximumWager();

            if (wager >= 0 && wager <= maxWager) {
                currentValue = wager;
                wagerSection.style.display = "none";
                questionSection.style.display = "block";
            } else {
                alert(`Please enter a valid wager between $0 and $${maxWager}`);
            }
        });
    }

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
            closePopup(clue, popup, overlay);
        });
    });

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

function transitionToState(newState) {
    console.log('Transitioning to state:', newState);
    currentState = newState;
    
    // Hide all sections first
    document.querySelectorAll('.round').forEach(round => {
        round.style.display = 'none';
    });
    
    const scoreContainer = document.querySelector('.score-container');
    if (scoreContainer) {
        scoreContainer.style.display = 'block';
    }
    
    switch (newState) {
        case GAME_STATES.PLAYER_SELECTION:
            // Already showing score container
            break;
            
        case GAME_STATES.JEOPARDY:
            const jeopardyRound = document.querySelector('[data-round="jeopardy"]');
            if (jeopardyRound) {
                jeopardyRound.style.display = 'block';
                addNextRoundButton('Continue to Double Jeopardy', GAME_STATES.DOUBLE_JEOPARDY);
            } else {
                console.error('Jeopardy round element not found');
            }
            break;
            
        case GAME_STATES.DOUBLE_JEOPARDY:
            const doubleJeopardyRound = document.querySelector('[data-round="double_jeopardy"]');
            if (doubleJeopardyRound) {
                doubleJeopardyRound.style.display = 'block';
                addNextRoundButton('Continue to Final Jeopardy', GAME_STATES.FINAL_JEOPARDY);
            } else {
                console.error('Double Jeopardy round element not found');
            }
            break;
            
        case GAME_STATES.FINAL_JEOPARDY:
            const finalJeopardyRound = document.querySelector('[data-round="final_jeopardy"]');
            if (finalJeopardyRound) {
                finalJeopardyRound.style.display = 'block';
            } else {
                console.error('Final Jeopardy round element not found');
            }
            break;
    }
}

function addNextRoundButton(text, nextState) {
    const existingButton = document.querySelector('.next-round-btn');
    if (existingButton) {
        existingButton.remove();
    }
    
    const button = document.createElement('button');
    button.className = 'next-round-btn';
    button.textContent = text;
    button.addEventListener('click', () => transitionToState(nextState));
    document.querySelector('.score-container').appendChild(button);
}
