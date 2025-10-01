import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PhotoViewer } from "../photo-viewer";
import type { GalleryImage } from "@/lib/gallery";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock PhotoMetadataPanel
vi.mock("../photo-metadata-panel", () => ({
  PhotoMetadataPanel: ({ image }: any) => (
    <div data-testid="metadata-panel">Metadata for {image.title}</div>
  ),
}));

// Mock LivePhotoPlayer
vi.mock("../live-photo-player", () => ({
  LivePhotoPlayer: ({ imageSrc, videoSrc, alt }: any) => (
    <div data-testid="live-photo-player" data-image={imageSrc} data-video={videoSrc}>
      {alt}
    </div>
  ),
}));

describe("PhotoViewer", () => {
  const baseImage: GalleryImage = {
    id: "img-001",
    title: "Test Photo",
    description: "Test description",
    filePath: "/uploads/test.jpg",
    postId: null,
    createdAt: "2024-01-15T10:30:00Z",
    latitude: 37.7749,
    longitude: -122.4194,
    locationName: "San Francisco",
    city: "San Francisco",
    country: "USA",
    livePhotoVideoPath: null,
    isLivePhoto: false,
    fileSize: 2048000,
    width: 4032,
    height: 3024,
    mimeType: "image/jpeg",
    capturedAt: "2024-01-14T15:00:00Z",
    storageType: "local",
  };

  beforeEach(() => {
    mockPush.mockClear();
  });

  it("should render photo viewer with image", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const image = screen.getByAlt("Test Photo");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/uploads/test.jpg");
  });

  it("should render metadata panel", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const panel = screen.getByTestId("metadata-panel");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveTextContent("Metadata for Test Photo");
  });

  it("should render back button", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const backButton = screen.getByText("返回相册");
    expect(backButton).toBeInTheDocument();
    expect(backButton.closest("a")).toHaveAttribute("href", "/gallery");
  });

  it("should navigate to gallery on Escape key", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(mockPush).toHaveBeenCalledWith("/gallery");
  });

  it("should navigate to previous photo on ArrowLeft key when prevId exists", () => {
    render(<PhotoViewer image={baseImage} prevId="img-prev" nextId={null} />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(mockPush).toHaveBeenCalledWith("/gallery/img-prev");
  });

  it("should not navigate on ArrowLeft when prevId is null", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should navigate to next photo on ArrowRight key when nextId exists", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId="img-next" />);

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(mockPush).toHaveBeenCalledWith("/gallery/img-next");
  });

  it("should not navigate on ArrowRight when nextId is null", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should render previous navigation button when prevId exists", () => {
    render(<PhotoViewer image={baseImage} prevId="img-prev" nextId={null} />);

    const prevButton = screen.getByTitle("上一张 (←)");
    expect(prevButton).toBeInTheDocument();
    expect(prevButton).toHaveAttribute("href", "/gallery/img-prev");
  });

  it("should render disabled previous button when prevId is null", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const prevButton = screen.queryByTitle("上一张 (←)");
    expect(prevButton).not.toBeInTheDocument();

    // Should show disabled button instead
    const container = screen.getByText("返回相册").closest("header");
    expect(container?.querySelectorAll(".border-zinc-800").length).toBeGreaterThan(0);
  });

  it("should render next navigation button when nextId exists", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId="img-next" />);

    const nextButton = screen.getByTitle("下一张 (→)");
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).toHaveAttribute("href", "/gallery/img-next");
  });

  it("should render disabled next button when nextId is null", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const nextButton = screen.queryByTitle("下一张 (→)");
    expect(nextButton).not.toBeInTheDocument();
  });

  it("should render both navigation buttons when both IDs exist", () => {
    render(<PhotoViewer image={baseImage} prevId="img-prev" nextId="img-next" />);

    expect(screen.getByTitle("上一张 (←)")).toBeInTheDocument();
    expect(screen.getByTitle("下一张 (→)")).toBeInTheDocument();
  });

  it("should render LivePhotoPlayer for Live Photos", () => {
    const livePhotoImage: GalleryImage = {
      ...baseImage,
      isLivePhoto: true,
      livePhotoVideoPath: "/uploads/test.mov",
    };

    render(<PhotoViewer image={livePhotoImage} prevId={null} nextId={null} />);

    const player = screen.getByTestId("live-photo-player");
    expect(player).toBeInTheDocument();
    expect(player).toHaveAttribute("data-image", "/uploads/test.jpg");
    expect(player).toHaveAttribute("data-video", "/uploads/test.mov");
  });

  it("should render regular image for non-Live Photos", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    expect(screen.queryByTestId("live-photo-player")).not.toBeInTheDocument();
    expect(screen.getByAlt("Test Photo")).toBeInTheDocument();
  });

  it("should use fallback alt text when title is missing", () => {
    const imageWithoutTitle: GalleryImage = {
      ...baseImage,
      title: null,
    };

    render(<PhotoViewer image={imageWithoutTitle} prevId={null} nextId={null} />);

    expect(screen.getByAlt("照片")).toBeInTheDocument();
  });

  it("should cleanup keyboard event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it("should update keyboard navigation when IDs change", () => {
    const { rerender } = render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(mockPush).not.toHaveBeenCalled();

    rerender(<PhotoViewer image={baseImage} prevId="img-prev" nextId={null} />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(mockPush).toHaveBeenCalledWith("/gallery/img-prev");
  });

  it("should have fixed layout with full viewport", () => {
    const { container } = render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass("fixed", "inset-0", "bg-zinc-950");
  });

  it("should have responsive layout classes", () => {
    const { container } = render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const contentDiv = container.querySelector(".flex.h-full.flex-col");
    expect(contentDiv).toHaveClass("lg:flex-row");
  });

  it("should render header with backdrop blur", () => {
    const { container } = render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const header = container.querySelector("header");
    expect(header).toHaveClass("backdrop-blur-sm", "bg-zinc-950/95");
  });

  it("should render metadata panel as aside with scrollable content", () => {
    const { container } = render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("overflow-y-auto");
  });

  it("should ignore unrelated keyboard events", () => {
    render(<PhotoViewer image={baseImage} prevId="img-prev" nextId="img-next" />);

    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(window, { key: "Space" });
    fireEvent.keyDown(window, { key: "a" });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should handle rapid keyboard navigation", () => {
    render(<PhotoViewer image={baseImage} prevId="img-prev" nextId="img-next" />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "Escape" });

    expect(mockPush).toHaveBeenCalledTimes(3);
    expect(mockPush).toHaveBeenCalledWith("/gallery/img-prev");
    expect(mockPush).toHaveBeenCalledWith("/gallery/img-next");
    expect(mockPush).toHaveBeenCalledWith("/gallery");
  });
});
