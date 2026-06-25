import { render, screen, fireEvent } from "@testing-library/react";
import Tooltip from "@/components/shared/Tooltip";

describe("Tooltip", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the trigger children", () => {
    render(
      <Tooltip content="Tooltip text">
        <span>Hover me</span>
      </Tooltip>
    );
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("renders the ? indicator icon", () => {
    render(
      <Tooltip content="Tooltip text">
        <span>Hover me</span>
      </Tooltip>
    );
    const questionMark = screen.getByText("?");
    expect(questionMark).toBeInTheDocument();
    expect(questionMark).toHaveAttribute("aria-hidden", "true");
  });

  it("shows tooltip content on hover", () => {
    render(
      <Tooltip content="This is the tooltip">
        <span>Trigger</span>
      </Tooltip>
    );
    const container = screen.getByText("Trigger").closest("div")!;
    fireEvent.mouseEnter(container);
    expect(screen.getByText("This is the tooltip")).toBeInTheDocument();
  });

  it("hides tooltip on mouse leave", () => {
    render(
      <Tooltip content="This is the tooltip">
        <span>Trigger</span>
      </Tooltip>
    );
    const container = screen.getByText("Trigger").closest("div")!;
    fireEvent.mouseEnter(container);
    expect(screen.getByText("This is the tooltip")).toBeInTheDocument();
    fireEvent.mouseLeave(container);
    // After mouse leave, tooltip has opacity-0 and pointer-events-none
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveClass("opacity-0");
    expect(tooltip).toHaveClass("pointer-events-none");
  });

  it("toggles tooltip on click (mobile tap)", () => {
    render(
      <Tooltip content="Tap tooltip">
        <span>Tap me</span>
      </Tooltip>
    );
    const trigger = screen.getByText("Tap me");
    // Initially hidden (opacity-0)
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveClass("opacity-0");
    // First tap opens
    fireEvent.click(trigger);
    expect(tooltip).toHaveClass("opacity-100");
    expect(tooltip).not.toHaveClass("pointer-events-none");
    // Second tap closes
    fireEvent.click(trigger);
    expect(tooltip).toHaveClass("opacity-0");
    expect(tooltip).toHaveClass("pointer-events-none");
  });

  it("toggles correctly: open → close → open", () => {
    render(
      <Tooltip content="Toggle test">
        <span>Toggle</span>
      </Tooltip>
    );
    const trigger = screen.getByText("Toggle");
    const tooltip = screen.getByRole("tooltip");
    fireEvent.click(trigger);
    expect(tooltip).toHaveClass("opacity-100");
    fireEvent.click(trigger);
    expect(tooltip).toHaveClass("opacity-0");
    fireEvent.click(trigger);
    expect(tooltip).toHaveClass("opacity-100");
  });

  it("dismisses tooltip on outside click", () => {
    render(
      <>
        <Tooltip content="Outside click test">
          <span>Trigger</span>
        </Tooltip>
        <div data-testid="outside">Outside area</div>
      </>
    );
    const trigger = screen.getByText("Trigger");
    fireEvent.click(trigger);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveClass("opacity-100");
    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(tooltip).toHaveClass("opacity-0");
    expect(tooltip).toHaveClass("pointer-events-none");
  });

  it("dismisses tooltip on Escape key", () => {
    render(
      <Tooltip content="Escape test">
        <span>Trigger</span>
      </Tooltip>
    );
    const trigger = screen.getByText("Trigger");
    fireEvent.click(trigger);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveClass("opacity-100");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(tooltip).toHaveClass("opacity-0");
    expect(tooltip).toHaveClass("pointer-events-none");
  });

  it("sets aria-describedby on the trigger", () => {
    render(
      <Tooltip content="ARIA test">
        <span>Trigger</span>
      </Tooltip>
    );
    // The trigger span is the one wrapping children + ? icon
    const triggerSpan = screen.getByText("Trigger").parentElement;
    const ariaDescribedBy = triggerSpan?.getAttribute("aria-describedby");
    expect(ariaDescribedBy).toBeTruthy();
    // The tooltip element should have this ID
    const tooltip = document.getElementById(ariaDescribedBy!);
    expect(tooltip).toBeInTheDocument();
  });

  it("tooltip has role=tooltip", () => {
    render(
      <Tooltip content="Role test">
        <span>Trigger</span>
      </Tooltip>
    );
    const trigger = screen.getByText("Trigger");
    fireEvent.mouseEnter(trigger.closest("div")!);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent("Role test");
  });

  it("tooltip is focusable", () => {
    render(
      <Tooltip content="Focus test">
        <span>Trigger</span>
      </Tooltip>
    );
    const trigger = screen.getByText("Trigger");
    fireEvent.mouseEnter(trigger.closest("div")!);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveAttribute("tabIndex", "-1");
  });
});
