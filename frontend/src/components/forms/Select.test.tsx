import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Select } from "./Select";
afterEach(cleanup);
function Fixture() {
  const [value, setValue] = useState("kg");
  return (
    <>
      <label htmlFor="unit">Unit</label>
      <Select
        id="unit"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value="kg">Kilograms</option>
        <option value="g">Grams</option>
      </Select>
      <output>{value}</output>
    </>
  );
}
describe("themed dropdown", () => {
  it("selects with keyboard and retains focus", async () => {
    render(<Fixture />);
    const button = screen.getByRole("button", { name: "Unit" });
    button.focus();
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("g");
    expect(button).toHaveFocus();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
  it("keeps the popup inside its dialog and Escape only closes the popup", async () => {
    const cancel = vi.fn();
    render(
      <dialog open onKeyDown={cancel}>
        <Fixture />
      </dialog>,
    );
    const button = screen.getByRole("button", { name: "Unit" });
    await userEvent.click(button);
    expect(screen.getByRole("dialog")).toContainElement(
      screen.getByRole("listbox"),
    );
    fireEvent.keyDown(button, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(cancel).not.toHaveBeenCalled();
  });
  it("selects a pointer option", async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole("button", { name: "Unit" }));
    await userEvent.click(screen.getByRole("option", { name: "Grams" }));
    expect(screen.getByRole("status")).toHaveTextContent("g");
  });
});
