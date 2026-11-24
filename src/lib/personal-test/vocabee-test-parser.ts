export interface ClozeSegment {
  type: "text" | "blank";
  value: string;
  blankId?: number;
}

/**
 * Parses a passage containing ___(N)___ placeholders into structured segments for rendering.
 * Example: "The company decided to ___(1)___ its system." ->
 * [
 *   { type: "text", value: "The company decided to " },
 *   { type: "blank", value: "___(1)___", blankId: 1 },
 *   { type: "text", value: " its system." }
 * ]
 */
export function parseClozePassage(passage: string): ClozeSegment[] {
  const segments: ClozeSegment[] = [];
  const regex = /___\((\d+)\)___/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(passage)) !== null) {
    const matchStart = match.index;
    const matchEnd = regex.lastIndex;

    if (matchStart > lastIndex) {
      segments.push({
        type: "text",
        value: passage.substring(lastIndex, matchStart),
      });
    }

    const blankId = parseInt(match[1], 10);
    segments.push({
      type: "blank",
      value: match[0],
      blankId,
    });

    lastIndex = matchEnd;
  }

  if (lastIndex < passage.length) {
    segments.push({
      type: "text",
      value: passage.substring(lastIndex),
    });
  }

  return segments;
}

/**
 * Extracts all blank IDs present in a cloze test passage in order.
 */
export function extractClozeBlankIds(passage: string): number[] {
  const regex = /___\((\d+)\)___/g;
  const ids: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(passage)) !== null) {
    ids.push(parseInt(match[1], 10));
  }

  return ids;
}
