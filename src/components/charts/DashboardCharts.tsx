"use client"

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, ReferenceLine,
} from "recharts"

const COLORS = {
  baik: "#16a34a",
  kurang: "#d97706",
  buruk: "#dc2626",
  lebih: "#7c3aed",
  normal: "#16a34a",
  pendek: "#d97706",
  sangatPendek: "#dc2626",
  tinggi: "#2563eb",
}

interface GiziData {
  name: string
  value: number
  color: string
}

interface StuntingData {
  status: string
  jumlah: number
  fill: string
}

export function GiziPieChart({ data }: { data: GiziData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={45}
          outerRadius={70}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value) => [`${value} balita`, ""]}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

interface GrowthTrendPoint {
  tanggal: string  // label sumbu X, mis. "Jan 2026"
  zBBU: number | null
  zTBU: number | null
}

// FR-19: grafik tren pertumbuhan (BB/U, TB/U) per balita dari waktu ke waktu
export function GrowthTrendChart({ data }: { data: GrowthTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} domain={[-5, 5]} />
        <ReferenceLine y={-2} stroke="#dc2626" strokeDasharray="4 4" label={{ value: "-2 SD", fontSize: 10, fill: "#dc2626" }} />
        <ReferenceLine y={0} stroke="#d1d5db" />
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="zBBU" name="Z BB/U" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        <Line type="monotone" dataKey="zTBU" name="Z TB/U" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function StuntingBarChart({ data }: { data: StuntingData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="status"
          tick={{ fontSize: 11, fill: "#374151" }}
          axisLine={false}
          tickLine={false}
          width={100}
        />
        <Tooltip
          formatter={(value) => [`${value} balita`, "Jumlah"]}
          contentStyle={{ borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="jumlah" radius={[0, 6, 6, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
