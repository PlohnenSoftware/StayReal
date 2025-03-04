import fs from "node:fs/promises";

export const fileExists = async (path: string): Promise<boolean> => {
  try {
    await fs.access(path);
    return true;
  }
  catch {
    return false;
  }
}
