/**
 * Make DOM removal idempotent for React's commitDeletion.
 *
 * The composer renders its draft as decoration nodes in a visible backdrop.
 * Clearing a long draft unmounts all of them in one commit cycle, and a
 * second commit from another snapshot subscriber can try to remove the same
 * nodes again. React's `commitDeletion` then throws
 * `NotFoundError: Failed to execute 'removeChild' on 'Node'`, which crashes
 * the `conversation.composer.bar` slot entry (the entry abdicates) and
 * permanently removes the message input until a full page reload.
 *
 * The crash is deterministic with a long draft: type several lines, Ctrl+A,
 * Backspace. Removing an already-removed node is a no-op here, so the racing
 * commit converges to the same DOM state instead of throwing.
 *
 * Installed once when the slot renderer is created, before any React commit
 * can run.
 */
export function installDomRemovalIdempotency(): void {
  const patched = Node.prototype.removeChild as unknown as { __dshGuard?: boolean }
  if (patched.__dshGuard) return
  const original = Node.prototype.removeChild
  Node.prototype.removeChild = function (child: Node): Node {
    if (child.parentNode !== this) return child
    return original.call(this, child)
  }
  patched.__dshGuard = true
}
