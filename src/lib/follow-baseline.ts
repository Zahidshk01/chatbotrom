/** Deterministic baseline follower/following counts derived from a stable id.
 *  Ensures every user (including seeded handles) shows a healthy social graph
 *  even before real follows exist. Same id always returns the same numbers. */

function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function baselineFollowCounts(seed: string): { followers: number; following: number } {
  const h1 = hash("f:" + seed);
  const h2 = hash("g:" + seed);
  // followers: 2,500 – 82,500
  const followers = 2500 + (h1 % 80000);
  // following: 120 – 1,120
  const following = 120 + (h2 % 1000);
  return { followers, following };
}
