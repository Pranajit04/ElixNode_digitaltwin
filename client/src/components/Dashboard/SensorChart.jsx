import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

function SensorChart({ data, threshold, color = "#53a5ff", variant = "line", valueKey = "value" }) {
  return (
    <div className="chart-surface">
      <ResponsiveContainer>
        {variant === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(141, 154, 177, 0.12)" />
            <XAxis dataKey="label" stroke="#8d9ab1" tickLine={false} axisLine={false} />
            <YAxis stroke="#8d9ab1" tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey={valueKey} radius={[10, 10, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.fill || color} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(141, 154, 177, 0.12)" />
            <XAxis dataKey="label" stroke="#8d9ab1" tickLine={false} axisLine={false} />
            <YAxis stroke="#8d9ab1" tickLine={false} axisLine={false} />
            <Tooltip />
            {threshold ? <ReferenceLine y={threshold} stroke="#ffb649" strokeDasharray="6 6" /> : null}
            <Line type="monotone" dataKey={valueKey} stroke={color} strokeWidth={3} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default SensorChart;
