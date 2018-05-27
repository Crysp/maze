const stack = [];
const visited = [];

const direction = {
    top: 0x1000,
    right: 0x0100,
    bottom: 0x0010,
    left: 0x0001
};
const Key = {
    UP: 38,
    RIGHT: 39,
    BOTTOM: 40,
    LEFT: 37
};
const arrowKeys = [Key.UP, Key.RIGHT, Key.BOTTOM, Key.LEFT];

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getDoors(cell) {
    const doors = [];
    if (Boolean(cell.walls & direction.top)) doors.push('top');
    if (Boolean(cell.walls & direction.right)) doors.push('right');
    if (Boolean(cell.walls & direction.bottom)) doors.push('bottom');
    if (Boolean(cell.walls & direction.left)) doors.push('left');
    return doors;
}
class Cell {
    constructor({ x, y }) {
        this.x = x;
        this.y = y;
        this.walls = 0x1111;
        return this;
    }
}
class Board {
    constructor({ width, height }) {
        this.reset({ width, height });
    }
    reset({ width, height }) {
        this.width = width;
        this.height = height;
        this.generate();
    }
    generate() {
        this.cells = [];
        for (let i = 0, size = this.width * this.height; i < size; i++) {
            const [x, y] = this.getXY(i);
            const cell = new Cell({ x, y });
            this.cells.push(cell);
        }
        this.userCell = this.cells[0];

        stack.push(this.cells[0]);
        visited.push(this.cells[0]);

        while (stack.length > 0) {
            const cell = stack[stack.length - 1];
            const nb = this.getNeighbours(cell);
            if (nb.length > 0) {
                const selected = nb[getRandomInt(0, nb.length - 1)];
                stack.push(selected.cell);
                visited.push(selected.cell);
                cell.walls ^= selected.direction;
                selected.cell.walls ^= selected.neighbourDirection;
            } else {
                stack.pop();
            }
        }
    }
    getXY(cellIndex) {
        const x = cellIndex % this.width;
        const y = Math.floor(cellIndex / this.width);
        return [x, y];
    }
    getCell(cellIndex) {
        const [x, y] = this.getXY(cellIndex);
        return this.cells.find(cell => cell.x === x && cell.y === y);
    }
    getNeighbours(cell) {
        const { x, y } = cell;
        const nb = [];
        if (y > 0) {
            nb.push({
                cell: this.getCell((y - 1) * this.width + x),
                direction: direction.top,
                neighbourDirection: direction.bottom
            });
        }
        if (x < (this.width - 1)) {
            nb.push({
                cell: this.getCell(y * this.width + x + 1),
                direction: direction.right,
                neighbourDirection: direction.left
            });
        }
        if (y < (this.height - 1)) {
            nb.push({
                cell: this.getCell((y + 1) * this.width + x),
                direction: direction.bottom,
                neighbourDirection: direction.top
            });
        }
        if (x > 0) {
            nb.push({
                cell: this.getCell(y * this.width + x - 1),
                direction: direction.left,
                neighbourDirection: direction.right,
            });
        }
        return nb.filter(n => !visited.includes(n.cell));
    }
    moveUp() {
        if (!Boolean(this.userCell.walls & direction.top)) {
            this.userCell = this.getCell((this.userCell.y - 1) * this.width + this.userCell.x);
        }
    }
    moveRight() {
        if (!Boolean(this.userCell.walls & direction.right)) {
            this.userCell = this.getCell(this.userCell.y * this.width + this.userCell.x + 1);
        }
    }
    moveBottom() {
        if (!Boolean(this.userCell.walls & direction.bottom)) {
            this.userCell = this.getCell((this.userCell.y + 1) * this.width + this.userCell.x);
        }
    }
    moveLeft() {
        if (!Boolean(this.userCell.walls & direction.left)) {
            this.userCell = this.getCell(this.userCell.y * this.width + this.userCell.x - 1);
        }
    }
}

