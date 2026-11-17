import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useState } from "react";
import {
  ConfirmationProvider,
  useConfirmation,
} from "./ConfirmationProvider";

function ConfirmationTrigger() {
  const { confirm } = useConfirmation();
  const [result, setResult] = useState("");

  const requestConfirmation = async () => {
    const confirmed = await confirm({
      title: "Delete item?",
      description: "This action cannot be undone.",
    });
    setResult(confirmed ? "confirmed" : "cancelled");
  };

  return (
    <>
      <button type="button" onClick={requestConfirmation}>
        Open confirmation
      </button>
      {result ? <p>{result}</p> : null}
    </>
  );
}

afterEach(cleanup);

describe("ConfirmationProvider", () => {
  it("resolves true when the destructive action is confirmed", async () => {
    render(
      <ConfirmationProvider>
        <ConfirmationTrigger />
      </ConfirmationProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open confirmation" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("confirmed")).toBeTruthy();
  });

  it("resolves false when the dialog is cancelled with Escape", async () => {
    render(
      <ConfirmationProvider>
        <ConfirmationTrigger />
      </ConfirmationProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open confirmation" }));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(await screen.findByText("cancelled")).toBeTruthy();
  });
});
