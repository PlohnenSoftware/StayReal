import { For, Show, createEffect, createSignal, type Component } from "solid-js";
import FeedFriendsOverview from "~/components/feed/friends/overview";
import feed from "~/stores/feed";
import { PostSelectionItem } from "~/components/batch-download";

const FeedFriendsView: Component = () => {
  // Logujemy cały feed przy każdej zmianie
  createEffect(() => {
    console.log("Cały feed:", feed.get());
  });

  // Check if we're in a parent component's selection mode
  const isInSelectionMode = () => {
    // We can check if BatchDownload is currently open by looking for its container
    return !!document.querySelector('.batch-download-container');
  };

  // Check if a post is selected
  const isPostSelected = (userId: string, postId: string) => {
    // Find in the global selected posts
    const selectedPostsElement = document.querySelector('.batch-download-container [data-selected-posts]');
    if (!selectedPostsElement) return false;
    
    try {
      const selectedPosts = JSON.parse(selectedPostsElement.getAttribute('data-selected-posts') || '[]') as PostSelectionItem[];
      return selectedPosts.some(item => 
        item.user.id === userId && 
        item.post.id === postId && 
        item.selected
      );
    } catch (e) {
      return false;
    }
  };

  // Toggle selection for a post through a custom event
  const togglePostSelection = (userId: string, postId: string) => {
    // Dispatch a custom event that the layout component can listen for
    window.dispatchEvent(new CustomEvent('togglePostSelection', {
      detail: { userId, postId }
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
                      isSelectionMode={isInSelectionMode()}
                      isSelected={isInSelectionMode() && isPostSelected(overview.user.id, overview.posts[0].id)}
                      onSelectPost={togglePostSelection}
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
