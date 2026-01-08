import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AuthHeader } from "../auth/auth-header";

const pushMock = vi.fn();

// Mock next-auth
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

import { useSession, signOut } from "next-auth/react";

describe("AuthHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushMock.mockReset();
  });

  it("should show sign-in button when session is loading", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "loading",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    // Component shows sign-in button even during loading (no skeleton)
    const signInButton = screen.getByRole("button");
    expect(signInButton.textContent).toContain("Sign in");
  });

  it("should show sign-in button when user is not authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    const signInButton = screen.getByRole("button");
    expect(signInButton.textContent).toContain("Sign in");
  });

  it("should redirect to login with encoded callback when sign-in button is clicked", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    Object.defineProperty(window, "location", {
      value: {
        pathname: "/posts/test",
        search: "?draft=true",
        hash: "#comments",
      },
      writable: true,
    });

    render(<AuthHeader />);

    const signInButton = screen.getByRole("button");
    fireEvent.click(signInButton);

    const expectedUrl = `/login?callbackUrl=${encodeURIComponent("/posts/test?draft=true#comments")}`;
    expect(pushMock).toHaveBeenCalledWith(expectedUrl);
  });

  it("should show user menu button when authenticated", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    expect(screen.getByLabelText("User menu")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should display user avatar when image is provided", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: "John Doe",
          email: "john@example.com",
          image: "https://example.com/avatar.jpg",
        },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    const avatar = screen.getByAltText("John Doe");
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("should display default avatar when image is null", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    const { container } = render(<AuthHeader />);

    const defaultAvatar = container.querySelector(".bg-stone-200");
    expect(defaultAvatar).toBeInTheDocument();
    expect(defaultAvatar?.textContent).toBe("J");
  });

  it("should open menu on button click", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    const menuButton = screen.getByLabelText("User menu");

    // Menu should be closed initially
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    // Click to open (button only opens menu, doesn't toggle)
    fireEvent.click(menuButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("should show menu items when menu is open", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    const menuButton = screen.getByLabelText("User menu");
    fireEvent.click(menuButton);

    // Component has plain text without emojis
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("should navigate to admin dashboard when clicked", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    const menuButton = screen.getByLabelText("User menu");
    fireEvent.click(menuButton);

    const dashboardLink = screen.getByText("Dashboard");
    expect(dashboardLink.closest("a")).toHaveAttribute("href", "/admin");
  });

  it("should close menu when dashboard link is clicked", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    const menuButton = screen.getByLabelText("User menu");
    fireEvent.click(menuButton);

    const dashboardLink = screen.getByText("Dashboard");
    fireEvent.click(dashboardLink);

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("should call signOut when sign-out is clicked", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    Object.defineProperty(window, "location", {
      value: { pathname: "/posts/test" },
      writable: true,
    });

    render(<AuthHeader />);

    const menuButton = screen.getByLabelText("User menu");
    fireEvent.click(menuButton);

    const signOutButton = screen.getByText("Sign out");
    fireEvent.click(signOutButton);

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/posts/test" });
  });

  it("should close menu on Escape key press", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    const menuButton = screen.getByLabelText("User menu");
    fireEvent.click(menuButton);

    expect(screen.getByRole("menu")).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("should close menu on outside click", async () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    const menuButton = screen.getByLabelText("User menu");
    fireEvent.click(menuButton);

    expect(screen.getByRole("menu")).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  it("should handle arrow key navigation in menu", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    const menuButton = screen.getByLabelText("User menu");
    fireEvent.click(menuButton);

    const menu = screen.getByRole("menu");

    // Test ArrowDown
    fireEvent.keyDown(menu, { key: "ArrowDown" });

    // Test ArrowUp
    fireEvent.keyDown(menu, { key: "ArrowUp" });

    // Menu should still be open
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("should set aria-expanded attribute correctly", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    const menuButton = screen.getByLabelText("User menu");

    expect(menuButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(menuButton);

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });

  it("should display chevron icon with rotation", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    const { container } = render(<AuthHeader />);

    const menuButton = screen.getByLabelText("User menu");
    const chevron = container.querySelector("svg");

    expect(chevron).not.toHaveClass("rotate-180");

    fireEvent.click(menuButton);

    expect(chevron).toHaveClass("rotate-180");
  });

  it("should show 'User' when name is null", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: null, email: "user@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    const { container } = render(<AuthHeader />);

    expect(screen.getByText("User")).toBeInTheDocument();

    const defaultAvatar = container.querySelector(".bg-stone-200");
    expect(defaultAvatar?.textContent).toBe("U");
  });

  it("should show user name in menu button", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "Alice Smith", email: "alice@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
  });

  it("should have proper accessibility attributes", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: { name: "John Doe", email: "john@example.com", image: null },
        expires: "2099-01-01",
      },
      status: "authenticated",
      update: vi.fn(),
    });

    render(<AuthHeader />);

    const menuButton = screen.getByLabelText("User menu");

    expect(menuButton).toHaveAttribute("aria-haspopup", "menu");
    expect(menuButton).toHaveAttribute("aria-expanded");

    fireEvent.click(menuButton);

    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("aria-orientation", "vertical");
  });

  it("should render sign-in button without icon", () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: vi.fn(),
    });

    const { container } = render(<AuthHeader />);

    const signInButton = screen.getByRole("button", { name: /sign in/i });
    expect(signInButton).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
  });
});
