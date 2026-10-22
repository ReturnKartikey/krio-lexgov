import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { formatINR, formatDate, truncateText } from "../src/lib/utils";
import { MicroLabel } from "../src/components/common/MicroLabel";
import { HighlightedText } from "../src/components/common/HighlightedText";
import { ErrorState } from "../src/components/common/ErrorState";
import { getAdminApiKey, setAdminApiKey, resetAdminApiKey } from "../src/lib/api";

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

  it("manages administrative API keys with localStorage fallback", () => {
    resetAdminApiKey();
    expect(getAdminApiKey()).toBe("krio_admin_secret_key_change_me");

    setAdminApiKey("custom_secret_key_999");
    expect(getAdminApiKey()).toBe("custom_secret_key_999");

    resetAdminApiKey();
    expect(getAdminApiKey()).toBe("krio_admin_secret_key_change_me");
  });
});

describe("UI Components", () => {
  it("renders MicroLabel safely without errors", () => {
    const { container } = render(<MicroLabel number="N°01" label="TEST LABEL" />);
    expect(container).toBeDefined();
  });

  it("renders HighlightedText with mark tags", () => {
    const { container } = render(
      <HighlightedText text="Adjudication order regarding Reliance" highlight="Reliance" />
    );
    const marks = container.querySelectorAll("mark");
    expect(marks.length).toBe(1);
    expect(marks[0].textContent).toBe("Reliance");
  });

  it("renders ErrorState and handles retry callback", () => {
    const handleReset = vi.fn();
    const testError = Object.assign(new Error("Test network drop"), { digest: "DIGEST-123" });

    render(
      <ErrorState
        title="Custom Failure Title"
        description="Detailed failure explanation"
        error={testError}
        reset={handleReset}
        backHref="/explorer"
      />
    );

    expect(screen.getByText("Custom Failure Title")).toBeDefined();
    expect(screen.getByText("Detailed failure explanation")).toBeDefined();

    const retryBtn = screen.getByRole("button", { name: /try again/i });
    expect(retryBtn).toBeDefined();
    fireEvent.click(retryBtn);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });
});
