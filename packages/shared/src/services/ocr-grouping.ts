export interface OcrLine {
  text: string;
  bboxX: number;
  bboxY: number;
  bboxWidth: number;
  bboxHeight: number;
}

interface Cluster {
  lines: OcrLine[];
}

const VERTICAL_GAP_RATIO = 1.0;
const HORIZONTAL_CENTER_TOLERANCE_RATIO = 0.6;

function centerX(line: OcrLine): number {
  return line.bboxX + line.bboxWidth / 2;
}

function bottomY(line: OcrLine): number {
  return line.bboxY + line.bboxHeight;
}

function canJoin(line: OcrLine, clusterLast: OcrLine): boolean {
  const verticalGap = line.bboxY - bottomY(clusterLast);
  const maxVerticalGap = Math.max(line.bboxHeight, clusterLast.bboxHeight) * VERTICAL_GAP_RATIO;

  const horizontalDiff = Math.abs(centerX(line) - centerX(clusterLast));
  const maxHorizontalDiff =
    Math.max(line.bboxWidth, clusterLast.bboxWidth) * HORIZONTAL_CENTER_TOLERANCE_RATIO;

  return verticalGap <= maxVerticalGap && horizontalDiff <= maxHorizontalDiff;
}

export function groupLinesIntoBlocks(lines: OcrLine[]): OcrLine[] {
  const sorted = [...lines].sort((a, b) => a.bboxY - b.bboxY);
  const clusters: Cluster[] = [];

  for (const line of sorted) {
    let bestCluster: Cluster | null = null;
    let bestGap = Infinity;

    for (const cluster of clusters) {
      const last = cluster.lines[cluster.lines.length - 1];
      if (!canJoin(line, last)) continue;

      const gap = line.bboxY - bottomY(last);
      if (gap < bestGap) {
        bestGap = gap;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      bestCluster.lines.push(line);
    } else {
      clusters.push({ lines: [line] });
    }
  }

  return clusters
    .map((cluster) => {
      const text = cluster.lines.map((l) => l.text).join(" ");
      const minX = Math.min(...cluster.lines.map((l) => l.bboxX));
      const minY = Math.min(...cluster.lines.map((l) => l.bboxY));
      const maxX = Math.max(...cluster.lines.map((l) => l.bboxX + l.bboxWidth));
      const maxY = Math.max(...cluster.lines.map((l) => bottomY(l)));
      return { text, bboxX: minX, bboxY: minY, bboxWidth: maxX - minX, bboxHeight: maxY - minY };
    })
    .sort((a, b) => a.bboxY - b.bboxY);
}
