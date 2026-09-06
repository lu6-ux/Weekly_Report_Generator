import { Report, label } from "@/lib/types";
export default function VersionSnapshot({ snapshot }: { snapshot: unknown }) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot))
    return <p>Snapshot details unavailable.</p>;
  const report = snapshot as Partial<Report>;
  return (
    <div className="mt-4 space-y-4 text-sm">
      <p>
        {report.project?.name} · {report.weekStart?.slice(0, 10)} to{" "}
        {report.weekEnd?.slice(0, 10)}
      </p>
      {Array.isArray(report.tasks) && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Planned / actual %</th>
                <th>Planned / actual hours</th>
                <th>Output</th>
              </tr>
            </thead>
            <tbody>
              {report.tasks.map((t, i) => (
                <tr key={i}>
                  <td>{t.taskName}</td>
                  <td>{label(t.status)}</td>
                  <td>
                    {t.plannedPercent} / {t.actualPercent}
                  </td>
                  <td>
                    {t.plannedHours ?? 0} / {t.actualHours ?? 0}
                  </td>
                  <td>{t.output || "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(["blockers", "achievements"] as const).map((key) => (
        <div key={key}>
          <h3 className="font-semibold">{label(key)}</h3>
          {report[key]?.length ? (
            report[key]?.map((item, i) => <p key={i}>{item.description}</p>)
          ) : (
            <p>None recorded.</p>
          )}
        </div>
      ))}
      <div>
        <h3 className="font-semibold">Work Hours</h3>
        {report.workHours?.map((w, i) => (
          <p key={i}>
            {label(w.workType)}: {w.hours} hours {w.notes && `- ${w.notes}`}
          </p>
        ))}
      </div>
      <div>
        <h3 className="font-semibold">Next Week Plans</h3>
        <p className="whitespace-pre-wrap">
          {report.nextWeekPlans || "None recorded."}
        </p>
      </div>
      <div>
        <h3 className="font-semibold">Notes</h3>
        <p className="whitespace-pre-wrap">
          {report.notes || "None recorded."}
        </p>
      </div>
    </div>
  );
}
