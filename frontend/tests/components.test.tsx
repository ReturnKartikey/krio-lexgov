import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { formatINR, formatDate, truncateText } from "../src/lib/utils";
import { MicroLabel } from "../src/components/common/MicroLabel";
import { HighlightedText } from "../src/components/common/HighlightedText";

describe("Frontend Utilities", () => {
  it("formats Indian Rupee currency correctly", () => {
    expect(formatINR(2500000)).toContain("25 L");
    expect(formatINR(15000000)).toContain("1.50 Cr");
    expect(formatINR(0)).toBe("₹0");
    expect(formatINR(null)).toBe("—");
  });

  it("formats dates properly", () => {
    const formatted = formatDate("2024-03-15");
    expect(formatted).toContain("Mar 15, 2024");
    expect(formatDate(null)).toBe("—");
  });

  it("truncates long strings with ellipsis", () => {
    const text = "This is a very long regulatory description that should be truncated.";
    expect(truncateText(text, 20)).toBe("This is a very long...");
  });
});

describe("UI Components", () => {
  it("renders MicroLabel with proper numbering", () => {
    render(<MicroLabel number="N°01" label="TEST LABEL" />);
    expect(screen.getByText("N°01")).toBeDefined();
    expect(screen.getByText("TEST LABEL")).toBeDefined();
  });

  it("renders HighlightedText with mark tags", () => {
    const { container } = render(
      <HighlightedText text="Adjudication order regarding Reliance" highlight="Reliance" />
    );
    const marks = container.querySelectorAll("mark");
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe("Reliance");
  });
});
