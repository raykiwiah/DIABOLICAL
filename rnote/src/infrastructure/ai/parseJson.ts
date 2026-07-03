/**
 * Models often wrap JSON in prose or ```json fences. `parseJsonLoose` strips
 * fences and extracts the first balanced `{...}` block before parsing, so the
 * organization/summary pipelines don't shatter on a stray "Here you go:".
 */
export function parseJsonLoose(text: string): unknown | null {
  if (!text) return null;

  // Fast path: already-clean JSON.
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through to extraction */
  }

  // Strip markdown code fences (```json ... ``` or ``` ... ```).
  const unfenced = trimmed
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  try {
    return JSON.parse(unfenced);
  } catch {
    /* fall through to brace extraction */
  }

  // Extract the first balanced top-level object.
  const block = firstBalancedObject(unfenced);
  if (block) {
    try {
      return JSON.parse(block);
    } catch {
      return null;
    }
  }
  return null;
}

function firstBalancedObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
