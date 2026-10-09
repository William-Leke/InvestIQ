import { openExternal } from "../lib/open";
import type { Profile } from "../lib/types";

export function CompanyProfile({ profile }: { profile: Profile }) {
  const facts: [string, string][] = [
    ["CEO", profile.ceo],
    ["Employees", profile.employees ? profile.employees.toLocaleString("en-US") : ""],
    ["Country", profile.country],
    ["Sector", profile.sector],
    ["Industry", profile.industry],
  ];
  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <h3 className="mb-3 text-sm font-semibold text-soft">About {profile.name}</h3>
      <dl className="mb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {facts
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-faint">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>
      <p className="line-clamp-[12] text-sm leading-relaxed text-muted">{profile.description}</p>
      {profile.website && (
        <button onClick={() => void openExternal(profile.website)} className="mt-3 text-sm text-accent hover:underline">
          {profile.website.replace(/^https?:\/\//, "")}
        </button>
      )}
    </section>
  );
}
