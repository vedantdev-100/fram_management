import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SecretCode } from "./SecretCode";
afterEach(cleanup);
it("masks codes until revealed and hides them again", async () => {
  render(<SecretCode value="test-token" />);
  expect(screen.queryByText("test-token")).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Show invitation code" }),
  );
  expect(screen.getByText("test-token")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Hide invitation code" }),
  );
  expect(screen.queryByText("test-token")).not.toBeInTheDocument();
});
