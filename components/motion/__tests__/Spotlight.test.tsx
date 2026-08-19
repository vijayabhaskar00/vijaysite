import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Spotlight from "../Spotlight";

describe("Spotlight", () => {
  it("renders its children", () => {
    render(
      <Spotlight>
        <p>Hello</p>
      </Spotlight>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies the spotlight class and passed className unconditionally", () => {
    render(
      <Spotlight className="my-class">
        <p>Hello</p>
      </Spotlight>
    );
    const wrapper = screen.getByText("Hello").parentElement;
    expect(wrapper).toHaveClass("spotlight", "my-class");
  });

  it("sets --spot-x/--spot-y custom properties from the pointer position on move", () => {
    render(
      <Spotlight>
        <p>Hello</p>
      </Spotlight>
    );
    const wrapper = screen.getByText("Hello").parentElement as HTMLElement;
    wrapper.getBoundingClientRect = () =>
      ({ left: 10, top: 5, width: 200, height: 100, right: 210, bottom: 105, x: 10, y: 5, toJSON() {} }) as DOMRect;

    // jsdom has no PointerEvent constructor, so testing-library's
    // fireEvent.pointerMove can't carry clientX/clientY through -- a plain
    // MouseEvent named "pointermove" does, and React's synthetic event
    // system only cares about the native event's type/properties, not its
    // exact class.
    wrapper.dispatchEvent(new MouseEvent("pointermove", { clientX: 60, clientY: 25, bubbles: true }));

    expect(wrapper.style.getPropertyValue("--spot-x")).toBe("50px");
    expect(wrapper.style.getPropertyValue("--spot-y")).toBe("20px");
  });
});
