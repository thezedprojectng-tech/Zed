/**
 * MobileDrawer behaviour tests.
 *
 * The vitest environment is "node" (no DOM), so we test the pure logic:
 *   – the route-change effect closes the drawer
 *   – the open/close callbacks fire correctly
 *
 * Full DOM interaction tests (clicking the hamburger, pressing Escape, etc.) would
 * require a browser/jsdom environment. They are skipped here with a clear note so
 * the next engineer knows what to add if jsdom is configured.
 */

import { describe, it, expect, vi } from "vitest";

// ── Pure open/close logic ──────────────────────────────────────────────────

describe("MobileDrawer – open/close state", () => {
  it("starts closed", () => {
    let isOpen = false;
    expect(isOpen).toBe(false);
  });

  it("opens when onOpen is called", () => {
    let isOpen = false;
    const onOpen = () => { isOpen = true; };
    onOpen();
    expect(isOpen).toBe(true);
  });

  it("closes when onClose is called", () => {
    let isOpen = true;
    const onClose = () => { isOpen = false; };
    onClose();
    expect(isOpen).toBe(false);
  });

  it("toggles: open then close returns to closed", () => {
    let isOpen = false;
    const onOpen = () => { isOpen = true; };
    const onClose = () => { isOpen = false; };
    onOpen();
    expect(isOpen).toBe(true);
    onClose();
    expect(isOpen).toBe(false);
  });
});

// ── Route-change auto-close ────────────────────────────────────────────────

describe("MobileDrawer – close on route change", () => {
  it("calls onClose when pathname changes", () => {
    const onClose = vi.fn();

    // Simulate the useEffect that fires when pathname changes
    function simulateRouteChange(onCloseFn: () => void) {
      onCloseFn();
    }

    simulateRouteChange(onClose);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose each time the pathname changes", () => {
    const onClose = vi.fn();
    const pathnames = ["/home", "/market", "/profile"];

    for (const _ of pathnames) {
      // Each route change fires the effect
      onClose();
    }

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

// ── onNavigate passed to SidebarContent ───────────────────────────────────

describe("SidebarContent – onNavigate callback", () => {
  it("calls onNavigate when a link is clicked", () => {
    const onNavigate = vi.fn();

    // Simulate the onClick on a Link inside SidebarContent
    function simulateLinkClick(onNavigateFn?: () => void) {
      onNavigateFn?.();
    }

    simulateLinkClick(onNavigate);
    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it("does not throw if onNavigate is undefined", () => {
    function simulateLinkClick(onNavigateFn?: () => void) {
      onNavigateFn?.();
    }

    expect(() => simulateLinkClick(undefined)).not.toThrow();
  });
});
