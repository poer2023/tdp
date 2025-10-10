import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhotoMetadataPanel } from "../photo-metadata-panel";
import type { GalleryImage } from "@/lib/gallery";

// Mock react-leaflet components
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children, center }: { children: React.ReactNode; center: [number, number] }) => (
    <div data-testid="map-container" data-center={JSON.stringify(center)}>
      {children}
    </div>
  ),
  TileLayer: ({ url }: { url: string }) => <div data-testid="tile-layer" data-url={url} />,
  Marker: ({ position }: { position: [number, number] }) => (
    <div data-testid="marker" data-position={JSON.stringify(position)} />
  ),
}));

// Mock next/dynamic to synchronously return mocked react-leaflet components
vi.mock("next/dynamic", () => ({
  default: (importFunc: () => Promise<{ default: unknown } | Record<string, unknown>>) => {
    // Simply return the component directly from react-leaflet mock
    // next/dynamic will be bypassed and components will be rendered synchronously
    const funcString = importFunc.toString();

    if (funcString.includes("MapContainer")) {
      const MapContainerMock = ({
        children,
        center,
      }: {
        children: React.ReactNode;
        center: [number, number];
      }) => (
        <div data-testid="map-container" data-center={JSON.stringify(center)}>
          {children}
        </div>
      );
      MapContainerMock.displayName = "MapContainerMock";
      return MapContainerMock;
    }
    if (funcString.includes("TileLayer")) {
      const TileLayerMock = ({ url }: { url: string }) => (
        <div data-testid="tile-layer" data-url={url} />
      );
      TileLayerMock.displayName = "TileLayerMock";
      return TileLayerMock;
    }
    if (funcString.includes("Marker")) {
      const MarkerMock = ({ position }: { position: [number, number] }) => (
        <div data-testid="marker" data-position={JSON.stringify(position)} />
      );
      MarkerMock.displayName = "MarkerMock";
      return MarkerMock;
    }

    // Fallback: return a placeholder
    const PlaceholderMock = () => null;
    PlaceholderMock.displayName = "PlaceholderMock";
    return PlaceholderMock;
  },
}));

