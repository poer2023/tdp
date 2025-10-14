import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TopPagesCard } from "../top-pages-card";

describe("TopPagesCard", () => {
  it("formats ranges and renders serialized dates", () => {
    render(
      <TopPagesCard
        locale="en"
        data={{
          "7d": [{ path: "/posts/test", label: "Test Post", views: 120 }],
          "30d": [],
        }}
        totals={{ "7d": 120, "30d": 0 }}
        ranges={{
          "7d": {
            from: "2025-01-01T12:00:00.000Z",
            to: "2025-01-07T12:00:00.000Z",
          },
          "30d": {
            from: "2024-12-09T12:00:00.000Z",
            to: "2025-01-07T12:00:00.000Z",
          },
        }}
        deltas={{ "7d": 10, "30d": null }}
      />
    );

    expect(screen.getByText("Page Views")).toBeInTheDocument();
    expect(screen.getByText("Jan 01, 2025")).toBeInTheDocument();
    expect(screen.getByText("Jan 07, 2025")).toBeInTheDocument();
    expect(screen.getByLabelText("Test Post: 120 views (100.0%)")).toBeInTheDocument();
  });
});
