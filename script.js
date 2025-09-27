// DOM Elements
let currentPuzzle = null;
let selectedNumbers = [];

// Puzzle Selection
function selectPuzzle(type) {
    currentPuzzle = puzzleManager.loadPuzzle(type);
    
    // Update UI
    document.getElementById('puzzleTitle').textContent = currentPuzzle.title;
    document.getElementById('difficulty').textContent = currentPuzzle.difficulty;
    document.getElementById('puzzleContainer').classList.remove('hidden');
    document.getElementById('proofSection').classList.add('hidden');
    
    // Load puzzle content
    loadPuzzleContent(type);
}

function loadPuzzleContent(type) {
    const contentElement = document.getElementById('puzzleContent');
    
    if (type === 'number') {
        contentElement.innerHTML = `
            <div class="number-puzzle">
                <div class="puzzle-instruction">${currentPuzzle.instruction}</div>
                <div class="number-grid" id="numberGrid"></div>
                <div class="selected-numbers">
                    <strong>Selected:</strong> <span id="selectedList"></span>
                </div>
            </div>
        `;
        loadNumberPuzzle();
    } else if (type === 'grid') {
        contentElement.innerHTML = `
            <div class="grid-puzzle">
                <div class="puzzle-instruction">${currentPuzzle.instruction}</div>
                <div class="grid-container" id="gridContainer"></div>
                <div class="pattern-hint">Target: Checkerboard Pattern</div>
            </div>
        `;
        loadGridPuzzle();
    }
}

function loadNumberPuzzle() {
    const gridElement = document.getElementById('numberGrid');
    gridElement.innerHTML = '';
    
    currentPuzzle.data.forEach((number, index) => {
        const cell = document.createElement('div');
        cell.className = 'number-cell';
        cell.textContent = number;
        cell.onclick = () => selectNumber(number, cell);
        gridElement.appendChild(cell);
    });
    
    selectedNumbers = [];
    updateSelectedList();
}

function selectNumber(number, cell) {
    if (selectedNumbers.includes(number)) {
        // Deselect if already selected
        selectedNumbers = selectedNumbers.filter(n => n !== number);
        cell.classList.remove('selected');
    } else {
        // Select number
        selectedNumbers.push(number);
        cell.classList.add('selected');
    }
    updateSelectedList();
    checkPuzzleReady();
}

function updateSelectedList() {
    const selectedList = document.getElementById('selectedList');
    if (selectedList) {
        selectedList.textContent = selectedNumbers.join(', ') || 'None';
    }
}

function loadGridPuzzle() {
    const container = document.getElementById('gridContainer');
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(5, 50px)`;
    
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.onclick = () => toggleGridCell(i, j, cell);
            container.appendChild(cell);
        }
    }
}

function toggleGridCell(row, col, cell) {
    puzzleManager.userSolution[row][col] = puzzleManager.userSolution[row][col] === 1 ? 0 : 1;
    cell.classList.toggle('active');
    checkPuzzleReady();
}

// Puzzle Controls
function checkSolution() {
    let isSolved = false;
    
    if (currentPuzzle.type === 'number') {
        isSolved = puzzleManager.checkNumberPuzzleSolution(selectedNumbers);
        
        // Visual feedback
        if (isSolved) {
            document.querySelectorAll('.number-cell').forEach(cell => {
                cell.classList.add('correct');
            });
        }
    } else if (currentPuzzle.type === 'grid') {
        isSolved = puzzleManager.checkGridPuzzleSolution(puzzleManager.userSolution);
    }
    
    if (isSolved) {
        showStatus('Puzzle solved! You can now generate a proof.', 'success');
        document.getElementById('proofBtn').disabled = false;
        puzzleManager.stopTimer();
    } else {
        showStatus('Not quite right. Keep trying!', 'error');
    }
    
    return isSolved;
}

function checkPuzzleReady() {
    // Enable check button based on puzzle progress
    const checkBtn = document.getElementById('checkBtn');
    if (currentPuzzle.type === 'number') {
        checkBtn.disabled = selectedNumbers.length !== currentPuzzle.data.length;
    }
    // For grid puzzle, always enabled
}

async function generateProof() {
    if (!checkSolution()) {
        showStatus('Please solve the puzzle correctly first.', 'error');
        return;
    }
    
    showStatus('Generating zero-knowledge proof...', 'loading');
    document.getElementById('proofBtn').disabled = true;
    
    try {
        const solutionData = currentPuzzle.type === 'number' ? selectedNumbers : puzzleManager.userSolution;
        const timeTaken = puzzleManager.getTimeTaken();
        
        const proof = await proofGenerator.generateProof(
            currentPuzzle.type, 
            solutionData, 
            timeTaken
        );
        
        document.getElementById('proofOutput').value = proof;
        document.getElementById('proofSection').classList.remove('hidden');
        showStatus('Proof generated successfully!', 'success');
    } catch (error) {
        showStatus('Error generating proof: ' + error.message, 'error');
        document.getElementById('proofBtn').disabled = false;
    }
}

async function verifyProof() {
    const proofOutput = document.getElementById('proofOutput');
    if (!proofOutput.value) {
        showStatus('No proof to verify.', 'error');
        return;
    }
    
    showStatus('Verifying proof...', 'loading');
    
    try {
        const result = await proofGenerator.verifyProof(proofOutput.value);
        
        if (result.valid) {
            showStatus(`✓ Proof verified! Puzzle: ${result.puzzleType}, Time: ${result.timeTaken}s`, 'success');
        } else {
            showStatus('✗ Proof verification failed: ' + result.error, 'error');
        }
    } catch (error) {
        showStatus('Error verifying proof: ' + error.message, 'error');
    }
}

function resetPuzzle() {
    selectedNumbers = [];
    puzzleManager.stopTimer();
    selectPuzzle(currentPuzzle.type);
    document.getElementById('proofSection').classList.add('hidden');
    document.getElementById('proofBtn').disabled = true;
    showStatus('Puzzle reset.', 'success');
}

function copyProof() {
    const proofOutput = document.getElementById('proofOutput');
    proofOutput.select();
    document.execCommand('copy');
    showStatus('Proof copied to clipboard!', 'success');
}

function shareProof() {
    const proof = document.getElementById('proofOutput').value;
    if (!proof) {
        showStatus('No proof to share.', 'error');
        return;
    }
    
    // Simulate sharing functionality
    const shareData = {
        title: 'zkPuzzleSolver Challenge',
        text: `I solved a ${currentPuzzle.difficulty.toLowerCase()} puzzle in ${puzzleManager.getTimeTaken()}s! Can you verify my proof?`,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        // Fallback: copy to clipboard
        copyProof();
        showStatus('Proof copied! Share it with friends.', 'success');
    }
}

function showStatus(message, type) {
    const statusElement = document.getElementById('proofStatus');
    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            statusElement.textContent = '';
            statusElement.className = 'status';
        }, 5000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('zkPuzzleSolver PoC loaded successfully!');
});
