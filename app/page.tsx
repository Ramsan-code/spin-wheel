import { Suspense } from "react";
import { cookies } from "next/headers";

import { SpinExperience } from "@/components/spin/spin-experience";
import { Backdrop } from "@/components/spin/backdrop";
import { CAMPAIGN, PRIZES, toPublic } from "@/lib/prizes";

// Server Component. The shell is static; only the part that reads the cookie
// is dynamic, so it sits inside <Suspense> (required with cacheComponents).
export default function Page() {
  return (
    <main className="relative isolate flex min-h-dvh flex-1 flex-col overflow-hidden">
      <Backdrop />
      <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
        <SpinLoader />
      </Suspense>
    </main>
  );
}

async function SpinLoader() {
  const store = await cookies();
  const previousId = store.get(CAMPAIGN.cookie)?.value;
  const previousIndex = PRIZES.findIndex((p) => p.id === previousId);

  return (
    <SpinExperience
      prizes={toPublic()}
      campaign={{
        brand: CAMPAIGN.brand,
        headline: CAMPAIGN.headline,
        tagline: CAMPAIGN.tagline,
      }}
      previousIndex={previousIndex === -1 ? null : previousIndex}
      showDevReset={process.env.NODE_ENV !== "production"}
    />
  );
}
