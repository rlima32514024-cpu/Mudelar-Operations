'use client'

import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ResponsiveContainer,
} from 'recharts'

export interface StatusChartData { label: string; count: number }
export interface MonthChartData { month: string; count: number }
export interface RiskChartData { name: string; value: number; fill: string }
export interface FinancialChartData { name: string; value: number; fill: string }

interface Props {
  statusData: StatusChartData[]
  monthlyData: MonthChartData[]
  riskData: RiskChartData[]
  financialData: FinancialChartData[]
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function fmtEuro(v: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}

const tickStyle = { fontSize: 11, fill: '#6b7280' }

export function MarioCharts({ statusData, monthlyData, riskData, financialData }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* Chart 1 — Estado das obras */}
      <Card title="Estado das obras">
        {statusData.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-16">Sem obras</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={tickStyle} />
              <YAxis tick={tickStyle} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#f9fafb' }}
                formatter={(v) => [`${v} obras`, 'Total']}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Chart 2 — Novas obras por mês */}
      <Card title="Novas obras — últimos 6 meses">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={tickStyle} />
            <YAxis tick={tickStyle} allowDecimals={false} />
            <Tooltip formatter={(v) => [`${v} obras`, 'Novas obras']} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              fill="url(#trendGrad)"
              strokeWidth={2}
              dot={{ r: 3, fill: '#3b82f6' }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Chart 3 — Risco de arranque */}
      <Card title="Risco de arranque (obras ativas)">
        {riskData.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-16">Sem obras ativas</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="45%"
                outerRadius={75}
                dataKey="value"
                stroke="none"
              >
                {riskData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} obras`, '']} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Chart 4 — Resumo financeiro */}
      <Card title="Resumo financeiro">
        {financialData.every((d) => d.value === 0) ? (
          <p className="text-center text-sm text-gray-400 py-16">Sem dados financeiros</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={financialData} margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={tickStyle} />
              <YAxis
                tick={tickStyle}
                tickFormatter={(v: number) =>
                  v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}M`
                    : v >= 1_000
                      ? `${(v / 1_000).toFixed(0)}k`
                      : String(v)
                }
              />
              <Tooltip
                cursor={{ fill: '#f9fafb' }}
                formatter={(v) => [fmtEuro(v as number), '']}
              />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {financialData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

    </div>
  )
}
