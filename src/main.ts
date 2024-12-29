import Canvas from "./Canvas";
import Vector2, { getDistance } from "./Vector2";

type Grid = Node[][];

class Node {
  private width: number;
  private height: number;
  /** The row-col position of the node in the grid. */
  public position: Vector2;
  public cost: number;
  public gScore: number;
  public neighbors: Node[];

  constructor(position: Vector2, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.position = position;
    this.neighbors = [];
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
  }

  draw(canvas: Canvas, colors?: { fill?: string; stroke?: string }) {
    canvas.rect({
      x: this.position.x * this.width,
      y: this.position.y * this.height,
      width: this.width,
      height: this.height,
      fill: colors?.fill,
      stroke: colors?.stroke,
    });
  }
}

class Demo extends HTMLElement {
  static observedAttributes = [
    "width",
    "height",
    "rows",
    "cols",
    "start",
    "end",
  ];
  private numRows: number;
  private numCols: number;
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

    this.numRows = Number(this.getAttribute("rows"));
    this.numCols = Number(this.getAttribute("cols"));

    const [startX, startY] = (this.getAttribute("start") || "0,0")
      .split(",")
      .map((n) => Number(n.trim()));
    const [endX, endY] = (this.getAttribute("end") || "0,0")
      .split(",")
      .map((n) => Number(n.trim()));
    this.start = new Vector2(startX, startY);
    this.end = new Vector2(endX, endY);

    // Initialize grid
    this.nodes = [];
    const nodeWidth = this.width / this.numCols;
    const nodeHeight = this.height / this.numRows;
    for (let row = 0; row < this.numRows; row++) {
      this.nodes[row] = [];
      for (let col = 0; col < this.numCols; col++) {
        const nodePosition = new Vector2(col, row);
        this.nodes[row][col] = new Node(nodePosition, nodeWidth, nodeHeight);
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
    canvas.width = this.width;
    canvas.height = this.height;
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

  public get width() {
    return Number(this.getAttribute("width"));
  }

  public get height() {
    return Number(this.getAttribute("height"));
  }

  private draw() {
    this.canvas.clear("white");
    this.nodes.forEach((row) =>
      row.forEach((node) => {
        const isStartOrEnd =
          Vector2.areEqual(node.position, this.start) ||
          Vector2.areEqual(node.position, this.end);
        const fill = isStartOrEnd
          ? "red"
          : this.candidateNodes.has(node)
          ? "#90afe0"
          : this.evaluatedNodes.has(node)
          ? "#9be090"
          : undefined;
        node.draw(this.canvas, {
          fill,
          stroke: "black",
        });
      })
    );
  }

  private findEndNode() {
    if (this.candidateNodes.size) {
      const cheapestNodeToVisit = Array.from(this.candidateNodes).reduce(
        (min, item) => (item.cost < min.cost ? item : min)
      );

      this.candidateNodes.delete(cheapestNodeToVisit);
      this.evaluatedNodes.add(cheapestNodeToVisit);

      if (Vector2.areEqual(cheapestNodeToVisit.position, this.end)) {
        return true;
      }

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
      const found = this.findEndNode();
      this.draw();
      if (!found) {
        this.update();
      }
    });
  }
}

window.customElements.define("a-star", Demo);
