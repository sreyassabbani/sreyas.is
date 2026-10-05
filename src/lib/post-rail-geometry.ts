const DEFAULT_HOVER_WIDTH = 224;
const EDGE_HOVER_WIDTH = 28;
const MIN_HOVER_WIDTH = 8;
const CONTENT_CLEARANCE = 16;

/** Keep the normal gutter target, using a narrow edge when visible content protrudes into that gutter. */
export function postRailHoverWidth(
    proseLeft: number,
    contentLeft: number,
): number {
    const protrudes = contentLeft < proseLeft - 1;
    return Math.max(
        MIN_HOVER_WIDTH,
        Math.min(
            protrudes ? EDGE_HOVER_WIDTH : DEFAULT_HOVER_WIDTH,
            contentLeft - CONTENT_CLEARANCE,
        ),
    );
}

type Clip = { left: number; right: number; top: number; bottom: number };

/** Measure actual visible descendant boxes, including arbitrary HTML, SVG, images and embedded players.
 * Scroll containers clip their children: an oversized image's hidden offscreen portion is not content
 * under the pointer. Descendants may overflow otherwise ordinary wrappers, so inspect the whole tree.
 */
export function visiblePostLeft(post: Element, viewport: Clip): number {
    let left = post.getBoundingClientRect().left;
    const visit = (element: Element, clip: Clip) => {
        const style = getComputedStyle(element);
        if (
            style.display === "none" ||
            Number(style.opacity) === 0 ||
            style.contentVisibility === "hidden"
        ) {
            return;
        }
        const rect = element.getBoundingClientRect();
        const visibleLeft = Math.max(rect.left, clip.left);
        if (
            style.visibility !== "hidden" &&
            style.visibility !== "collapse" &&
            Math.min(rect.right, clip.right) > visibleLeft &&
            Math.min(rect.bottom, clip.bottom) > Math.max(rect.top, clip.top)
        ) {
            left = Math.min(left, visibleLeft);
        }
        const childClip = { ...clip };
        if (style.overflowX !== "visible") {
            childClip.left = Math.max(childClip.left, rect.left);
            childClip.right = Math.min(childClip.right, rect.right);
        }
        if (style.overflowY !== "visible") {
            childClip.top = Math.max(childClip.top, rect.top);
            childClip.bottom = Math.min(childClip.bottom, rect.bottom);
        }
        if (
            childClip.left >= childClip.right ||
            childClip.top >= childClip.bottom
        ) {
            return;
        }
        for (const child of element.children) visit(child, childClip);
    };
    visit(post, viewport);
    return left;
}

export function measurePostRailHoverWidth(post: Element): number {
    return postRailHoverWidth(
        post.getBoundingClientRect().left,
        visiblePostLeft(post, {
            left: 0,
            right: window.innerWidth,
            top: 0,
            bottom: window.innerHeight,
        }),
    );
}
