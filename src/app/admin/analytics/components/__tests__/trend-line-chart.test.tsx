import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrendLineChart } from "../TrendLineChart";

describe("TrendLineChart", () => {
  it("renders chart using serialized date strings without crashing", () => {
    render(
      <TrendLineChart
        locale="en"
        data={[
          {
            date: "2025-01-01T12:00:00.000Z",
            totalViews: 10,
            uniqueVisitors: 4,
          },
          {
            date: "2025-01-02T12:00:00.000Z",
            totalViews: 16,
            uniqueVisitors: 7,
          },
        ]}
      />
    );

    expect(screen.getByText("16 PV")).toBeInTheDocument();
    expect(screen.getByText("UV (11)")).toBeInTheDocument();
  });
});