const padding = 20;

class Layer {
    constructor(context, x, y, width, height) {
        this.context = context;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    set fillStyle(fillStyle) {
        this.context.fillStyle = fillStyle;
    }
    beginPath() {
        this.context.beginPath();
    }
    stroke() {
        this.context.stroke();
    }
    fill() {
        this.context.fill();
    }
    moveTo(x, y) {
        this.context.moveTo(x + this.x, y + this.y);
    }
    lineTo(x, y) {
        this.context.lineTo(x + this.x, y + this.y);
    }
    fillRect(x, y, width, height) {
        this.context.fillRect(x + this.x, y + this.y, width, height);
    }
    arc(x, y, r, sAngle, eAngle, counterclockwise) {
        this.context.arc(x + this.x, y + this.y, r, sAngle, eAngle, counterclockwise);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const board = new Board({
        width: parseInt(document.getElementById('columns').value, 10),
        height: parseInt(document.getElementById('rows').value, 10),
    });
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    const mazeLayer = new Layer(ctx, padding, padding, canvas.width - padding, canvas.height - padding);
    let cellSide = (canvas.clientWidth - 2 * padding) / board.width;

    function drawPlayer(x, y) {
        mazeLayer.beginPath();
        mazeLayer.fillStyle = 'red';
        mazeLayer.arc(x * cellSide + cellSide / 2, y * cellSide + cellSide / 2, cellSide / 6, 0, 2*Math.PI);
        mazeLayer.fill();
        mazeLayer.stroke();
    }

    function drawMaze() {
        const start = board.getCell(0);
        let finish = board.getCell(board.cells.length - 1);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        mazeLayer.fillStyle = 'cyan';
        mazeLayer.fillRect(start.x, start.y, cellSide, cellSide);
        mazeLayer.fillStyle = 'yellow';
        mazeLayer.fillRect(finish.x * cellSide, finish.y * cellSide, cellSide, cellSide);
        mazeLayer.beginPath();
        board.cells.forEach(cell => {
            const x = cell.x * cellSide;
            const y = cell.y * cellSide;
            if (Boolean(cell.walls & direction.top)) {
                mazeLayer.moveTo(x, y);
                mazeLayer.lineTo(x + cellSide, y);
            }
            if (Boolean(cell.walls & direction.right)) {
                mazeLayer.moveTo(x + cellSide, y);
                mazeLayer.lineTo(x + cellSide, y + cellSide);
            }
            if (Boolean(cell.walls & direction.bottom)) {
                mazeLayer.moveTo(x, y + cellSide);
                mazeLayer.lineTo(x + cellSide, y + cellSide);
            }
            if (Boolean(cell.walls & direction.left)) {
                mazeLayer.moveTo(x, y);
                mazeLayer.lineTo(x, y + cellSide);
            }
        });
        mazeLayer.stroke();
    }

    drawMaze();
    drawPlayer(board.userCell.x, board.userCell.y);

    document.addEventListener('keydown', e => {
        if (arrowKeys.includes(e.keyCode)) {
            switch (e.keyCode) {
                case Key.UP:
                    board.moveUp();
                    break;
                case Key.RIGHT:
                    board.moveRight();
                    break;
                case Key.BOTTOM:
                    board.moveBottom();
                    break;
                case Key.LEFT:
                    board.moveLeft();
                    break;
            }
            drawMaze();
            drawPlayer(board.userCell.x, board.userCell.y);
        }
    });

    document.querySelector('[data-js="generate"]').addEventListener('click', e => {
        e.preventDefault();
        board.reset({
            width: parseInt(document.getElementById('columns').value, 10),
            height: parseInt(document.getElementById('rows').value, 10),
        });
        cellSide = (canvas.clientWidth - 2 * padding) / board.width;
        drawMaze();
        drawPlayer(board.userCell.x, board.userCell.y);
    });
});