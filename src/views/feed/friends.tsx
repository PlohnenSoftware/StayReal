import { For, Show, createEffect, createSignal, type Component } from "solid-js";
import FeedFriendsOverview from "~/components/feed/friends/overview";
import feed from "~/stores/feed";
import BatchDownload, { PostSelectionItem } from "~/components/batch-download";
import MdiDownload from '~icons/mdi/download';
import MdiClose from '~icons/mdi/close';

const FeedFriendsView: Component = () => {
  const [isSelectionMode, setIsSelectionMode] = createSignal(false);
  const [selectedPosts, setSelectedPosts] = createSignal<PostSelectionItem[]>([]);

  // Convert feed posts to selection items when selection mode is enabled
  createEffect(() => {
    if (isSelectionMode() && feed.get()?.friendsPosts) {
      const items: PostSelectionItem[] = feed.get()!.friendsPosts!.flatMap(overview => {
        return overview.posts.map(post => ({
          user: {
            id: overview.user.id,
            username: overview.user.username
          },
          post,
          selected: false
        }));
      });
      setSelectedPosts(items);
    } else {
      setSelectedPosts([]);
    }
  });

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
  };

  // Toggle selection for a post
  const togglePostSelection = (userId: string, postId: string) => {
    setSelectedPosts(prev => 
      prev.map(item => 
        item.user.id === userId && item.post.id === postId
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  return (
    <div data-selection-mode={isSelectionMode() ? "true" : "false"}>
      {/* Selection Mode Toggle Button */}
      <div class="fixed top-16 right-4 z-30">
        <button
          type="button"
          onClick={toggleSelectionMode}
          class="bg-black/60 rounded-full p-2 backdrop-blur-md border border-white/10"
          title={isSelectionMode() ? "Cancel selection" : "Select photos to download"}
        >
          {isSelectionMode() ? <MdiClose class="text-lg" /> : <MdiDownload class="text-lg" />}
        </button>
      </div>

      {/* Batch Download Component */}
      <Show when={isSelectionMode()}>
        <BatchDownload
          posts={selectedPosts}
          onClose={() => setIsSelectionMode(false)}
        />
      </Show>

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
                      isSelectionMode={isSelectionMode()} 
                      onSelectPost={togglePostSelection}
                      isSelected={isSelectionMode() ? 
                        !!selectedPosts().find(item => 
                          item.user.id === overview.user.id && 
                          item.post.id === overview.posts[0].id && 
                          item.selected
                        ) : false}
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
