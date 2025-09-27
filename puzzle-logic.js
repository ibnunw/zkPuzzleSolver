// Puzzle definitions and logic
class PuzzleManager {
    constructor() {
        this.puzzles = {
            number: {
                title: "Number Sequence Puzzle",
                difficulty: "Easy",
                instruction: "Select the numbers in ascending order",
                data: [5, 2, 8, 1, 9, 3, 7, 4, 6],
                solution: [1, 2, 3, 4, 5, 6, 7, 8, 9],
                type: "number"
            },
            grid: {
                title: "Grid Pattern Puzzle", 
                difficulty: "Medium",
                instruction: "Click cells to recreate the target pattern",
                data: [
                    [0, 1, 0, 1, 0],
                    [1, 0, 1, 0, 1],
                    [0, 1, 0, 1, 0],
                    [1, 0, 1, 0, 1],
                    [0, 1, 0, 1, 0]
                ],
                type: "grid"
            }
        };
        
        this.currentPuzzle = null;
        this.userSolution = null;
        this.startTime = null;
        this.timerInterval = null;
    }

    loadPuzzle(type) {
        this.currentPuzzle = this.puzzles[type];
        this.userSolution = this.currentPuzzle.type === 'number' ? [] : 
                           this.currentPuzzle.type === 'grid' ? this.createGrid(5, 5) : null;
        this.startTimer();
        return this.currentPuzzle;
    }

    createGrid(rows, cols) {
        return Array(rows).fill().map(() => Array(cols).fill(0));
    }

    checkNumberPuzzleSolution(selectedNumbers) {
        return JSON.stringify(selectedNumbers) === JSON.stringify(this.currentPuzzle.solution);
    }

    checkGridPuzzleSolution(userGrid) {
        // For PoC, we'll consider it solved if at least 80% matches
        let correctCells = 0;
        let totalCells = 0;
        
        for (let i = 0; i < userGrid.length; i++) {
            for (let j = 0; j < userGrid[i].length; j++) {
                if (userGrid[i][j] === this.currentPuzzle.data[i][j]) {
                    correctCells++;
                }
                totalCells++;
            }
        }
        
        return (correctCells / totalCells) >= 0.8;
    }

    startTimer() {
        this.startTime = new Date();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        if (!this.startTime) return;
        
        const now = new Date();
        const diff = Math.floor((now - this.startTime) / 1000);
        const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
        const seconds = (diff % 60).toString().padStart(2, '0');
        
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds}`;
        }
    }

    getTimeTaken() {
        if (!this.startTime) return 0;
        return Math.floor((new Date() - this.startTime) / 1000);
    }
}

// Soundness Layer Simulator for Puzzle Proofs
class PuzzleProofGenerator {
    constructor() {
        this.proofs = new Map();
    }

    generateProof(puzzleType, solution, timeTaken) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const proofId = `puzzle_${puzzleType}_${Date.now()}`;
                const proof = {
                    id: proofId,
                    puzzleType: puzzleType,
                    solutionHash: this.hashSolution(solution),
                    timeTaken: timeTaken,
                    timestamp: new Date().toISOString(),
                    signature: this.generateSignature(puzzleType, solution, timeTaken)
                };

                this.proofs.set(proofId, proof);
                resolve(JSON.stringify(proof, null, 2));
            }, 1500);
        });
    }

    verifyProof(proofString) {
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    const proof = JSON.parse(proofString);
                    const storedProof = this.proofs.get(proof.id);
                    
                    if (!storedProof) {
                        resolve({ valid: false, error: "Proof not found or expired" });
                        return;
                    }

                    const isValid = storedProof.signature === proof.signature;
                    resolve({ 
                        valid: isValid, 
                        puzzleType: proof.puzzleType,
                        timeTaken: proof.timeTaken 
                    });
                } catch (error) {
                    resolve({ valid: false, error: "Invalid proof format" });
                }
            }, 1000);
        });
    }

    hashSolution(solution) {
        // Simple hash function for demonstration
        const solutionString = JSON.stringify(solution);
        let hash = 0;
        for (let i = 0; i < solutionString.length; i++) {
            const char = solutionString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    generateSignature(puzzleType, solution, timeTaken) {
        const data = `${puzzleType}_${JSON.stringify(solution)}_${timeTaken}`;
        return btoa(data).slice(0, 20) + Date.now().toString(36);
    }
}

// Initialize global instances
const puzzleManager = new PuzzleManager();
const proofGenerator = new PuzzleProofGenerator();
