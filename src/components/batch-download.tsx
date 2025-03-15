import { createSignal, For, Show, type Component, Accessor } from "solid-js";
import { batchDownload } from "~/utils/download";
import toast from "solid-toast";
import MdiDownload from '~icons/mdi/download';
import MdiClose from '~icons/mdi/close';
import { Post } from "~/api/requests/feeds/friends";

export interface PostSelectionItem {
  user: {
    id: string;
    username: string;
  };
  post: Post;
  selected: boolean;
}

/**
 * Component that allows batch downloading of selected photos
 */
const BatchDownload: Component<{
  posts: Accessor<PostSelectionItem[]>;
  onClose: () => void;
}> = (props) => {
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [progress, setProgress] = createSignal<{ current: number; total: number } | null>(null);

  const selectedPosts = () => props.posts().filter(item => item.selected);
  
  const handleDownload = async () => {
    const selected = selectedPosts();
    
    if (selected.length === 0) {
      toast.error("No photos selected");
      return;
    }

    setIsDownloading(true);
    setProgress({ current: 0, total: selected.length * 2 }); // Each post has two photos

    try {
      const files = selected.flatMap(item => {
        const timestamp = new Date(item.post.postedAt).toISOString().replace(/[:.]/g, '-');
        const username = item.user.username;
        
        return [
          {
            url: item.post.primary.url,
            filename: `${username}_${timestamp}_primary.jpg`
          },
          {
            url: item.post.secondary.url,
            filename: `${username}_${timestamp}_secondary.jpg`
          }
        ];
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

  return (
    <div class="fixed bottom-20 left-0 right-0 z-50 flex justify-center px-4">
      <div class="bg-black/90 border border-white/25 rounded-xl p-4 w-full max-w-md shadow-xl">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-lg font-bold">Download Photos</h3>
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
            (<strong>{selectedPosts().length * 2}</strong> photos)
          </p>
        </div>
        
        <Show when={selectedPosts().length > 0}>
          <div class="max-h-32 overflow-y-auto mb-4 rounded bg-white/5 p-2">
            <For each={selectedPosts()}>
              {item => (
                <div class="text-sm text-white/75 mb-1">
                  {item.user.username}'s post ({new Date(item.post.postedAt).toLocaleDateString()})
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
          disabled={isDownloading() || selectedPosts().length === 0}
          onClick={handleDownload}
          class="w-full rounded-lg bg-white/10 hover:bg-white/15 active:opacity-75 px-4 py-3 text-white font-medium transition-all duration-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <MdiDownload />
          <span>{isDownloading() ? 'Downloading...' : 'Download Selected Photos'}</span>
        </button>
      </div>
    </div>
  );
};

export default BatchDownload; 