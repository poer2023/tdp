import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GalleryCard } from "../gallery-card";
import type { GalleryImage } from "@/lib/gallery";

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

// Mock LivePhotoPlayer component
vi.mock("../live-photo-player", () => ({
  LivePhotoPlayer: ({ imageSrc, videoSrc, alt }: any) => (
    <div data-testid="live-photo-player" data-image={imageSrc} data-video={videoSrc}>
      {alt}
    </div>
  ),
}));

describe("GalleryCard", () => {
  const baseImage: GalleryImage = {
    id: "img-001",
    title: "Test Photo",
    description: "This is a test photo description",
    filePath: "/uploads/test.jpg",
    postId: null,
    createdAt: "2024-01-15T10:30:00Z",
    latitude: 37.7749,
    longitude: -122.4194,
    locationName: "San Francisco, CA",
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

  it("should render card with title and description", () => {
    render(<GalleryCard image={baseImage} />);

    expect(screen.getByText("Test Photo")).toBeInTheDocument();
    expect(screen.getByText("This is a test photo description")).toBeInTheDocument();
  });

  it("should render image when not a Live Photo", () => {
    render(<GalleryCard image={baseImage} />);

    const image = screen.getByAlt("Test Photo");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/uploads/test.jpg");
  });

  it("should render LivePhotoPlayer when isLivePhoto is true", () => {
    const livePhotoImage: GalleryImage = {
      ...baseImage,
      isLivePhoto: true,
      livePhotoVideoPath: "/uploads/test.mov",
    };

    render(<GalleryCard image={livePhotoImage} />);

    const player = screen.getByTestId("live-photo-player");
    expect(player).toBeInTheDocument();
    expect(player).toHaveAttribute("data-image", "/uploads/test.jpg");
    expect(player).toHaveAttribute("data-video", "/uploads/test.mov");
  });

  it("should display location information when available", () => {
    render(<GalleryCard image={baseImage} />);

    expect(screen.getByText("San Francisco, USA")).toBeInTheDocument();
  });

  it("should display locationName when city and country are missing", () => {
    const imageWithoutCityCountry: GalleryImage = {
      ...baseImage,
      city: null,
      country: null,
      locationName: "Golden Gate Park",
    };

    render(<GalleryCard image={imageWithoutCityCountry} />);

    expect(screen.getByText("Golden Gate Park")).toBeInTheDocument();
  });

  it("should display fallback location text when only coordinates exist", () => {
    const imageWithCoordinatesOnly: GalleryImage = {
      ...baseImage,
      city: null,
      country: null,
      locationName: null,
    };

    render(<GalleryCard image={imageWithCoordinatesOnly} />);

    expect(screen.getByText("位置信息")).toBeInTheDocument();
  });

  it("should not display location section when no location data", () => {
    const imageWithoutLocation: GalleryImage = {
      ...baseImage,
      latitude: null,
      longitude: null,
      locationName: null,
      city: null,
      country: null,
    };

    render(<GalleryCard image={imageWithoutLocation} />);

    expect(screen.queryByText("位置信息")).not.toBeInTheDocument();
    expect(screen.queryByText("San Francisco, USA")).not.toBeInTheDocument();
  });

  it("should display captured date in Chinese format", () => {
    render(<GalleryCard image={baseImage} />);

    expect(screen.getByText("2024年1月14日")).toBeInTheDocument();
  });

  it("should use createdAt when capturedAt is missing", () => {
    const imageWithoutCapturedAt: GalleryImage = {
      ...baseImage,
      capturedAt: null,
    };

    render(<GalleryCard image={imageWithoutCapturedAt} />);

    expect(screen.getByText("2024年1月15日")).toBeInTheDocument();
  });

  it("should display image dimensions when available", () => {
    render(<GalleryCard image={baseImage} />);

    expect(screen.getByText(/4032 × 3024/)).toBeInTheDocument();
  });

  it("should display file size with dimensions", () => {
    render(<GalleryCard image={baseImage} />);

    expect(screen.getByText(/4032 × 3024 · 2.0 MB/)).toBeInTheDocument();
  });

  it("should not display dimensions when width or height is missing", () => {
    const imageWithoutDimensions: GalleryImage = {
      ...baseImage,
      width: null,
      height: null,
    };

    render(<GalleryCard image={imageWithoutDimensions} />);

    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });

  it("should display file size in KB for smaller files", () => {
    const smallImage: GalleryImage = {
      ...baseImage,
      fileSize: 512000, // 500 KB
    };

    render(<GalleryCard image={smallImage} />);

    expect(screen.getByText(/500.0 KB/)).toBeInTheDocument();
  });

  it("should display file size in bytes for very small files", () => {
    const tinyImage: GalleryImage = {
      ...baseImage,
      fileSize: 512, // 512 B
    };

    render(<GalleryCard image={tinyImage} />);

    expect(screen.getByText(/512 B/)).toBeInTheDocument();
  });

  it("should display default title when title is missing", () => {
    const imageWithoutTitle: GalleryImage = {
      ...baseImage,
      title: null,
    };

    render(<GalleryCard image={imageWithoutTitle} />);

    expect(screen.getByText("未命名照片")).toBeInTheDocument();
  });

  it("should not display description section when description is missing", () => {
    const imageWithoutDescription: GalleryImage = {
      ...baseImage,
      description: null,
    };

    render(<GalleryCard image={imageWithoutDescription} />);

    expect(screen.queryByText(/This is a test/)).not.toBeInTheDocument();
  });

  it("should render as a link to photo detail page", () => {
    render(<GalleryCard image={baseImage} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/gallery/img-001");
  });

  it("should have proper article semantic structure", () => {
    render(<GalleryCard image={baseImage} />);

    const article = screen.getByRole("article");
    expect(article).toBeInTheDocument();
  });

  it("should have time element with proper datetime attribute", () => {
    render(<GalleryCard image={baseImage} />);

    const timeElement = screen.getByText("2024年1月14日");
    expect(timeElement.tagName).toBe("TIME");
    expect(timeElement).toHaveAttribute("datetime", expect.stringContaining("2024-01-14"));
  });

  it("should render location icon SVG", () => {
    render(<GalleryCard image={baseImage} />);

    const locationSection = screen.getByText("San Francisco, USA").parentElement;
    expect(locationSection?.querySelector("svg")).toBeInTheDocument();
  });

  it("should render date icon SVG", () => {
    render(<GalleryCard image={baseImage} />);

    const dateSection = screen.getByText("2024年1月14日").parentElement;
    expect(dateSection?.querySelector("svg")).toBeInTheDocument();
  });

  it("should render image icon SVG when dimensions are present", () => {
    render(<GalleryCard image={baseImage} />);

    const dimensionSection = screen.getByText(/4032 × 3024/).parentElement;
    expect(dimensionSection?.querySelector("svg")).toBeInTheDocument();
  });

  it("should truncate long descriptions with line-clamp", () => {
    const imageWithLongDescription: GalleryImage = {
      ...baseImage,
      description:
        "This is a very long description that should be truncated after two lines. It contains a lot of text to test the line-clamp functionality. This text should not be fully visible in the card view.",
    };

    render(<GalleryCard image={imageWithLongDescription} />);

    const description = screen.getByText(/This is a very long description/);
    expect(description).toHaveClass("line-clamp-2");
  });

  it("should handle minimal image data", () => {
    const minimalImage: GalleryImage = {
      id: "min-001",
      title: null,
      description: null,
      filePath: "/uploads/minimal.jpg",
      postId: null,
      createdAt: "2024-01-15T10:30:00Z",
      latitude: null,
      longitude: null,
      locationName: null,
      city: null,
      country: null,
      livePhotoVideoPath: null,
      isLivePhoto: false,
      fileSize: null,
      width: null,
      height: null,
      mimeType: null,
      capturedAt: null,
      storageType: "local",
    };

    render(<GalleryCard image={minimalImage} />);

    expect(screen.getByText("未命名照片")).toBeInTheDocument();
    expect(screen.getByText("2024年1月15日")).toBeInTheDocument();
  });

  it("should apply hover transition classes", () => {
    const { container } = render(<GalleryCard image={baseImage} />);

    const article = container.querySelector("article");
    expect(article).toHaveClass("transition-all", "duration-150");
  });
});
