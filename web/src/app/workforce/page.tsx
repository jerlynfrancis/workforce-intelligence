"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  Grid,
  Title,
  Text,
  AreaChart,
  BarChart,
  DonutChart,
  Badge,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Flex,
} from "@tremor/react";

type KpiData = {
  avg_absence: number;
  avg_turnover: number;
  avg_training: number;
  agency_ratio: number;
};

type MonthlyTrend = {
  month: string;
  absence_rate: number;
  turnover: number;
  training: number;
};

type SiteSummary = {
  site_id: number;
  site_name: string;
  region: string;
  avg_absence: number;
  avg_turnover: number;
  avg_agency: number;
  avg_total_staff: number;
};

type ShiftTypeSummary = {
  shift_type: string;
  avg_sl: number;
  avg_agency_hours: number;
  avg_overtime: number;
};

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function Workforce() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [siteSummary, setSiteSummary] = useState<SiteSummary[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [wkResult, trendResult, siteResult, shiftResult] = await Promise.all([
        supabase.from("weekly_workforce").select(
          "absence_rate_pct, turnover_events, training_hours, agency_headcount, permanent_headcount, part_time_headcount"
        ),
        supabase.rpc("workforce_monthly_trends"),
        supabase.rpc("workforce_site_summary"),
        supabase.rpc("shift_type_summary"),
      ]);

      if (wkResult.data && wkResult.data.length > 0) {
        const rows = wkResult.data;
        const totalStaff = rows.reduce(
          (s, r) => s + Number(r.permanent_headcount) + Number(r.part_time_headcount) + Number(r.agency_headcount),
          0
        );
        const totalAgency = rows.reduce((s, r) => s + Number(r.agency_headcount), 0);
        setKpi({
          avg_absence: rows.reduce((s, r) => s + Number(r.absence_rate_pct), 0) / rows.length,
          avg_turnover: rows.reduce((s, r) => s + Number(r.turnover_events), 0) / rows.length,
          avg_training: rows.reduce((s, r) => s + Number(r.training_hours), 0) / rows.length,
          agency_ratio: totalStaff > 0 ? totalAgency / totalStaff : 0,
        });
      }

      if (trendResult.data) {
        setMonthlyTrends(
          trendResult.data.map((r: any) => ({
            month: new Date(r.month).toLocaleDateString("en-GB", {
              month: "short",
              year: "2-digit",
            }),
            absence_rate: Number(r.absence_rate),
            turnover: Number(r.turnover),
            training: Number(r.training),
          }))
        );
      }

      if (siteResult.data) {
        setSiteSummary(
          siteResult.data.map((r: any) => ({
            site_id: r.site_id,
            site_name: r.site_name,
            region: r.region,
            avg_absence: Number(r.avg_absence),
            avg_turnover: Number(r.avg_turnover),
            avg_agency: Number(r.avg_agency),
            avg_total_staff: Number(r.avg_total_staff),
          }))
        );
      }

      if (shiftResult.data) {
        setShiftTypes(
          shiftResult.data.map((r: any) => ({
            shift_type: r.shift_type,
            avg_sl: Number(r.avg_sl),
            avg_agency_hours: Number(r.avg_agency_hours),
            avg_overtime: Number(r.avg_overtime),
          }))
        );
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-56 bg-zinc-200 rounded" />
          <div className="h-4 w-64 bg-zinc-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-zinc-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Workforce Instability</h1>
        <p className="mt-1 text-zinc-500">
          Absence rates, turnover events, and agency/overtime dependency
        </p>
      </div>

      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        <Card decoration="top" decorationColor="rose">
          <Text>Avg Absence Rate</Text>
          <Title className="mt-1">{kpi ? formatPercent(kpi.avg_absence / 100) : "—"}</Title>
        </Card>
        <Card decoration="top" decorationColor="orange">
          <Text>Avg Weekly Turnover</Text>
          <Title className="mt-1">{kpi ? kpi.avg_turnover.toFixed(2) : "—"}</Title>
        </Card>
        <Card decoration="top" decorationColor="blue">
          <Text>Agency Staff Ratio</Text>
          <Title className="mt-1">{kpi ? formatPercent(kpi.agency_ratio) : "—"}</Title>
        </Card>
        <Card decoration="top" decorationColor="violet">
          <Text>Avg Training Hours</Text>
          <Title className="mt-1">{kpi ? Math.round(kpi.avg_training).toString() : "—"}</Title>
        </Card>
      </Grid>

      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>Absence Rate Trend</Title>
          <Text className="mt-1 text-zinc-500">
            Monthly average absence rate across all sites
          </Text>
          <AreaChart
            className="mt-4 h-64"
            data={monthlyTrends}
            index="month"
            categories={["absence_rate"]}
            colors={["rose"]}
            valueFormatter={(v) => `${v.toFixed(1)}%`}
            showLegend={false}
            showGridLines
            minValue={0}
          />
        </Card>
        <Card>
          <Title>Turnover Events</Title>
          <Text className="mt-1 text-zinc-500">Monthly average turnover events</Text>
          <AreaChart
            className="mt-4 h-64"
            data={monthlyTrends}
            index="month"
            categories={["turnover"]}
            colors={["orange"]}
            valueFormatter={(v) => v.toFixed(1)}
            showLegend={false}
            showGridLines
            minValue={0}
          />
        </Card>
      </Grid>

      <Card>
        <Title>Site Absence Rate Ranking</Title>
        <Text className="mt-1 text-zinc-500">
          Sites sorted by highest average absence rate
        </Text>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Site</TableHeaderCell>
                <TableHeaderCell>Region</TableHeaderCell>
                <TableHeaderCell className="text-right">Avg Absence</TableHeaderCell>
                <TableHeaderCell className="text-right">Avg Turnover</TableHeaderCell>
                <TableHeaderCell className="text-right">Avg Agency</TableHeaderCell>
                <TableHeaderCell className="text-right">Total Staff</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {siteSummary.map((s) => (
                <TableRow key={s.site_id}>
                  <TableCell className="font-medium">{s.site_name}</TableCell>
                  <TableCell>{s.region}</TableCell>
                  <TableCell className="text-right">
                    <Badge
                      color={
                        s.avg_absence >= 7
                          ? "red"
                          : s.avg_absence >= 5
                            ? "amber"
                            : "emerald"
                      }
                    >
                      {formatPercent(s.avg_absence / 100)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{s.avg_turnover.toFixed(1)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{Math.round(s.avg_agency)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{Math.round(s.avg_total_staff)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card>
        <Title>Service Level by Shift Type</Title>
        <Text className="mt-1 text-zinc-500">
          Weekend shifts show lower service levels and higher agency dependency
        </Text>
        <BarChart
          className="mt-4 h-64"
          data={shiftTypes}
          index="shift_type"
          categories={["avg_sl"]}
          colors={["blue"]}
          valueFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          showLegend={false}
          showGridLines
        />
      </Card>
    </div>
  );
}
