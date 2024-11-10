const state = {
    width: 15,
    height: 15,
    maze: [],
    player1: { x: 1, y: 1 },
    player2: { x: 13, y: 1 },
    goal: { x: 7, y: 7 },
    moveInterval1: null,
    moveInterval2: null,
    goalMoveInterval: null,
    moveSpeed: 100,
    goalSpeed: 200,
    keysPressed: new Set(),
    score1: 0,
    score2: 0,
    startTime: Date.now(),
    timerInterval: null,
    nextResetTime: Date.now() + 60000
}

const initMaze = () => {
    state.maze = Array(state.height).fill().map(() => Array(state.width).fill(1))
}

const generateMaze = () => {
    const stack = [{x: 1, y: 1}]
    state.maze[1][1] = 0

    while (stack.length > 0) {
        const current = stack[stack.length - 1]
        const neighbors = []
        const directions = [[0, -2], [2, 0], [0, 2], [-2, 0]]

        for (let [dx, dy] of directions) {
            const newX = current.x + dx
            const newY = current.y + dy
            if (newX > 0 && newX < state.width - 1 && 
                newY > 0 && newY < state.height - 1 && 
                state.maze[newY][newX] === 1) {
                neighbors.push({x: newX, y: newY, dx, dy})
            }
        }

        if (neighbors.length === 0) {
            stack.pop()
        } else {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)]
            state.maze[next.y][next.x] = 0
            state.maze[current.y + next.dy/2][current.x + next.dx/2] = 0
            stack.push({x: next.x, y: next.y})
        }
    }

    // Open center area
    for (let y = 6; y < 9; y++) {
        for (let x = 6; x < 9; x++) {
            state.maze[y][x] = 0
        }
    }
}

const moveGoal = () => {
    const moves = []
    const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]]

    for (let [dx, dy] of directions) {
        const newX = state.goal.x + dx
        const newY = state.goal.y + dy
        if (newX >= 0 && newX < state.width && 
            newY >= 0 && newY < state.height && 
            state.maze[newY][newX] === 0) {
            const dist1 = Math.abs(newX - state.player1.x) + Math.abs(newY - state.player1.y)
            const dist2 = Math.abs(newX - state.player2.x) + Math.abs(newY - state.player2.y)
            moves.push({x: newX, y: newY, minDist: Math.min(dist1, dist2)})
        }
    }

    if (moves.length === 0) return

    if (Math.random() < 0.7) {
        // Move away from closest player
        moves.sort((a, b) => b.minDist - a.minDist)
        const bestMoves = moves.filter(m => m.minDist === moves[0].minDist)
        const move = bestMoves[Math.floor(Math.random() * bestMoves.length)]
        state.goal.x = move.x
        state.goal.y = move.y
    } else {
        // Random move
        const move = moves[Math.floor(Math.random() * moves.length)]
        state.goal.x = move.x
        state.goal.y = move.y
    }
}

const spawnGoal = () => {
    const centerX = Math.floor(state.width / 2)
    const centerY = Math.floor(state.height / 2)
    const validSpots = []

    for (let y = centerY - 2; y <= centerY + 2; y++) {
        for (let x = centerX - 2; x <= centerX + 2; x++) {
            if (state.maze[y][x] === 0) {
                validSpots.push({x, y})
            }
        }
    }

    if (validSpots.length > 0) {
        const spot = validSpots[Math.floor(Math.random() * validSpots.length)]
        state.goal.x = spot.x
        state.goal.y = spot.y
    }
}

const render = () => {
    const mazeElement = document.getElementById('maze')
    mazeElement.innerHTML = ''

    for (let y = 0; y < state.height; y++) {
        const row = document.createElement('div')
        row.className = 'maze-row'

        for (let x = 0; x < state.width; x++) {
            const cell = document.createElement('div')
            cell.className = 'cell'
            if (state.maze[y][x] === 1) cell.classList.add('wall')
            if (x === state.player1.x && y === state.player1.y) cell.classList.add('player1')
            if (x === state.player2.x && y === state.player2.y) cell.classList.add('player2')
            if (x === state.goal.x && y === state.goal.y) cell.classList.add('goal')
            row.appendChild(cell)
        }

        mazeElement.appendChild(row)
    }

    document.getElementById('score1').textContent = `P1 Score: ${state.score1}`
    document.getElementById('score2').textContent = `P2 Score: ${state.score2}`
}

