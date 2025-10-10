import { describe, it, expect, vi, beforeEach, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
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
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    <img src={src} alt={alt} {...props} />
  ),
}));

// Mock PhotoMetadataPanel
vi.mock("../photo-metadata-panel", () => ({
  PhotoMetadataPanel: ({ image }: { image: { title: string } }) => (
    <div data-testid="metadata-panel">Metadata for {image.title}</div>
  ),
}));

// Mock LivePhotoPlayer
vi.mock("../live-photo-player", () => ({
  LivePhotoPlayer: ({
    imageSrc,
    videoSrc,
    alt,
  }: {
    imageSrc: string;
    videoSrc: string;
    alt: string;
  }) => (
    <div data-testid="live-photo-player" data-image={imageSrc} data-video={videoSrc}>
      {alt}
    </div>
  ),
}));

class MockXHR {
  static instances: MockXHR[] = [];
  responseType = "";
  status = 200;
  response: Blob | null = null;
  onload: ((this: XMLHttpRequest, ev: Event) => unknown) | null = null;
  onprogress:
    | ((
        this: XMLHttpRequest,
        ev: Event & { loaded?: number; total?: number; lengthComputable?: boolean }
      ) => unknown)
    | null = null;
  onerror: ((this: XMLHttpRequest, ev: Event) => unknown) | null = null;
  onabort: ((this: XMLHttpRequest, ev: Event) => unknown) | null = null;
  open = vi.fn();
  send = vi.fn(() => {
    MockXHR.instances.push(this);
  });
  abort = vi.fn(() => {
    this.onabort?.(new Event("abort"));
  });
}

let originalXHR: typeof XMLHttpRequest | undefined;
let originalCreateObjectURL: typeof URL.createObjectURL | undefined;
let originalRevokeObjectURL: typeof URL.revokeObjectURL | undefined;
let originalSessionStorage: Storage | undefined;
const createObjectURLSpy = vi.fn(() => "blob:mock-url");
const revokeObjectURLSpy = vi.fn();
const storageMock = (() => {
  let data: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => (key in data ? data[key] : null)),
    setItem: vi.fn((key: string, value: string) => {
      data[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete data[key];
    }),
    clear: vi.fn(() => {
      data = {};
    }),
  };
})();

beforeAll(() => {
  originalXHR = window.XMLHttpRequest;
  Object.defineProperty(window, "XMLHttpRequest", {
    configurable: true,
    writable: true,
    value: MockXHR,
  });

  originalCreateObjectURL = URL.createObjectURL;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: createObjectURLSpy,
  });

  originalRevokeObjectURL = URL.revokeObjectURL;
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: revokeObjectURLSpy,
  });

  originalSessionStorage = window.sessionStorage;
  Object.defineProperty(window, "sessionStorage", {
    configurable: true,
    writable: true,
    value: storageMock as unknown as Storage,
  });
});

