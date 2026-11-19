// -----------------------------------------------------------------------
// FILM SETTINGS
// Every number you might want to tweak about how the home page moves lives
// here. Change one, save, and the dev server reloads.
// -----------------------------------------------------------------------

/** How long the glide from one step to the next takes, in seconds. */
export const STEP_SECONDS = 2.8;

/** How long a link click (e.g. "Let's talk") takes to glide to its scene, in seconds. */
export const JUMP_SECONDS = 2.2;

/**
 * Inside each step's slice of scroll (0 = start, 1 = end):
 * - words start forming at 0 and must be fully formed by IN_END,
 * - the page stops at 0.5 (the step's marker), so IN_END must be below it,
 * - words start leaving at OUT_START.
 */
export const IN_END = 0.46;
export const OUT_START = 0.6;

/** How blurred a headline is before it forms, and as it leaves. */
export const FORM_BLUR = 18;

/** Size of one background block in the colour wipe between scenes, in px. */
export const WIPE_CELL = 44;

/** Size of one block in the text pixel reveal, in px. */
export const TEXT_BLOCK = 12;

/** How quickly the particles catch up with the scroll (smaller = slower, smoother). */
export const PARTICLE_FOLLOW = 0.004;

/** The intro word's particles: how many drift off like dust (0-1). */
export const DUST = 0.08;
