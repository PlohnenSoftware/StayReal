import { For, Show, createEffect, type Component } from "solid-js";
import FeedFriendsOverview from "~/components/feed/friends/overview";
import feed from "~/stores/feed";

const FeedFriendsView: Component = () => {
  // Logujemy cały feed przy każdej zmianie
  createEffect(() => {
    console.log("Cały feed:", feed.get());
  });

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
