import React, { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../components/Card";

function formatReadingDate(dateValue, fallbackLabel = "Reading") {
  const stamp = dateValue ? new Date(dateValue) : null;

  if (stamp && !Number.isNaN(stamp.getTime())) {
    const time = stamp.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const day = stamp.toLocaleDateString([], { weekday: "short" });
    return `${day}, ${time}`;
  }

  return fallbackLabel;
}

export function TrendsPage({ readings = [], onBack }) {
  const [range, setRange] = useState("daily");

  const chartData = useMemo(() => {
    const sorted = [...readings]
      .map((reading) => ({
        ...reading,
        value: Number(reading.v),
        timestamp: reading.date ? new Date(reading.date) : new Date(),
      }))
      .filter((reading) => Number.isFinite(reading.value))
      .sort((a, b) => a.timestamp - b.timestamp);

    if (!sorted.length) {
      return [{ t: "No data", v: 0 }];
    }

    if (range === "daily") {
      return sorted.slice(-7).map((reading) => ({
        t: formatReadingDate(reading.date, reading.time || "Reading"),
        v: reading.value,
      }));
    }

    const grouped = new Map();
    sorted.forEach((reading) => {
      const key = reading.timestamp.toISOString().slice(0, 10);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(reading.value);
    });

    return [...grouped.entries()].slice(-7).map(([dateKey, values]) => ({
      t: new Date(dateKey).toLocaleDateString([], { weekday: "short" }),
      v: values.reduce((sum, value) => sum + value, 0) / values.length,
    }));
  }, [range, readings]);

  return (
    <div className="screen">
      <button className="linkBack" onClick={onBack}>
        <ChevronLeft size={16} /> Home
      </button>
      <h2 className="screenTitle">Your trends</h2>
      <p className="screenSub">A simple look at your glucose pattern.</p>

      <div className="chipRow">
        <button
          className={"chip" + (range === "daily" ? " chipActive" : "")}
          onClick={() => setRange("daily")}
        >
          Daily
        </button>
        <button
          className={"chip" + (range === "weekly" ? " chipActive" : "")}
          onClick={() => setRange("weekly")}
        >
          Weekly
        </button>
      </div>

      <Card>
        <ResponsiveContainer width="100%" height={190}>
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
          >
            <CartesianGrid stroke="#E8E4D8" vertical={false} />
            <ReferenceArea y1={0} y2={3} fill="#FDECEC" fillOpacity={0.7} />
            <ReferenceArea y1={3} y2={4} fill="#FBE9E7" fillOpacity={0.65} />
            <ReferenceArea y1={4} y2={7.8} fill="#2F9E6E" fillOpacity={0.1} />
            <ReferenceArea y1={14} y2={18} fill="#FBE6D8" fillOpacity={0.7} />
            <XAxis
              dataKey="t"
              tick={{ fontSize: 11, fill: "#5B675E" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 18]}
              tick={{ fontSize: 11, fill: "#5B675E" }}
              axisLine={false}
              tickLine={false}
              width={34}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #E2DED4",
                fontSize: 12,
                fontFamily: "Lexend",
              }}
              formatter={(v) => [`${Number(v).toFixed(1)} mmol/L`, "Reading"]}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke="#2D6A4F"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#2D6A4F" }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="legendRow">
          <span>
            <i
              className="legendSwatch"
              style={{ background: "#2F9E6E33", border: "1px solid #2F9E6E" }}
            />{" "}
            Target range (4.0–7.8 mmol/L)
          </span>
        </div>
      </Card>

      <div className="tileGrid twoCol">
        <div className="miniStat">
          <span className={"statusTag statusTag-very-low"}>▼ Very low</span>
          <span className="miniStatDesc">0–2.9 mmol/L</span>
        </div>
        <div className="miniStat">
          <span className={"statusTag statusTag-low"}>▼ Low</span>
          <span className="miniStatDesc">3.0–3.9 mmol/L</span>
        </div>
        <div className="miniStat">
          <span className={"statusTag statusTag-target"}>● In range</span>
          <span className="miniStatDesc">4.0–7.8 mmol/L</span>
        </div>
        <div className="miniStat">
          <span className={"statusTag statusTag-high"}>▲ High</span>
          <span className="miniStatDesc">7.9–13.9 mmol/L</span>
        </div>
        <div className="miniStat">
          <span className={"statusTag statusTag-very-high"}>▲ Very high</span>
          <span className="miniStatDesc">14.0+ mmol/L</span>
        </div>
      </div>
      <p className="fineprint">
        This view is for spotting simple patterns. Talk to your care team about
        what your trends mean for your plan.
      </p>
    </div>
  );
}
