import { useLocation, useNavigate } from "@solidjs/router";
import { createSignal, onMount, onCleanup, type FlowComponent } from "solid-js";
import toast from "solid-toast";
import { ProfileInexistentError } from "~/api/requests/person/me";
import PullableScreen from "~/components/pullable-screen";
import BatchDownload, { PostSelectionItem } from "~/components/batch-download";
import feed from "~/stores/feed";
import me from "~/stores/me";
import moment from "~/stores/moment"
import MdiRefresh from "~icons/mdi/refresh";
import MdiDownload from '~icons/mdi/download';
import MdiClose from '~icons/mdi/close';
import { promptForPermissions } from "~/utils/permissions";
import BottomNavigation from "~/components/bottom-navigation";
import { Show } from "solid-js";

const FeedLayout: FlowComponent = (props) => {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = createSignal(false);
  const [isSelectionMode, setIsSelectionMode] = createSignal(false);
  const [selectedPosts, setSelectedPosts] = createSignal<PostSelectionItem[]>([]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      await me.refetch();
      await Promise.all([feed.refetch(), moment.refetch()]);
    }
    catch (error) {
      if (error instanceof ProfileInexistentError) {
        navigate("/create-profile");
      }
      else {
        console.error("[FeedLayout::handleRefresh]:", error);

        if (error instanceof Error) {
          toast.error(error.message);
        }
        else {
          // Whatever the error is, we'll just show it as a string.
          toast.error("An unknown error occurred: " + String(error));
        }

      }
    }
    finally {
      setIsRefreshing(false);
    }
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    
    // Convert feed posts to selection items when selection mode is enabled
    if (!isSelectionMode() && feed.get()?.friendsPosts) {
      // Set up selection items
      const items: PostSelectionItem[] = feed.get()!.friendsPosts!.flatMap(overview => {
        return overview.posts.map(post => ({
          user: {
            id: overview.user.id,
            username: overview.user.username
          },
          post,
          primarySelected: false,
          secondarySelected: false
        }));
      });
      setSelectedPosts(items);
      
      // Emit a custom event to notify components that selection mode has changed
      window.dispatchEvent(new CustomEvent('selectionModeChanged', { 
        detail: { isActive: true }
      }));
    } else {
      setSelectedPosts([]);
      
      // Emit a custom event to notify components that selection mode has changed
      window.dispatchEvent(new CustomEvent('selectionModeChanged', { 
        detail: { isActive: false }
      }));
    }
  };

  // Handle post selection from child components
  const handlePostSelection = (event: CustomEvent) => {
    const { userId, postId, photoType } = event.detail;
    
    setSelectedPosts(prev =>
      prev.map(item => {
        if (item.user.id === userId && item.post.id === postId) {
          if (photoType === 'primary') {
            return { ...item, primarySelected: !item.primarySelected };
          } else if (photoType === 'secondary') {
            return { ...item, secondarySelected: !item.secondarySelected };
          }
        }
        return item;
      })
    );
  };

  onMount(() => {
    // Ask the user for notification permissions.
    promptForPermissions();

    // Automatically refresh whenever the user navigates to the feed.
    handleRefresh();

    // Listen for post selection events
    window.addEventListener('togglePostSelection', handlePostSelection as EventListener);
  });

  onCleanup(() => {
    // Remove event listener when component is unmounted
    window.removeEventListener('togglePostSelection', handlePostSelection as EventListener);
  });

  return (
    <>
      <header class="pt-[env(safe-area-inset-top)]">
        <nav class="flex items-center gap-4 px-8 h-[72px]">
          {/* <a href="/friends/connections" aria-label="Relationships">
            <MdiPeople class="text-xl" />
          </a> */}

          <p
            class="text-2xl text-center text-white font-700"
            role="banner"
          >
            Friends
          </p>

          <div class="flex ml-auto items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectionMode}
              class="bg-white/10 rounded-full p-1.5 transition-all duration-200 hover:bg-white/15 relative"
              classList={{
                "bg-green-500/20 hover:bg-green-500/30": isSelectionMode(),
              }}
              title={isSelectionMode() ? "Cancel selection" : "Select photos for links"}
            >
              {isSelectionMode() ? <MdiClose class="text-xl" /> : <MdiDownload class="text-xl" />}
              
              {/* Selection indicator */}
              <Show when={isSelectionMode() && totalSelectedPhotos() > 0}>
                <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalSelectedPhotos()}
                </span>
              </Show>
            </button>
            
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing()}
              title="Refresh feed & last moment"
              class="bg-white/10 rounded-full p-1.5 transition-all duration-200 hover:bg-white/15"
            >
              <MdiRefresh
                class="text-white text-xl"
                classList={{
                  "animate-spin text-white/50": isRefreshing(),
                }}
              />
            </button>
          </div>
        </nav>
      </header>

      {/* Set a data attribute for child components to detect selection mode */}
      <div 
        data-selection-mode={isSelectionMode() ? "true" : "false"}
        data-selection-count={totalSelectedPhotos()}
        class="min-h-[calc(100vh-72px)]"
      >
        {/* Batch Download Component */}
        {isSelectionMode() && (
          <BatchDownload
            posts={selectedPosts}
            onClose={() => toggleSelectionMode()}
          />
        )}

        <div class="pt-4 pb-32 mb-[env(safe-area-inset-bottom)]">
          <PullableScreen onRefresh={handleRefresh}>
            <main>
              {props.children}
            </main>
          </PullableScreen>
        </div>
      </div>

      <BottomNavigation />
    </>
  )
};

// Helper function to count total selected photos
function totalSelectedPhotos(): number {
  const selectedPostsElement = document.querySelector('.batch-download-container [data-selected-posts]');
  if (!selectedPostsElement) return 0;
  
  try {
    const selectedPosts = JSON.parse(selectedPostsElement.getAttribute('data-selected-posts') || '[]') as PostSelectionItem[];
    return selectedPosts.reduce((count, item) => {
      if (item.primarySelected) count++;
      if (item.secondarySelected) count++;
      return count;
    }, 0);
  } catch (e) {
    return 0;
  }
}

export default FeedLayout;