afterAll(() => {
  Object.defineProperty(window, "XMLHttpRequest", {
    value: originalXHR,
  });
  if (originalCreateObjectURL) {
    Object.defineProperty(URL, "createObjectURL", {
      value: originalCreateObjectURL,
    });
  }
  if (originalRevokeObjectURL) {
    Object.defineProperty(URL, "revokeObjectURL", {
      value: originalRevokeObjectURL,
    });
  }
  if (originalSessionStorage) {
    Object.defineProperty(window, "sessionStorage", {
      value: originalSessionStorage,
    });
  }
});

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
    MockXHR.instances = [];
    createObjectURLSpy.mockClear();
    revokeObjectURLSpy.mockClear();
    storageMock.clear();
    storageMock.setItem.mockClear();
    storageMock.getItem.mockClear();
    storageMock.removeItem.mockClear();
    storageMock.clear.mockClear();
  });

  afterEach(() => {
    MockXHR.instances = [];
  });

  it("prefers webp thumbnails in the film strip when available", () => {
    render(
      <PhotoViewer
        image={baseImage}
        prevId={null}
        nextId={null}
        thumbnails={[
          {
            id: "img-001",
            filePath: "/uploads/test.jpg",
            smallThumbPath: "/uploads/test_small.webp",
          },
          {
            id: "img-002",
            filePath: "/uploads/second.jpg",
          },
        ]}
        currentId="img-001"
      />
    );

    const thumbs = screen.getAllByAltText("thumb");
    expect(thumbs[0]).toHaveAttribute("src", "/uploads/test_small.webp");
    expect(thumbs[0]).toHaveAttribute("loading", "lazy");
    expect(thumbs[1]).toHaveAttribute("src", "/uploads/second.jpg");
  });

  it("should render photo viewer with image", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const image = screen.getByAltText("Test Photo");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/uploads/test.jpg");
  });

  it("promotes medium image to original once download finishes", async () => {
    render(
      <PhotoViewer
        image={{
          ...baseImage,
          mediumPath: "/uploads/test_medium.webp",
        }}
        prevId={null}
        nextId={null}
      />
    );

    const image = screen.getByAltText("Test Photo");
    expect(image).toHaveAttribute("src", "/uploads/test_medium.webp");

    await waitFor(() => expect(MockXHR.instances.length).toBeGreaterThan(0));
    const instance = MockXHR.instances.at(-1);
    expect(instance).toBeDefined();
    expect(instance?.open).toHaveBeenCalledWith("GET", "/uploads/test.jpg", true);
    if (instance) {
      instance.onprogress?.({
        lengthComputable: true,
        loaded: 350000,
        total: 700000,
      } as Event & { loaded: number; total: number; lengthComputable: boolean });
      instance.response = new Blob([new Uint8Array(10)], { type: "image/jpeg" });
      instance.onload?.(new Event("load"));
    }

    await waitFor(() => {
      expect(image.getAttribute("src")).toBe("blob:mock-url");
    });
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
  });

  it("shows progress indicator while original is downloading", async () => {
    render(
      <PhotoViewer
        image={{
          ...baseImage,
          mediumPath: "/uploads/test_medium.webp",
        }}
        prevId={null}
        nextId={null}
      />
    );

    await waitFor(() => expect(MockXHR.instances.length).toBeGreaterThan(0));
    const instance = MockXHR.instances.at(-1);
    expect(instance).toBeDefined();

    // Trigger progress update with act()
    await act(async () => {
      instance?.onprogress?.({
        lengthComputable: true,
        loaded: 102400,
        total: 204800,
      } as Event & { loaded: number; total: number; lengthComputable: boolean });
    });

    // Wait for progress indicator to appear and check percentage
    await waitFor(
      () => {
        expect(screen.getByText(/正在加载图片 50%/)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
    expect(screen.getByText("0.10 MB / 0.20 MB")).toBeInTheDocument();

    await act(async () => {
      instance!.response = new Blob([new Uint8Array(10)], { type: "image/jpeg" });
      instance!.onload?.(new Event("load"));
    });

    await waitFor(() => {
      expect(screen.queryByText(/正在加载图片/)).not.toBeInTheDocument();
    });
  });

  it("should render metadata panel", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const panel = screen.getByTestId("metadata-panel");
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveTextContent("Metadata for Test Photo");
  });

  it("should render back button", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const backButton = screen.getByTitle("返回相册");
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute("href", "/zh/gallery");
  });

  it("should navigate to gallery on Escape key", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(mockPush).toHaveBeenCalledWith("/zh/gallery");
  });

  it("should navigate to previous photo on ArrowLeft key when prevId exists", () => {
    render(<PhotoViewer image={baseImage} prevId="img-prev" nextId={null} />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(mockPush).toHaveBeenCalledWith("/zh/gallery/img-prev");
  });

  it("should not navigate on ArrowLeft when prevId is null", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should navigate to next photo on ArrowRight key when nextId exists", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId="img-next" />);

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(mockPush).toHaveBeenCalledWith("/zh/gallery/img-next");
  });

  it("should not navigate on ArrowRight when nextId is null", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    fireEvent.keyDown(window, { key: "ArrowRight" });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should render previous navigation button when prevId exists", () => {
    render(
      <PhotoViewer
        image={baseImage}
        prevId="img-prev"
        nextId={null}
        thumbnails={[
          { id: "img-prev", filePath: "/prev.jpg" },
          { id: "img-001", filePath: "/uploads/test.jpg" },
        ]}
        currentId="img-001"
      />
    );

    const prevButton = screen.getByTitle("上一张");
    expect(prevButton).toBeInTheDocument();
    expect(prevButton).toHaveAttribute("href", "/zh/gallery/img-prev");
  });

  it("should not render previous button when prevId is null", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const prevButton = screen.queryByTitle("上一张");
    expect(prevButton).not.toBeInTheDocument();
  });

  it("should render next navigation button when nextId exists", () => {
    render(
      <PhotoViewer
        image={baseImage}
        prevId={null}
        nextId="img-next"
        thumbnails={[
          { id: "img-001", filePath: "/uploads/test.jpg" },
          { id: "img-next", filePath: "/next.jpg" },
        ]}
        currentId="img-001"
      />
    );

    const nextButton = screen.getByTitle("下一张");
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).toHaveAttribute("href", "/zh/gallery/img-next");
  });

  it("stores slide direction when navigating forward", () => {
    render(
      <PhotoViewer
        image={baseImage}
        prevId={null}
        nextId="img-next"
        thumbnails={[
          { id: "img-001", filePath: "/uploads/test.jpg" },
          { id: "img-next", filePath: "/next.jpg" },
        ]}
        currentId="img-001"
      />
    );

    fireEvent.click(screen.getByTitle("下一张"));

    expect(storageMock.setItem).toHaveBeenCalledWith("gallery-slide-direction", expect.any(String));
    const storedValue = storageMock.setItem.mock.calls.at(-1)?.[1];
    expect(storedValue).toBeDefined();
    const parsed = JSON.parse(storedValue as string);
    expect(parsed).toMatchObject({
      direction: "next",
      fromSrc: "/uploads/test.jpg",
    });
  });

  it("should render disabled next button when nextId is null", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const nextButton = screen.queryByTitle("下一张");
    expect(nextButton).not.toBeInTheDocument();
  });

  it("should render both navigation buttons when both IDs exist", () => {
    render(
      <PhotoViewer
        image={baseImage}
        prevId="img-prev"
        nextId="img-next"
        thumbnails={[
          { id: "img-prev", filePath: "/prev.jpg" },
          { id: "img-001", filePath: "/uploads/test.jpg" },
          { id: "img-next", filePath: "/next.jpg" },
        ]}
        currentId="img-001"
      />
    );

    expect(screen.getByTitle("上一张")).toBeInTheDocument();
    expect(screen.getByTitle("下一张")).toBeInTheDocument();
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
    expect(screen.getByAltText("Test Photo")).toBeInTheDocument();
  });

  it("should use fallback alt text when title is missing", () => {
    const imageWithoutTitle: GalleryImage = {
      ...baseImage,
      title: null,
    };

    render(<PhotoViewer image={imageWithoutTitle} prevId={null} nextId={null} />);

    expect(screen.getByAltText("未命名照片")).toBeInTheDocument();
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
    expect(mockPush).toHaveBeenCalledWith("/zh/gallery/img-prev");
  });

  it("should have fixed layout with full viewport", () => {
    const { container } = render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass("fixed");
    expect(mainDiv).toHaveClass("inset-0");
  });

  it("should have responsive layout classes", () => {
    const { container } = render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    const contentDiv = container.querySelector(".flex.h-full.flex-col");
    expect(contentDiv).toHaveClass("lg:flex-row");
  });

  it("should render toolbar with backdrop blur", () => {
    render(<PhotoViewer image={baseImage} prevId={null} nextId={null} />);

    // Back button has backdrop-blur class
    const backButton = screen.getByTitle("返回相册");
    expect(backButton).toHaveClass("backdrop-blur");
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
    expect(mockPush).toHaveBeenCalledWith("/zh/gallery/img-prev");
    expect(mockPush).toHaveBeenCalledWith("/zh/gallery/img-next");
    expect(mockPush).toHaveBeenCalledWith("/zh/gallery");
  });
});
