import { For, Show, createEffect, createSignal, type Component } from "solid-js";
import FeedFriendsOverview from "~/components/feed/friends/overview";
import feed from "~/stores/feed";
import { PostSelectionItem } from "~/components/batch-download";

const FeedFriendsView: Component = () => {
  // Track selection mode state locally to ensure it's consistent
  const [isSelecting, setIsSelecting] = createSignal(false);
  
  // Update local selection state when the global selection state changes
  createEffect(() => {
    const isGlobalSelectionModeOn = document.querySelector('[data-selection-mode="true"]') !== null;
    setIsSelecting(isGlobalSelectionModeOn);
    
    // Set up a mutation observer to detect changes to selection mode
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-selection-mode') {
          setIsSelecting(document.querySelector('[data-selection-mode="true"]') !== null);
        }
      }
    });
    
    const selectionContainer = document.querySelector('[data-selection-mode]');
    if (selectionContainer) {
      observer.observe(selectionContainer, { attributes: true });
    }
    
    return () => observer.disconnect();
  });

  // Logujemy cały feed przy każdej zmianie
  createEffect(() => {
    console.log("Cały feed:", feed.get());
  });

  // Check if a photo is selected
  const isPhotoSelected = (userId: string, postId: string, photoType: 'primary' | 'secondary') => {
    // Find in the global selected posts
    const selectedPostsElement = document.querySelector('.batch-download-container [data-selected-posts]');
    if (!selectedPostsElement) return false;
    
    try {
      const selectedPosts = JSON.parse(selectedPostsElement.getAttribute('data-selected-posts') || '[]') as PostSelectionItem[];
      const post = selectedPosts.find(item => 
        item.user.id === userId && 
        item.post.id === postId
      );
      
      if (!post) return false;
      
      return photoType === 'primary' ? post.primarySelected : post.secondarySelected;
    } catch (e) {
      return false;
    }
  };

  // Toggle selection for a photo through a custom event
  const togglePhotoSelection = (userId: string, postId: string, photoType: 'primary' | 'secondary') => {
    // Dispatch a custom event that the layout component can listen for
    window.dispatchEvent(new CustomEvent('togglePostSelection', {
      detail: { userId, postId, photoType }
    }));
  };

  return (
    <div>
      <Show
        when={feed.get()}
        fallback={<p class="text-center text-white/50">finding your feed...</p>}
      >
        {(feed) => (
          <div class="flex flex-col gap-6">
            <Show
              when={feed().friendsPosts}
              fallback={
                <p class="text-center text-white/75 px-4 mt-12">
                  Your friends haven't posted anything yet,<br />come back later!
                </p>
              }
            >
              {(friends) => (
                <For
                  each={[...friends()].sort(
                    (a, b) =>
                      new Date(
                        b.posts[b.posts.length - 1].postedAt
                      ).getTime() -
                      new Date(
                        a.posts[a.posts.length - 1].postedAt
                      ).getTime()
                  )}
                >
                  {(overview) => (
                    <FeedFriendsOverview
                      overview={overview}
                      isSelectionMode={isSelecting()}
                      isPrimarySelected={isSelecting() && isPhotoSelected(overview.user.id, overview.posts[0].id, 'primary')}
                      isSecondarySelected={isSelecting() && isPhotoSelected(overview.user.id, overview.posts[0].id, 'secondary')}
                      onSelectPhoto={(photoType) => togglePhotoSelection(overview.user.id, overview.posts[0].id, photoType)}
                    />
                  )}
                </For>
              )}
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
};

export default FeedFriendsView;
