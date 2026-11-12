import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "./DashboardShell";
import { inr } from "@/lib/format";

export type PerformancePoint = { day: string; value: number; count?: number };

export function PerformanceChart({
  title = "Performance — last 7 days",
  data,
  isMoney = false,
}: {
  title?: string;
  data: PerformancePoint[];
  isMoney?: boolean;
}) {
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const totalCount = data.reduce((sum, point) => sum + (point.count ?? 0), 0);

  return (
    <Panel
      title={title}
      action={
        <p className="text-sm font-bold text-primary">
          {isMoney ? inr(total) : total}
          {totalCount > 0 && !isMoney ? ` · ${totalCount} trips` : ""}
        </p>
      }
    >
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "hsl(0 0% 0% / 0.04)" }}
              formatter={(value: number) => [
                isMoney ? inr(value) : value,
                isMoney ? "Revenue" : "Value",
              ]}
              labelStyle={{ fontWeight: 700 }}
              contentStyle={{ borderRadius: 12, border: "1px solid hsl(0 0% 85%)" }}
            />
            <Bar dataKey="value" fill="#5300b7" radius={[8, 8, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
