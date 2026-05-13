export default function ReportPreview({ report, context }) {
  return (
    <div className="report-preview bg-white text-gray-900 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-8 text-center">
        <h1 className="text-2xl font-bold mb-1">Restoration Report</h1>
        <p className="text-slate-400 text-sm">Property Damage Assessment & Mitigation Documentation</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Job info grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm border-b border-gray-200 pb-5">
          <InfoRow label="Property" value={context.job.address} />
          <InfoRow label="Loss Type" value={capitalize(context.job.loss_type)} />
          <InfoRow label="Status" value={capitalize(context.job.status)} />
          <InfoRow label="Report Date" value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
          {context.job.claim_number && <InfoRow label="Claim #" value={context.job.claim_number} />}
          {context.job.insurance_company && <InfoRow label="Insurance" value={context.job.insurance_company} />}
          {context.job.adjuster_name && (
            <InfoRow
              label="Adjuster"
              value={`${context.job.adjuster_name}${context.job.adjuster_phone ? ' — ' + context.job.adjuster_phone : ''}`}
            />
          )}
          <InfoRow label="Date of Loss" value={new Date(context.job.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
          <InfoRow label="Photos" value={`${context.total_photos} documented`} />
        </div>

        {/* Executive summary */}
        <Section title="Executive Summary">
          <p className="text-sm text-gray-700 leading-relaxed">{report.summary}</p>
        </Section>

        {/* Loss description */}
        <Section title="Loss Description & Scope">
          <p className="text-sm text-gray-700 leading-relaxed">{report.loss_description}</p>
        </Section>

        {/* Room assessments */}
        <Section title="Room-by-Room Assessment">
          {report.rooms?.map((room, i) => {
            const meta = context.rooms?.find((r) => r.name === room.name);
            const photoCount = context.photo_counts?.[room.name];
            return (
              <div key={i} className="mb-4 last:mb-0">
                <h4 className="font-semibold text-gray-900 text-sm">{room.name}</h4>
                {meta && (
                  <p className="text-xs text-gray-400 mb-1">
                    {[meta.floor_level, meta.sqft ? `${meta.sqft} sqft` : null, meta.affected ? 'Affected' : null].filter(Boolean).join(' • ')}
                  </p>
                )}
                {photoCount && (
                  <p className="text-xs text-blue-600 mb-1">{photoCount} photo(s) documented</p>
                )}
                <p className="text-sm text-gray-700 leading-relaxed">{room.narrative}</p>
              </div>
            );
          })}
        </Section>

        {/* Moisture readings table */}
        {context.moisture_readings?.length > 0 && (
          <Section title="Moisture Readings">
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Room</th>
                    <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Location</th>
                    <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Material</th>
                    <th className="text-left py-1.5 px-2 text-gray-500 font-medium">Date</th>
                    <th className="text-right py-1.5 px-2 text-gray-500 font-medium">Value</th>
                    <th className="text-center py-1.5 px-2 text-gray-500 font-medium">Goal</th>
                  </tr>
                </thead>
                <tbody>
                  {context.moisture_readings.slice(-30).map((r, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1 px-2 text-gray-700">{r.room}</td>
                      <td className="py-1 px-2 text-gray-700">{r.location}</td>
                      <td className="py-1 px-2 text-gray-500 capitalize">{r.material}</td>
                      <td className="py-1 px-2 text-gray-500">{r.date}</td>
                      <td className={`py-1 px-2 text-right font-mono ${r.goal_met ? 'text-green-600' : 'text-amber-600'}`}>
                        {r.value}{r.type === 'moisture' ? '%' : ''}
                      </td>
                      <td className="py-1 px-2 text-center">{r.goal_met ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Equipment */}
        {context.equipment?.length > 0 && (
          <Section title="Equipment Log">
            <div className="space-y-1.5">
              {context.equipment.map((e, i) => {
                const type = e.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>
                      <span className="font-medium text-gray-800">{type}</span>
                      {e.brand_model && ` (${e.brand_model})`}
                      {' × '}{e.quantity}
                      {e.room && ` — ${e.room}`}
                      {' | Placed: '}{e.placed}
                      {e.removed ? ` | Removed: ${e.removed}` : ' | Still on site'}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Mitigation */}
        <Section title="Water Mitigation Narrative">
          <p className="text-sm text-gray-700 leading-relaxed">{report.mitigation}</p>
        </Section>

        {/* Status */}
        <Section title="Current Status">
          <p className="text-sm text-gray-700 leading-relaxed">{report.status}</p>
        </Section>

        {/* Next steps */}
        <Section title="Recommended Next Steps">
          <p className="text-sm text-gray-700 leading-relaxed">{report.next_steps}</p>
        </Section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 mt-6">
          <p className="text-xs text-gray-400 text-center">
            Generated by RestoDoc on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 font-medium shrink-0">{label}:</span>
      <span className="text-gray-900">{value || 'N/A'}</span>
    </div>
  );
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