const updateTimer = () => {
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    document.getElementById('timer').textContent = 
        `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`
}

const updateCountdown = () => {
    const remaining = Math.ceil((state.nextResetTime - Date.now()) / 1000)
    document.getElementById('countdown').textContent = `Next maze in: ${remaining}s`
    document.getElementById('countdown').classList.toggle('countdown', remaining <= 10)
}

const regenerateMaze = () => {
    const mazeElement = document.getElementById('maze')
    mazeElement.style.opacity = '0'

    setTimeout(() => {
        initMaze()
        generateMaze()
        spawnGoal()
        mazeElement.style.opacity = '1'
        render()
    }, 300)
}

const movePlayer = (playerNum, dx, dy) => {
    const player = playerNum === 1 ? state.player1 : state.player2
    const newX = player.x + dx
    const newY = player.y + dy

    if (newX >= 0 && newX < state.width && 
        newY >= 0 && newY < state.height && 
        state.maze[newY][newX] === 0) {
        player.x = newX
        player.y = newY

        if (player.x === state.goal.x && player.y === state.goal.y) {
            if (playerNum === 1) state.score1++
            else state.score2++
            state.goalSpeed = Math.max(100, state.goalSpeed - 10)
            regenerateMaze()
        }
        render()
    }
}

const startMovement = (playerNum, dx, dy) => {
    const intervalKey = `moveInterval${playerNum}`
    if (state[intervalKey]) clearInterval(state[intervalKey])
    movePlayer(playerNum, dx, dy)
    state[intervalKey] = setInterval(() => movePlayer(playerNum, dx, dy), state.moveSpeed)
}

const stopMovement = (playerNum) => {
    const intervalKey = `moveInterval${playerNum}`
    if (state[intervalKey]) {
        clearInterval(state[intervalKey])
        state[intervalKey] = null
    }
}

const startGame = () => {
    state.goalMoveInterval = setInterval(() => {
        moveGoal()
        render()
    }, state.goalSpeed)

    state.timerInterval = setInterval(() => {
        updateTimer()
        updateCountdown()
        if (Date.now() >= state.nextResetTime) {
            state.nextResetTime = Date.now() + 60000
            regenerateMaze()
        }
    }, 1000)
}

const reset = () => {
    clearInterval(state.moveInterval1)
    clearInterval(state.moveInterval2)
    clearInterval(state.goalMoveInterval)
    clearInterval(state.timerInterval)

    state.player1 = { x: 1, y: 1 }
    state.player2 = { x: 13, y: 1 }
    state.score1 = 0
    state.score2 = 0
    state.goalSpeed = 200
    state.keysPressed.clear()
    state.startTime = Date.now()
    state.nextResetTime = Date.now() + 60000

    regenerateMaze()
    startGame()
}

document.addEventListener('keydown', (e) => {
    if (state.keysPressed.has(e.key)) return
    state.keysPressed.add(e.key)

    switch (e.key.toLowerCase()) {
        case 'arrowup': startMovement(1, 0, -1); break
        case 'arrowdown': startMovement(1, 0, 1); break
        case 'arrowleft': startMovement(1, -1, 0); break
        case 'arrowright': startMovement(1, 1, 0); break
        case 'w': startMovement(2, 0, -1); break
        case 's': startMovement(2, 0, 1); break
        case 'a': startMovement(2, -1, 0); break
        case 'd': startMovement(2, 1, 0); break
        case ' ': reset(); break
    }
})

document.addEventListener('keyup', (e) => {
    state.keysPressed.delete(e.key)
    const key = e.key.toLowerCase()
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) stopMovement(1)
    if (['w', 'a', 's', 'd'].includes(key)) stopMovement(2)
})

// Start game
initMaze()
generateMaze()
spawnGoal()
render()
startGame()