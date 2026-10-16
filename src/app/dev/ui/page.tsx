import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Button,
  Chip,
  EmptyState,
  Equalizer,
  ErrorState,
  Field,
  Input,
  Logo,
  Panel,
  Record,
  Select,
  Skeleton,
  Spinner,
  Sticker,
  Textarea,
} from "@/components/primitives";
import { TrackCard } from "@/components/track-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { DevPlayground } from "@/components/dev-playground";

export const metadata: Metadata = { title: "UI primitives (dev)" };

/** Full primitive catalogue — every state. Blocked in production. */
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main id="main" className="mx-auto max-w-5xl space-y-12 px-7 py-12">
      <header>
        <h1 className="font-bagel text-5xl text-tx">Muse primitives</h1>
        <p className="mt-2 text-tx2">Every building block, every state. Development only.</p>
        <div className="mt-4 flex items-center gap-3">
          <ThemeToggle />
          <span className="text-sm text-tx2">← toggle theme to check both themes</span>
        </div>
      </header>

      <section>
        <h2 className="mb-4 font-bagel text-2xl text-accent">Logo</h2>
        <div className="flex flex-wrap items-center gap-6">
          <Logo size={40} />
          <Logo variant="mark" size={56} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-bagel text-2xl text-accent">Buttons</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ink">Ink</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <Button><Spinner label="Loading" /></Button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-bagel text-2xl text-accent">Chips & stickers</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Chip>Idle chip</Chip>
          <Chip active>Active chip</Chip>
          <Sticker color="lime">Lime sticker</Sticker>
          <Sticker color="cream" rotate={3}>Cream sticker</Sticker>
          <Sticker color="pink" rotate={-2}>Pink sticker</Sticker>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-bagel text-2xl text-accent">Fields</h2>
        <div className="grid max-w-lg gap-4">
          <Field label="Text input" htmlFor="dev-i" hint="With a hint.">
            <Input id="dev-i" placeholder="Type something…" />
          </Field>
          <Field label="With error" htmlFor="dev-ie" error="This one is wrong on purpose.">
            <Input id="dev-ie" defaultValue="bad value" aria-invalid />
          </Field>
          <Field label="Textarea" htmlFor="dev-t">
            <Textarea id="dev-t" placeholder="Long thoughts…" />
          </Field>
          <Field label="Select" htmlFor="dev-s">
            <Select id="dev-s">
              <option>Option A</option>
              <option>Option B</option>
            </Select>
          </Field>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-bagel text-2xl text-accent">Panels</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Panel>Standard panel — surfaces are intentional, not default.</Panel>
          <Panel deep>Deep panel with raised hard shadow.</Panel>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-bagel text-2xl text-accent">Media & motion</h2>
        <div className="flex flex-wrap items-center gap-10">
          <Record size={200} />
          <Equalizer bars={14} />
          <Equalizer bars={28} className="h-16" />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-bagel text-2xl text-accent">Track card</h2>
        <div className="grid max-w-2xl gap-3">
          <TrackCard
            track={{ id: "00000000-0000-0000-0000-000000000001", title: "Third Mainland Hours", artist: "Sample Artist", genres: ["Afro-soul", "Smooth"], externalUrl: null }}
            isDemo
          />
          <TrackCard
            track={{ id: "00000000-0000-0000-0000-000000000002", title: "Owambe Central", artist: "Sample Artist", genres: ["Afrobeats"], externalUrl: "https://music.youtube.com/" }}
            isDemo
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-bagel text-2xl text-accent">States</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <EmptyState title="Nothing here yet" body="Empty states stay helpful and honest." />
          <ErrorState body="Error states offer a way back." />
        </div>
      </section>

      <DevPlayground />
    </main>
  );
}
