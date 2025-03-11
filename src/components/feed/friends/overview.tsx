import { batch, type Component, createMemo, createSignal, For, Show } from "solid-js";
import type { PostsOverview } from "~/api/requests/feeds/friends";
import MdiDotsVertical from '~icons/mdi/dots-vertical';
import MdiRepost from '~icons/mdi/repost';
import MdiCommentOutline from '~icons/mdi/comment-outline'
import MdiMapSearch from '~icons/mdi/map-search'
import FeedFriendsPost from "./post";
import Location from "~/components/location";
import { Duration } from "luxon";
import { open } from "@tauri-apps/plugin-shell"
import MdiSend from '~icons/mdi/send'
import me from "~/stores/me";
import { content_posts_comment } from "~/api/requests/content/posts/comment";
import feed from "~/stores/feed";
import ProfilePicture from "~/components/profile-picture";
import Drawer from "@corvu/drawer";
import toast from "solid-toast";
import { confirm } from "@tauri-apps/plugin-dialog";
import { postModerationBlockUsers } from "~/api/requests/moderation/block-users";
import MdiLaunch from '~icons/mdi/launch'

const FeedFriendsOverview: Component<{
  overview: PostsOverview
}> = (props) => {
  const post = () => props.overview.posts[0];
  const postDate = () => new Date(post().postedAt);

  // Show up to 2 comments as a sample.
  const commentsSample = () => post().comments.slice(0, 2);

  const lateDuration = createMemo(() => {
    if (post().lateInSeconds > 0) {
      const duration = Duration.fromObject({ seconds: post().lateInSeconds });
      return duration.rescale().toHuman({ unitDisplay: "short" });
    }
  });

  const [comment, setComment] = createSignal("");
  const handlePostComment = async (event: SubmitEvent) => {
    event.preventDefault();

    const content = comment().trim();
    if (!content) return;

    await content_posts_comment(post().id, props.overview.user.id, content);
    await feed.refetch();
  };

  const [isActionsDrawerOpened, setActionsDrawerOpen] = createSignal(false);
  const [isReportDrawerOpened, setReportDrawerOpen] = createSignal(false);

  return (
    <>
      <Drawer
        trapFocus={false}
        onOutsideFocus={e => e.preventDefault()}
        open={isActionsDrawerOpened()}
        onOpenChange={setActionsDrawerOpen}
        breakPoints={[0.75]}
      >
        {(drawer) => (
          <Drawer.Portal>
            <Drawer.Overlay
              class="fixed inset-0 z-50 corvu-transitioning:transition-colors corvu-transitioning:duration-500 corvu-transitioning:ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{
                'background-color': `rgb(0 0 0 / ${
                  0.5 * drawer.openPercentage
                })`,
              }}
            />
            <Drawer.Content class="corvu-transitioning:transition-transform corvu-transitioning:duration-500 corvu-transitioning:ease-[cubic-bezier(0.32,0.72,0,1)] fixed inset-x-0 bottom-0 z-50 flex h-full max-h-72 flex-col rounded-t-xl bg-[#141414] pt-3 px-4 after:absolute after:inset-x-0 after:top-[calc(100%-1px)] after:h-1/2 after:bg-inherit md:select-none">
              <div class="h-1 w-10 self-center rounded-full bg-white/40 " />
              {/* <Drawer.Label class="mt-2 text-center text-xl font-bold">
                Hello, I'm the first drawer :)
              </Drawer.Label>
              <Drawer.Description class="mt-1 text-center">
                Click on the button below if you're cute
              </Drawer.Description> */}

              <div class="flex flex-col gap-2 mt-6">
                <div class="flex gap-2 mb-4">
                  <button type="button" class="w-full h-16 relative rounded-lg transition-opacity active:opacity-50"
                    onClick={() => open(post().primary.url)}
                    style={{
                      background: `url(${post().primary.url}) center center / cover no-repeat`
                    }}
                  >
                    <div class="absolute inset-1 rounded-md bg-black/40 flex items-center justify-center hover:opacity-50 transition-opacity">
                      <MdiLaunch class="text-lg" />
                    </div>
                  </button>
                  <button type="button" class="w-full h-16 relative rounded-lg transition-opacity active:opacity-50"
                    onClick={() => open(post().secondary.url)}
                    style={{
                      background: `url(${post().secondary.url}) center center / cover no-repeat`
                    }}
                  >
                    <div class="absolute inset-1 rounded-md bg-black/40 flex items-center justify-center hover:opacity-50 transition-opacity">
                      <MdiLaunch class="text-lg" />
                    </div>
                  </button>
                </div>

                <button type="button" class="w-full rounded-lg bg-white/5 text-red/80 hover:text-white px-4 py-3 text-lg font-medium transition-all duration-100 hover:bg-white/10 active:opacity-50"
                  onClick={() => {
                    // We wait a bit to make it feel more natural.
                    setTimeout(() => {
                      batch(() => {
                        setActionsDrawerOpen(false);
                        setReportDrawerOpen(true);
                      })
                    }, 75);
                  }}
                >
                  Report this post
                </button>

                <button type="button" class="w-full rounded-lg bg-white/5 text-red/80 hover:text-white px-4 py-3 text-lg font-medium transition-all duration-100 hover:bg-white/10 active:opacity-50"
                  onClick={async () => {
                    // 0. make sure the user wants to block the user.
                    const confirmation = await confirm(`${props.overview.user.username} will no longer be able to see your public posts. ${props.overview.user.username} will be removed from your friends.`, {
                      title: `Block ${props.overview.user.username}?`,
                      okLabel: "Block",
                      cancelLabel: "Cancel",
                      kind: "warning"
                    });

                    if (!confirmation) return;

                    // 1. block the user.
                    await postModerationBlockUsers(props.overview.user.id);

                    // 2. close the drawer.
                    setActionsDrawerOpen(false);

                    // 3. refresh the feed.
                    await feed.refetch();
                  }}
                >
                  Block this user
                </button>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        )}
      </Drawer>

      <Drawer
        trapFocus={false}
        onOutsideFocus={e => e.preventDefault()}
        open={isReportDrawerOpened()}
        onOpenChange={setReportDrawerOpen}
        breakPoints={[0.75]}
      >
        {(drawer) => (
          <Drawer.Portal>
            <Drawer.Overlay
              class="fixed inset-0 z-50 corvu-transitioning:transition-colors corvu-transitioning:duration-500 corvu-transitioning:ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{
                'background-color': `rgb(0 0 0 / ${
                  0.5 * drawer.openPercentage
                })`,
              }}
            />
            <Drawer.Content class="corvu-transitioning:transition-transform corvu-transitioning:duration-500 corvu-transitioning:ease-[cubic-bezier(0.32,0.72,0,1)] fixed inset-x-0 bottom-0 z-50 flex h-full flex-col rounded-t-lg bg-[#141414] pt-3 px-4 after:absolute after:inset-x-0 after:top-[calc(100%-1px)] after:h-1/2 after:bg-inherit md:select-none">
              <div class="h-1 w-10 self-center rounded-full bg-white/40" />

              <Drawer.Label class="mt-4 text-center text-xl font-bold">
                Report a moment
              </Drawer.Label>
              <Drawer.Description class="mt-1 text-center">
                Your report is confidential.
              </Drawer.Description>

              <button type="button" class="w-full rounded-lg bg-white/5 px-4 py-3 text-lg font-medium transition-all duration-100 hover:bg-white/10 active:opacity-50">
                Spam
              </button>
              <button type="button" class="w-full rounded-lg bg-white/5 px-4 py-3 text-lg font-medium transition-all duration-100 hover:bg-white/10 active:opacity-50">
                Scam or untrue information
              </button>
              <button type="button" class="w-full rounded-lg bg-white/5 px-4 py-3 text-lg font-medium transition-all duration-100 hover:bg-white/10 active:opacity-50">
                Inappropriate caption
              </button>
              <button type="button" class="w-full rounded-lg bg-white/5 px-4 py-3 text-lg font-medium transition-all duration-100 hover:bg-white/10 active:opacity-50">
                Just not for me
              </button>
              <button type="button" class="w-full rounded-lg bg-white/5 px-4 py-3 text-lg font-medium transition-all duration-100 hover:bg-white/10 active:opacity-50">
                Nudity or sexual
              </button>
              <button type="button" class="w-full rounded-lg bg-white/5 px-4 py-3 text-lg font-medium transition-all duration-100 hover:bg-white/10 active:opacity-50">
                Violent or dangerous
              </button>
              <button type="button" class="w-full rounded-lg bg-white/5 px-4 py-3 text-lg font-medium transition-all duration-100 hover:bg-white/10 active:opacity-50">
                Hate speech or symbols
              </button>
              <button type="button" class="w-full rounded-lg bg-white/5 px-4 py-3 text-lg font-medium transition-all duration-100 hover:bg-white/10 active:opacity-50">
                Suicide or self-harm
              </button>
              <button type="button" class="w-full rounded-lg bg-white/5 px-4 py-3 text-lg font-medium transition-all duration-100 hover:bg-white/10 active:opacity-50">
                Something else
              </button>

              <button type="button" onClick={async () => {
                toast.promise(new Promise((res) => setTimeout(res, 1_200)), {
                  loading: "Reporting...",
                  success: "Post reported to the moderation team.",
                  error: "Failed to report the post." // should never happen
                });

                setReportDrawerOpen(false);
              }}>
                REPORT
              </button>
            </Drawer.Content>
          </Drawer.Portal>
        )}
      </Drawer>

      <div>
        <div class="flex items-center gap-3 px-4 bg-white/6 py-2.5 rounded-t-2xl">
          <ProfilePicture
            username={props.overview.user.username}
            media={props.overview.user.profilePicture}
            size={32}
            textSize={12}
          />

          <div class="flex flex-col gap-.5">
            <p class="font-600 w-fit">
              {props.overview.user.username}
            </p>
            <Show when={post().origin === "repost"}>
              <p class="w-fit text-white/80 flex items-center gap-1 bg-white/20 pl-2 pr-2.5 rounded-full text-xs">
                <MdiRepost /> {post().parentPostUsername}
              </p>
            </Show>
          </div>

          <button type="button"
            onClick={() => setActionsDrawerOpen(true)}
            class="ml-auto hover:bg-white/8 rounded-full p-1.5 -mr-1.5 transition-colors"
          >
            <MdiDotsVertical class="text-xl" />
          </button>
        </div>

        <div class="bg-white/4 pb-4 rounded-b-2xl">
          <div class="flex flex-col w-full px-4 py-2 rounded-t-2xl">
            <div class="flex flex-col py-2">
              <div class="flex text-sm text-white/60 space-x-1">
                <time class="shrink-0">
                  <span class="tts-only">Posted</span>{" "}
                  {postDate().getDate() === new Date().getDate() ? "Today" : "Yesterday"}
                  {", "}<span class="tts-only">at</span>{" "}
                  <span class="text-white/80">{postDate().toLocaleTimeString()}</span>
                </time>
                <span>•</span>
                <p class="truncate">
                  {post().isMain
                    ? lateDuration()
                      ? `Late of ${lateDuration()}`
                      : "Just in time"
                    : "Additional moment"
                  }
                </p>
              </div>
              <Show when={post().location}>
                {location => (
                  <div class="flex items-center gap-1 text-white/60">
                    <p class="text-sm flex items-center gap-1">
                      Took at{" "}
                      <button type="button"
                        onClick={() => open(`https://maps.google.com/?q=${location().latitude},${location().longitude}`)}
                        class="bg-white/10 flex items-center gap-1 py-.5 px-2 rounded-md text-white/80"
                      >
                        <Location
                          latitude={location().latitude}
                          longitude={location().longitude}
                        />
                        <MdiMapSearch />
                      </button>
                    </p>
                  </div>
                )}
              </Show>
            </div>
          </div>

          <div class="overflow-hidden relative">
            <div class="flex">
              <For each={props.overview.posts}>
                {(post) => (
                  <div class="min-w-0 transition-all"
                    classList={{
                      "flex-[0_0_auto] max-w-94%": props.overview.posts.length > 1,
                      "flex-[0_0_100%] max-w-full": props.overview.posts.length === 1,
                    }}
                  >
                    <div class="relative">
                      <FeedFriendsPost
                        post={post}
                        postUserId={props.overview.user.id}
                      />
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>

        <div class="px-6 pt-4 mb-2">
          <p class="text-left">
            {post().caption}
          </p>

          <div class="text-sm font-300">
            <Show when={commentsSample().length > 0}>
              <div class="flex items-center gap-1 opacity-50">
                <MdiCommentOutline class="text-xs" />
                <p>See the comments</p>
              </div>
            </Show>

            <For each={commentsSample()}>
              {comment => (
                <div class="flex items-center gap-1">
                  <p class="font-600">{comment.user.username}</p>
                  <p>{comment.content}</p>
                </div>
              )}
            </For>

            <form onSubmit={handlePostComment} class="flex items-center gap-2 mt-2">
              <ProfilePicture
                username={me.get()!.username}
                media={me.get()?.profilePicture}
                size={24}
                textSize={8}
              />
              <input
                type="text"
                placeholder="Add a comment..."
                class="bg-transparent text-white outline-none w-full focus:bg-white/10 py-1 px-2 rounded-lg transition-colors"
                value={comment()}
                onInput={event => setComment(event.currentTarget.value)}
              />
              <button type="submit" class="bg-white/20 text-white py-1.5 px-2 rounded-lg disabled:bg-white/10 disabled:text-white/50 hover:bg-white/25 focus:bg-white/25 transition-colors"
                disabled={!comment().trim()}
              >
                <MdiSend class="text-xs" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeedFriendsOverview;
