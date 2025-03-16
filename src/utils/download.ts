/**
 * Utility functions for downloading files
 */

/**
 * Downloads a file from a URL with a specified filename
 * @param url The URL of the file to download
 * @param filename The filename to save the file as
 */
export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    }, 100);
  } catch (error) {
    console.error('[download::downloadFile]:', error);
    throw new Error(`Failed to download file: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Downloads multiple files in sequence
 * @param files Array of objects containing URLs and filenames
 * @param onProgress Optional callback for progress updates
 */
export const batchDownload = async (
  files: Array<{ url: string; filename: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  let completed = 0;
  const total = files.length;

  for (const file of files) {
    try {
      await downloadFile(file.url, file.filename);
      completed++;
      
      if (onProgress) {
        onProgress(completed, total);
      }
    } catch (error) {
      console.error('[download::batchDownload]:', error);
      // Continue with next file even if one fails
    }
  }
};

/**
 * Copies multiple URLs to clipboard, each on a new line
 * @param urls Array of URLs to copy
 * @returns Promise that resolves when the operation is complete
 */
export const copyLinksToClipboard = async (
  urls: string[]
): Promise<void> => {
  try {
    const text = urls.join('\n');
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('[download::copyLinksToClipboard]:', error);
    throw new Error(`Failed to copy links to clipboard: ${error instanceof Error ? error.message : String(error)}`);
  }
}; 