import Canvas from "./Canvas";
import Vector2, { getDistance } from "./Vector2";

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const NUM_COLS = 20;
const NUM_ROWS = 20;
const NODE_WIDTH = CANVAS_WIDTH / NUM_COLS;
const NODE_HEIGHT = CANVAS_HEIGHT / NUM_ROWS;

type Grid = Node[][];

class Node {
  /** The row-col position of the node in the grid. */
  public position: Vector2;
  public cost: number;
  public gScore: number;
  public neighbors: Node[];

  constructor(position: Vector2) {
    this.neighbors = [];
    this.position = position;
    this.cost = 0;
    this.gScore = 0;
  }

  trackNeighbors(grid: Grid) {
    this.neighbors = [];
    const rowIndex = this.position.y;
    const colIndex = this.position.x;
    this.neighbors.push(grid[rowIndex][colIndex - 1]);
    this.neighbors.push(grid[rowIndex][colIndex + 1]);
    this.neighbors.push(grid[rowIndex - 1]?.[colIndex]);
    this.neighbors.push(grid[rowIndex + 1]?.[colIndex]);
    this.neighbors = this.neighbors.filter((node) => !!node);
    // console.log(
    //   `[${this.position.y}, ${
    //     this.position.x
    //   }] has neighbors at: ${this.neighbors
    //     .map((neighbor) => `[${neighbor.position.y}, ${neighbor.position.x}]`)
    //     .join(", ")}`
    // );
  }

  draw(canvas: Canvas, colors?: { fill?: string, stroke?: string }) {
    canvas.rect({
      x: this.position.x * NODE_WIDTH,
      y: this.position.y * NODE_HEIGHT,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      fill: colors?.fill,
      stroke: colors?.stroke ?? 'black',
    });
  }
}

class Demo extends HTMLElement {
  static observedAttributes = ["max-fps"];
  private canvas: Canvas;
  /** The start position of the search. */
  private start: Vector2;
  /** The end position of the search. */
  private end: Vector2;
  /** The search space of nodes. Each node is connected to all other nodes around it. */
  private nodes: Grid;
  private candidateNodes: Set<Node>;
  private evaluatedNodes: Set<Node>;

  constructor() {
    super();
    this.start = new Vector2(0, 0);
    this.end = new Vector2(NUM_COLS - 1, NUM_ROWS - 1);
    this.nodes = [];
    // Initialize grid
    for (let row = 0; row < NUM_ROWS; row++) {
      this.nodes[row] = [];
      for (let col = 0; col < NUM_COLS; col++) {
        const nodePosition = new Vector2(col, row);
        this.nodes[row][col] = new Node(nodePosition);
      }
    }
    // Track neighbors for each node in the grid
    this.nodes.forEach((row) =>
      row.forEach((node) => node.trackNeighbors(this.nodes))
    );
    this.candidateNodes = new Set([this.nodes[this.start.y][this.start.x]]);
    this.evaluatedNodes = new Set();

    const canvas = document.createElement("canvas");
    canvas.style.border = "solid 1px";
    canvas.style.maxWidth = "100%";
    canvas.width = Number(CANVAS_WIDTH);
    canvas.height = Number(CANVAS_HEIGHT);
    this.canvas = new Canvas(canvas);
    const label = this.getAttribute("title");
    this.removeAttribute("title");
    canvas.setAttribute("tabindex", "0");
    canvas.setAttribute("role", "region");
    canvas.setAttribute("aria-label", label!);
    const shadow = this.attachShadow({ mode: "closed" });
    shadow.appendChild(canvas);

    this.update();
  }

  private draw() {
    this.canvas.clear("white");
    this.nodes.forEach((row) => row.forEach((node) => node.draw(this.canvas, { stroke: node === this.nodes[0][0] || node === this.nodes[NUM_ROWS - 1][NUM_COLS - 1] ? 'red' : 'black' })));
    this.candidateNodes.forEach((node) => node.draw(this.canvas, { fill: "#90afe0", stroke: node === this.nodes[0][0] || node === this.nodes[NUM_ROWS - 1][NUM_COLS - 1] ? 'red' : 'black' }));
    this.evaluatedNodes.forEach((node) => node.draw(this.canvas, { fill: "#9be090", stroke: node === this.nodes[0][0] || node === this.nodes[NUM_ROWS - 1][NUM_COLS - 1] ? 'red' : 'black' }));
  }

  private step() {
    if (this.candidateNodes.size) {
      const cheapestNodeToVisit = Array.from(this.candidateNodes).reduce(
        (min, item) => (item.cost < min.cost ? item : min)
      );

      this.candidateNodes.delete(cheapestNodeToVisit);
      this.evaluatedNodes.add(cheapestNodeToVisit);

      if (
        cheapestNodeToVisit.position.x === this.end.x &&
        cheapestNodeToVisit.position.y === this.end.y
      ) {
        console.log("DONE");
        return;
      }

      // console.log({
      //   cheapestNodeToVisit,
      //   candidateNodes: this.candidateNodes,
      //   evaluatedNodes: this.evaluatedNodes,
      // });

      cheapestNodeToVisit.neighbors.forEach((neighbor) => {
        if (this.evaluatedNodes.has(neighbor)) {
          return;
        }

        // In our simple grid, the distance is always 1, but in a more general problem it might not be
        const distanceToNeighbor = 1;
        const tempGScore = cheapestNodeToVisit.gScore + distanceToNeighbor;

        if (this.candidateNodes.has(neighbor)) {
          if (tempGScore < neighbor.gScore) {
            neighbor.gScore = tempGScore;
          }
        } else {
          neighbor.gScore = tempGScore;
          this.candidateNodes.add(neighbor);
        }

        const costEstimated = getDistance(neighbor.position, this.end);
        neighbor.cost = neighbor.gScore + costEstimated;
      });
    }
  }

  private update() {
    requestAnimationFrame(() => {
      this.step();
      this.draw();
      this.update();
    });
  }
}

window.customElements.define("a-star", Demo);
