import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LivePhotoPlayer } from "../live-photo-player";

describe("LivePhotoPlayer", () => {
  const mockProps = {
    imageSrc: "/uploads/test-image.jpg",
    videoSrc: "/uploads/test-video.mov",
    alt: "Test Live Photo",
  };

  beforeEach(() => {
    // Mock HTMLVideoElement methods
    HTMLVideoElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLVideoElement.prototype.pause = vi.fn();
  });

  it("should render image and video elements", () => {
    render(<LivePhotoPlayer {...mockProps} />);

    const image = screen.getByAltText("Test Live Photo");
    expect(image).toBeInTheDocument();

    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video?.src).toContain("test-video.mov");
  });

  it("should display LIVE badge", () => {
    render(<LivePhotoPlayer {...mockProps} />);

    const badge = screen.getByText("LIVE");
    expect(badge).toBeInTheDocument();
  });

  it("should show interaction hint initially", () => {
    render(<LivePhotoPlayer {...mockProps} />);

    const hint = screen.getByText("悬停播放");
    expect(hint).toBeInTheDocument();
  });

  it("should play video on mouse enter", async () => {
    render(<LivePhotoPlayer {...mockProps} />);

    const container = screen.getByAltText("Test Live Photo").closest("div");
    expect(container).toBeInTheDocument();

    fireEvent.mouseEnter(container!);

    await waitFor(() => {
      const video = document.querySelector("video");
      expect(video?.play).toHaveBeenCalled();
    });
  });

  it("should pause video and reset on mouse leave", async () => {
    render(<LivePhotoPlayer {...mockProps} />);

    const container = screen.getByAltText("Test Live Photo").closest("div");
    expect(container).toBeInTheDocument();

    fireEvent.mouseEnter(container!);
    await waitFor(() => {
      expect(document.querySelector("video")?.play).toHaveBeenCalled();
    });

    fireEvent.mouseLeave(container!);

    await waitFor(() => {
      const video = document.querySelector("video");
      expect(video?.pause).toHaveBeenCalled();
      expect(video?.currentTime).toBe(0);
    });
  });

  it("should play video on touch start", async () => {
    render(<LivePhotoPlayer {...mockProps} />);

    const container = screen.getByAltText("Test Live Photo").closest("div");
    expect(container).toBeInTheDocument();

    fireEvent.touchStart(container!);

    await waitFor(() => {
      expect(document.querySelector("video")?.play).toHaveBeenCalled();
    });
  });

  it("should pause video on touch end", async () => {
    render(<LivePhotoPlayer {...mockProps} />);

    const container = screen.getByAltText("Test Live Photo").closest("div");
    expect(container).toBeInTheDocument();

    fireEvent.touchStart(container!);
    await waitFor(() => {
      expect(document.querySelector("video")?.play).toHaveBeenCalled();
    });

    fireEvent.touchEnd(container!);

    await waitFor(() => {
      const video = document.querySelector("video");
      expect(video?.pause).toHaveBeenCalled();
      expect(video?.currentTime).toBe(0);
    });
  });

  it("should hide interaction hint when playing", async () => {
    render(<LivePhotoPlayer {...mockProps} />);

    const container = screen.getByAltText("Test Live Photo").closest("div");
    expect(container).toBeInTheDocument();

    const hint = screen.getByText("悬停播放");
    expect(hint).toBeInTheDocument();

    fireEvent.mouseEnter(container!);

    await waitFor(() => {
      expect(screen.queryByText("悬停播放")).not.toBeInTheDocument();
    });
  });

  it("should apply custom className", () => {
    const customClass = "custom-player-class";
    const { container } = render(<LivePhotoPlayer {...mockProps} className={customClass} />);

    // className is on the outer container div
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass(customClass);
  });

  it("should have video with correct attributes", () => {
    render(<LivePhotoPlayer {...mockProps} />);

    const video = document.querySelector("video");
    expect(video).toBeInTheDocument();
    // Check video has src
    expect(video?.src).toContain("test-video.mov");
    // aria-hidden
    expect(video).toHaveAttribute("aria-hidden", "true");
    // Check video classes indicate it's hidden initially
    expect(video).toHaveClass("opacity-0");
  });

  it("should toggle opacity classes based on playing state", async () => {
    const { container: testContainer } = render(<LivePhotoPlayer {...mockProps} />);

    const outerContainer = testContainer.firstChild as HTMLElement;
    const imageWrapper = outerContainer.querySelector("div") as HTMLElement;
    const video = document.querySelector("video");

    // Initially not playing
    expect(imageWrapper).toHaveClass("opacity-100");
    expect(video).toHaveClass("opacity-0");

    // Start playing
    fireEvent.mouseEnter(outerContainer);

    await waitFor(() => {
      expect(imageWrapper).toHaveClass("opacity-0");
      expect(video).toHaveClass("opacity-100");
    });

    // Stop playing
    fireEvent.mouseLeave(outerContainer);

    await waitFor(() => {
      expect(imageWrapper).toHaveClass("opacity-100");
      expect(video).toHaveClass("opacity-0");
    });
  });

  it("should handle multiple rapid interactions", async () => {
    render(<LivePhotoPlayer {...mockProps} />);

    const container = screen.getByAltText("Test Live Photo").closest("div");
    const video = document.querySelector("video");

    // Rapid mouse enter/leave
    fireEvent.mouseEnter(container!);
    fireEvent.mouseLeave(container!);
    fireEvent.mouseEnter(container!);
    fireEvent.mouseLeave(container!);

    await waitFor(() => {
      expect(video?.pause).toHaveBeenCalled();
      expect(video?.currentTime).toBe(0);
    });
  });

  it("should handle video play failure gracefully", async () => {
    HTMLVideoElement.prototype.play = vi.fn().mockRejectedValue(new Error("Play failed"));

    render(<LivePhotoPlayer {...mockProps} />);

    const container = screen.getByAltText("Test Live Photo").closest("div");

    fireEvent.mouseEnter(container!);

    // Should not crash
    await waitFor(() => {
      expect(document.querySelector("video")?.play).toHaveBeenCalled();
    });
  });

  it("should use correct image sizes attribute", () => {
    render(<LivePhotoPlayer {...mockProps} />);

    const image = screen.getByAltText("Test Live Photo");
    expect(image).toHaveAttribute(
      "sizes",
      "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    );
  });

  it("should position LIVE badge in top-right corner", () => {
    render(<LivePhotoPlayer {...mockProps} />);

    const badge = screen.getByText("LIVE");
    expect(badge).toHaveClass("absolute", "top-2", "right-2");
  });

  it("should handle missing video element gracefully", () => {
    const { container } = render(<LivePhotoPlayer {...mockProps} />);

    // Remove video element
    const video = container.querySelector("video");
    video?.remove();

    const playerContainer = screen.getByAltText("Test Live Photo").closest("div");

    // Should not crash
    expect(() => {
      fireEvent.mouseEnter(playerContainer!);
      fireEvent.mouseLeave(playerContainer!);
    }).not.toThrow();
  });
});
