"use client";

import { useState } from "react";
import { Button, ModeToggle, Panel } from "@/components/primitives";
import { Dialog } from "@/components/dialog";
import { useToast } from "@/components/toast";

/** Interactive primitives that need a client boundary: Dialog, Toast, ModeToggle. */
export function DevPlayground() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"listen" | "create">("listen");
  const { push } = useToast();

  return (
    <section>
      <h2 className="mb-4 font-bagel text-2xl text-accent">Interactive</h2>
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Button variant="outline" onClick={() => push("success", "That worked nicely.")}>
          Success toast
        </Button>
        <Button variant="outline" onClick={() => push("error", "That failed politely.")}>
          Error toast
        </Button>
        <ModeToggle value={mode} onChange={setMode} />
      </div>
      <Panel className="mt-4 max-w-md">
        Same toggle inside a panel — check both themes here.
      </Panel>
      <Dialog open={open} onClose={() => setOpen(false)} title="Dialog test">
        <p className="text-sm text-tx/85">
          Focus is trapped here. Escape closes me. Tab loops through the buttons.
        </p>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => setOpen(false)}>Close</Button>
          <Button variant="ghost" className="text-tx/70" onClick={() => setOpen(false)}>
            Also close
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
