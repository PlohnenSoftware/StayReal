import { createSignal, For, Show, type Component, Accessor } from "solid-js";
import { batchDownload, copyLinksToClipboard } from "~/utils/download";
import toast from "solid-toast";
import MdiDownload from '~icons/mdi/download';
import MdiContentCopy from '~icons/mdi/content-copy';
import MdiClose from '~icons/mdi/close';
import { Post } from "~/api/requests/feeds/friends";

export interface PostSelectionItem {
  user: {
    id: string;
    username: string;
  };
  post: Post;
  primarySelected: boolean;
  secondarySelected: boolean;
}

/**
 * Component that allows batch downloading of selected photos
 */
const BatchDownload: Component<{
  posts: Accessor<PostSelectionItem[]>;
  onClose: () => void;
}> = (props) => {
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [isCopying, setIsCopying] = createSignal(false);
  const [progress, setProgress] = createSignal<{ current: number; total: number } | null>(null);

  const selectedPosts = () => props.posts().filter(item => item.primarySelected || item.secondarySelected);
  const totalSelectedPhotos = () => {
    return props.posts().reduce((count, item) => {
      if (item.primarySelected) count++;
      if (item.secondarySelected) count++;
      return count;
    }, 0);
  };
  
  const handleDownload = async () => {
    const selected = selectedPosts();
    
    if (selected.length === 0) {
      toast.error("No photos selected");
      return;
    }

    setIsDownloading(true);
    setProgress({ current: 0, total: totalSelectedPhotos() });

    try {
      const files = selected.flatMap(item => {
        const timestamp = new Date(item.post.postedAt).toISOString().replace(/[:.]/g, '-');
        const username = item.user.username;
        
        const selectedFiles = [];
        
        if (item.primarySelected) {
          selectedFiles.push({
            url: item.post.primary.url,
            filename: `${username}_${timestamp}_primary.jpg`
          });
        }
        
        if (item.secondarySelected) {
          selectedFiles.push({
            url: item.post.secondary.url,
            filename: `${username}_${timestamp}_secondary.jpg`
          });
        }
        
        return selectedFiles;
      });

      await batchDownload(files, (current, total) => {
        setProgress({ current, total });
      });

      toast.success(`Downloaded ${files.length} photos successfully`);
    } catch (error) {
      console.error("[BatchDownload::handleDownload]:", error);
      toast.error(`Error downloading photos: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDownloading(false);
      setProgress(null);
    }
  };

  const handleCopyLinks = async () => {
    const selected = selectedPosts();
    
    if (selected.length === 0) {
      toast.error("No photos selected");
      return;
    }

    setIsCopying(true);

    try {
      const urls = selected.flatMap(item => {
        const selectedUrls = [];
        
        if (item.primarySelected) {
          selectedUrls.push(item.post.primary.url);
        }
        
        if (item.secondarySelected) {
          selectedUrls.push(item.post.secondary.url);
        }
        
        return selectedUrls;
      });

      await copyLinksToClipboard(urls);
      toast.success(`Copied ${urls.length} URLs to clipboard`);
    } catch (error) {
      console.error("[BatchDownload::handleCopyLinks]:", error);
      toast.error(`Error copying links: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div class="fixed bottom-0 left-0 right-0 z-[100] flex justify-center px-4 batch-download-container">
      <div class="bg-black/95 border-t border-l border-r border-white/25 rounded-t-xl p-4 w-full max-w-md shadow-xl backdrop-blur-md"
           data-selected-posts={JSON.stringify(props.posts())}>
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <div class="flex -space-x-1">
              <span class="h-4 w-4 rounded-full bg-green-500 border border-black"></span>
              <span class="h-4 w-4 rounded-full bg-red-500 border border-black"></span>
            </div>
            Download Photos
          </h3>
          <button 
            type="button" 
            onClick={props.onClose}
            class="text-white/75 hover:text-white p-1"
            aria-label="Close"
          >
            <MdiClose />
          </button>
        </div>
        
        <div class="mb-3">
          <p class="text-white/75">
            Selected: <strong>{selectedPosts().length}</strong> posts 
            (<strong>{totalSelectedPhotos()}</strong> photos)
          </p>
          <div class="flex items-center mt-1 gap-2 text-xs text-white/60">
            <div class="flex items-center gap-1">
              <span class="h-3 w-3 rounded-full bg-green-500"></span>
              <span>Primary Photos: {props.posts().reduce((count, item) => count + (item.primarySelected ? 1 : 0), 0)}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="h-3 w-3 rounded-full bg-red-500"></span>
              <span>Secondary Photos: {props.posts().reduce((count, item) => count + (item.secondarySelected ? 1 : 0), 0)}</span>
            </div>
          </div>
        </div>
        
        <Show when={selectedPosts().length > 0}>
          <div class="max-h-32 overflow-y-auto mb-4 rounded bg-white/5 p-2">
            <For each={selectedPosts()}>
              {item => (
                <div class="text-sm text-white/75 mb-1 flex items-center">
                  <span class="truncate flex-1">{item.user.username}'s post</span>
                  <div class="flex items-center">
                    {item.primarySelected && <span class="inline-block w-3 h-3 ml-1 rounded-full bg-green-500"></span>}
                    {item.secondarySelected && <span class="inline-block w-3 h-3 ml-1 rounded-full bg-red-500"></span>}
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
        
        <Show when={progress()}>
          {downloadProgress => (
            <div class="w-full bg-white/10 rounded-full h-2.5 mb-4">
              <div 
                class="bg-white h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${(downloadProgress().current / downloadProgress().total) * 100}%` }}
              />
              <p class="text-white/75 text-xs mt-1">
                Downloading {downloadProgress().current} of {downloadProgress().total}
              </p>
            </div>
          )}
        </Show>
        
        <button
          type="button"
          disabled={isDownloading() || totalSelectedPhotos() === 0}
          onClick={handleDownload}
          class="w-full rounded-lg bg-white/10 hover:bg-white/15 active:opacity-75 px-4 py-3 text-white font-medium transition-all duration-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MdiDownload />
          <span>{isDownloading() ? 'Downloading...' : 'Download Selected Photos'}</span>
        </button>

        <button
          type="button"
          disabled={isCopying() || totalSelectedPhotos() === 0}
          onClick={handleCopyLinks}
          class="w-full rounded-lg bg-white/10 hover:bg-white/15 active:opacity-75 px-4 py-3 text-white font-medium transition-all duration-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          <MdiContentCopy />
          <span>{isCopying() ? 'Copying...' : 'Copy Selected Links'}</span>
        </button>
      </div>
    </div>
  );
};

export default BatchDownload; 