describe("PhotoMetadataPanel", () => {
  const baseImage: GalleryImage = {
    id: "img-001",
    title: "Test Photo",
    description: "This is a test photo description",
    filePath: "/uploads/test-photo.jpg",
    postId: null,
    createdAt: "2024-01-15T10:30:00Z",
    latitude: 37.7749,
    longitude: -122.4194,
    locationName: "Golden Gate Park, San Francisco",
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

  it("should render title and description", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText("Test Photo")).toBeInTheDocument();
    expect(screen.getByText("This is a test photo description")).toBeInTheDocument();
  });

  it("should display default title when title is missing", () => {
    const imageWithoutTitle: GalleryImage = {
      ...baseImage,
      title: null,
    };

    render(<PhotoMetadataPanel image={imageWithoutTitle} />);

    expect(screen.getByText("未命名照片")).toBeInTheDocument();
  });

  it("should not display description section when description is missing", () => {
    const imageWithoutDescription: GalleryImage = {
      ...baseImage,
      description: null,
    };

    render(<PhotoMetadataPanel image={imageWithoutDescription} />);

    expect(screen.queryByText(/This is a test/)).not.toBeInTheDocument();
  });

  it("should display location map when coordinates are available", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText("位置信息")).toBeInTheDocument();
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByTestId("marker")).toBeInTheDocument();
  });

  it("should not display location section when coordinates are missing", () => {
    const imageWithoutLocation: GalleryImage = {
      ...baseImage,
      latitude: null,
      longitude: null,
    };

    render(<PhotoMetadataPanel image={imageWithoutLocation} />);

    expect(screen.queryByText("位置信息")).not.toBeInTheDocument();
    expect(screen.queryByTestId("map-container")).not.toBeInTheDocument();
  });

  it("should display city and country", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText("San Francisco, USA")).toBeInTheDocument();
  });

  it("should display location name", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText("Golden Gate Park, San Francisco")).toBeInTheDocument();
  });

  it("should display coordinates with 6 decimal places", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText("37.774900, -122.419400")).toBeInTheDocument();
  });

  it("should display file name", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText("test-photo.jpg")).toBeInTheDocument();
  });

  it("should display file size in MB", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText("2.0 MB")).toBeInTheDocument();
  });

  it("should display file size in KB for smaller files", () => {
    const smallImage: GalleryImage = {
      ...baseImage,
      fileSize: 512000,
    };

    render(<PhotoMetadataPanel image={smallImage} />);

    expect(screen.getByText("500.0 KB")).toBeInTheDocument();
  });

  it("should display file size in bytes for very small files", () => {
    const tinyImage: GalleryImage = {
      ...baseImage,
      fileSize: 512,
    };

    render(<PhotoMetadataPanel image={tinyImage} />);

    expect(screen.getByText("512 B")).toBeInTheDocument();
  });

  it("should display unknown for missing file size", () => {
    const imageWithoutSize: GalleryImage = {
      ...baseImage,
      fileSize: null,
    };

    render(<PhotoMetadataPanel image={imageWithoutSize} />);

    expect(screen.getByText("未知")).toBeInTheDocument();
  });

  it("should display image dimensions", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText("4032 × 3024")).toBeInTheDocument();
  });

  it("should not display dimensions when missing", () => {
    const imageWithoutDimensions: GalleryImage = {
      ...baseImage,
      width: null,
      height: null,
    };

    render(<PhotoMetadataPanel image={imageWithoutDimensions} />);

    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });

  it("should display MIME type format", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText("jpeg")).toBeInTheDocument();
  });

  it("should display HEIC format correctly", () => {
    const heicImage: GalleryImage = {
      ...baseImage,
      mimeType: "image/heic",
    };

    render(<PhotoMetadataPanel image={heicImage} />);

    expect(screen.getByText("heic")).toBeInTheDocument();
  });

  it("should not display format section when MIME type is missing", () => {
    const imageWithoutMimeType: GalleryImage = {
      ...baseImage,
      mimeType: null,
    };

    render(<PhotoMetadataPanel image={imageWithoutMimeType} />);

    expect(screen.queryByText("格式")).not.toBeInTheDocument();
  });

  it("should display captured date in Chinese format", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText(/2024年1月14日/)).toBeInTheDocument();
  });

  it("should display upload date", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText(/2024年1月15日/)).toBeInTheDocument();
  });

  it("should not display captured date section when missing", () => {
    const imageWithoutCapturedAt: GalleryImage = {
      ...baseImage,
      capturedAt: null,
    };

    render(<PhotoMetadataPanel image={imageWithoutCapturedAt} />);

    // Should still show upload time but not captured time
    const capturedTimeLabel = screen.queryByText("拍摄时间");
    expect(capturedTimeLabel).not.toBeInTheDocument();
  });

  it("should display Live Photo section when applicable", () => {
    const livePhotoImage: GalleryImage = {
      ...baseImage,
      isLivePhoto: true,
      livePhotoVideoPath: "/uploads/test-video.mov",
    };

    render(<PhotoMetadataPanel image={livePhotoImage} />);

    expect(screen.getByText("Live Photo")).toBeInTheDocument();
    expect(screen.getByText(/此照片包含动态视频内容/)).toBeInTheDocument();
  });

  it("should render download button for Live Photo video", () => {
    const livePhotoImage: GalleryImage = {
      ...baseImage,
      isLivePhoto: true,
      livePhotoVideoPath: "/uploads/test-video.mov",
    };

    render(<PhotoMetadataPanel image={livePhotoImage} />);

    const downloadButton = screen.getByText("下载视频");
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton.closest("a")).toHaveAttribute("href", "/uploads/test-video.mov");
    expect(downloadButton.closest("a")).toHaveAttribute("download");
  });

  it("should not display Live Photo section when not a Live Photo", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.queryByText("Live Photo")).not.toBeInTheDocument();
    expect(screen.queryByText("下载视频")).not.toBeInTheDocument();
  });

  it("should display technical footer note", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText(/元数据由 EXIF 自动提取/)).toBeInTheDocument();
    expect(screen.getByText(/OpenStreetMap 逆地理编码服务/)).toBeInTheDocument();
  });

  it("should display storage type in footer", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByText(/存储方式：local/)).toBeInTheDocument();
  });

  it("should display S3 storage type", () => {
    const s3Image: GalleryImage = {
      ...baseImage,
      storageType: "s3",
    };

    render(<PhotoMetadataPanel image={s3Image} />);

    expect(screen.getByText(/存储方式：s3/)).toBeInTheDocument();
  });

  it("should not mention geocoding in footer when no location", () => {
    const imageWithoutLocation: GalleryImage = {
      ...baseImage,
      latitude: null,
      longitude: null,
    };

    render(<PhotoMetadataPanel image={imageWithoutLocation} />);

    expect(screen.queryByText(/OpenStreetMap/)).not.toBeInTheDocument();
  });

  it("should have proper semantic structure", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    expect(screen.getByRole("heading", { name: "Test Photo" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThan(0);
  });

  it("should use definition lists for metadata", () => {
    const { container } = render(<PhotoMetadataPanel image={baseImage} />);

    const dlElements = container.querySelectorAll("dl");
    expect(dlElements.length).toBeGreaterThan(0);

    const dtElements = container.querySelectorAll("dt");
    const ddElements = container.querySelectorAll("dd");
    expect(dtElements.length).toBeGreaterThan(0);
    expect(ddElements.length).toBeGreaterThan(0);
  });

  it("should render map with correct center coordinates", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    const mapContainer = screen.getByTestId("map-container");
    expect(mapContainer).toHaveAttribute("data-center", JSON.stringify([37.7749, -122.4194]));
  });

  it("should render marker at correct position", () => {
    render(<PhotoMetadataPanel image={baseImage} />);

    const marker = screen.getByTestId("marker");
    expect(marker).toHaveAttribute("data-position", JSON.stringify([37.7749, -122.4194]));
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

    render(<PhotoMetadataPanel image={minimalImage} />);

    expect(screen.getByText("未命名照片")).toBeInTheDocument();
    expect(screen.getByText("minimal.jpg")).toBeInTheDocument();
  });

  it("should format file name from complex path", () => {
    const imageWithComplexPath: GalleryImage = {
      ...baseImage,
      filePath: "/api/uploads/gallery/subfolder/complex-file-name.heic",
    };

    render(<PhotoMetadataPanel image={imageWithComplexPath} />);

    expect(screen.getByText("complex-file-name.heic")).toBeInTheDocument();
  });
});
