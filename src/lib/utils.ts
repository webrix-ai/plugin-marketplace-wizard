export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function stripJsonComments(text: string): string {
  let result = "";
  let inString = false;
  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let i = 0;

  while (i < text.length) {
    if (inSingleLineComment) {
      if (text[i] === "\n") {
        inSingleLineComment = false;
        result += text[i];
      }
      i++;
      continue;
    }

    if (inMultiLineComment) {
      if (text[i] === "*" && text[i + 1] === "/") {
        inMultiLineComment = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (inString) {
      if (text[i] === "\\" && i + 1 < text.length) {
        result += text[i] + text[i + 1];
        i += 2;
        continue;
      }
      if (text[i] === '"') {
        inString = false;
      }
      result += text[i];
      i++;
      continue;
    }

    if (text[i] === '"') {
      inString = true;
      result += text[i];
      i++;
      continue;
    }

    if (text[i] === "/" && text[i + 1] === "/") {
      inSingleLineComment = true;
      i += 2;
      continue;
    }

    if (text[i] === "/" && text[i + 1] === "*") {
      inMultiLineComment = true;
      i += 2;
      continue;
    }

    result += text[i];
    i++;
  }

  return result;
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}
