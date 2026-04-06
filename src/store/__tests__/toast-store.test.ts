import { useToastStore } from "../toast-store";

function resetStore() {
  useToastStore.setState({ toasts: [] });
}

describe("toast-store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds a toast", () => {
    useToastStore.getState().addToast("success", "Saved");
    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe("success");
    expect(toasts[0].message).toBe("Saved");
  });

  it("removes a toast by id", () => {
    useToastStore.getState().addToast("info", "Hello");
    const id = useToastStore.getState().toasts[0].id;
    useToastStore.getState().removeToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("auto-removes after 5 seconds", () => {
    useToastStore.getState().addToast("success", "Done");
    expect(useToastStore.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(5000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("caps at 3 toasts, evicting oldest", () => {
    useToastStore.getState().addToast("info", "1");
    useToastStore.getState().addToast("info", "2");
    useToastStore.getState().addToast("info", "3");
    useToastStore.getState().addToast("info", "4");

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(3);
    expect(toasts[0].message).toBe("2");
    expect(toasts[1].message).toBe("3");
    expect(toasts[2].message).toBe("4");
  });

  it("supports all three toast types", () => {
    useToastStore.getState().addToast("success", "ok");
    useToastStore.getState().addToast("error", "fail");
    useToastStore.getState().addToast("info", "fyi");

    const types = useToastStore.getState().toasts.map((t) => t.type);
    expect(types).toEqual(["success", "error", "info"]);
  });
});
