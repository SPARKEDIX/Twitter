/**
 * Single source of truth for the app's route table.
 *
 * Previously the nav list lived in `Sidebar.tsx` and the `<Route>` tree in
 * `App.tsx` with nothing tying them together - which is how `/follow` ended up
 * reachable as a route but missing from the sidebar. Both now read from here,
 * and so does the 404 page's route ledger, so a dead end can never list a
 * route that does not exist or omit one that does.
 *
 * `path` is the canonical href. `pattern` is the react-router matcher, which
 * differs only for dynamic segments.
 */

export interface AppRoute {
  /** Canonical href, used for links. */
  path: string;
  /** react-router pattern. */
  pattern: string;
  label: string;
  description: string;
  requiresAuth: boolean;
  /** Dynamic routes need a concrete example to link to. */
  examplePath?: string;
}

export const APP_ROUTES = [
  {
    path: '/',
    pattern: '/',
    label: 'Home',
    description: 'Your timeline, composer and the latest posts',
    requiresAuth: true,
  },
  {
    path: '/explore',
    pattern: '/explore',
    label: 'Explore',
    description: 'Trending topics, categories and who to follow',
    requiresAuth: true,
  },
  {
    path: '/follow',
    pattern: '/follow',
    label: 'Follow',
    description: 'Find accounts worth following',
    requiresAuth: true,
  },
  {
    path: '/notifications',
    pattern: '/notifications',
    label: 'Notifications',
    description: 'Likes, reposts, replies and mentions',
    requiresAuth: true,
  },
  {
    path: '/messages',
    pattern: '/messages',
    label: 'Messages',
    description: 'Direct conversations',
    requiresAuth: true,
  },
  {
    path: '/profile',
    pattern: '/profile/:username',
    label: 'Profile',
    description: 'Posts, replies, media and likes',
    requiresAuth: true,
    examplePath: '/profile/kartiksharma',
  },
  {
    path: '/login',
    pattern: '/login',
    label: 'Sign in',
    description: 'Sign in with email, Google, GitHub or Apple',
    requiresAuth: false,
  },
  {
    path: '/privacy',
    pattern: '/privacy',
    label: 'Privacy policy',
    description: 'What is collected, stored, and shared',
    requiresAuth: false,
  },
  {
    path: '/cookies',
    pattern: '/cookies',
    label: 'Cookie policy',
    description: 'Storage ledger and consent controls',
    requiresAuth: false,
  },
] as const;

/** Legacy paths that still resolve, but only as a redirect to the timeline. */
export const REDIRECTED_PATHS: readonly string[] = ['/bookmarks', '/lists', '/more'] as const;

/** Longest-prefix match, mirroring the Sidebar's active-link logic. */
export const findActiveRoute = (pathname: string): AppRoute | undefined =>
  APP_ROUTES.filter(
    (route) =>
      route.path === pathname ||
      (route.path !== '/' && pathname.startsWith(`${route.path}/`))
  ).sort((a, b) => b.path.length - a.path.length)[0];
