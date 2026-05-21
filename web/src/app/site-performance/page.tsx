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
  Badge,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Select,
  SelectItem,
  Flex,
} from "@tremor/react";

type SiteData = {
  site_id: number;
  site_name: string;
  region: string;
  site_type: string;
  labour_cost: number;
  actual_hours: number;
  scheduled_hours: number;
  avg_sl: number;
  agency_cost: number;
  overtime_cost: number;
};

type MonthlyTrend = {
  month: string;
  labour_cost: number;
  avg_service_level: number;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default function SitePerformance() {
  const [sites, setSites] = useState<SiteData[]>([]);
  const [regionalTrends, setRegionalTrends] = useState<MonthlyTrend[]>([]);
  const [regionFilter, setRegionFilter] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [siteResult, trendResult] = await Promise.all([
        supabase.from("daily_operations").select(`
          site_id,
          labour_cost_gbp, actual_hours_worked, scheduled_hours,
          service_level_score, agency_cost_gbp, overtime_cost_gbp,
          site_master!inner(site_name, region, site_type)
        `),
        supabase.rpc("site_performance_regional_trends"),
      ]);

      if (siteResult.data && siteResult.data.length > 0) {
        const grouped = new Map<number, {
          labour_cost: number; actual_hours: number; scheduled_hours: number;
          sl_sum: number; sl_count: number; agency_cost: number; overtime_cost: number;
        }>();
        const siteInfo = new Map<number, { site_name: string; region: string; site_type: string }>();

        for (const r of siteResult.data) {
          const sid = Number(r.site_id);
          const sm = r.site_master as any;
          siteInfo.set(sid, {
            site_name: sm.site_name,
            region: sm.region,
            site_type: sm.site_type,
          });
          if (!grouped.has(sid)) {
            grouped.set(sid, { labour_cost: 0, actual_hours: 0, scheduled_hours: 0, sl_sum: 0, sl_count: 0, agency_cost: 0, overtime_cost: 0 });
          }
          const g = grouped.get(sid)!;
          g.labour_cost += Number(r.labour_cost_gbp);
          g.actual_hours += Number(r.actual_hours_worked);
          g.scheduled_hours += Number(r.scheduled_hours);
          g.sl_sum += Number(r.service_level_score);
          g.sl_count += 1;
          g.agency_cost += Number(r.agency_cost_gbp);
          g.overtime_cost += Number(r.overtime_cost_gbp);
        }

        const siteArray: SiteData[] = [];
        for (const [sid, g] of grouped) {
          const info = siteInfo.get(sid)!;
          siteArray.push({
            site_id: sid,
            site_name: info.site_name,
            region: info.region,
            site_type: info.site_type,
            labour_cost: g.labour_cost,
            actual_hours: g.actual_hours,
            scheduled_hours: g.scheduled_hours,
            avg_sl: g.sl_count > 0 ? g.sl_sum / g.sl_count : 0,
            agency_cost: g.agency_cost,
            overtime_cost: g.overtime_cost,
          });
        }
        setSites(siteArray.sort((a, b) => b.labour_cost - a.labour_cost));
      }

      if (trendResult.data) {
        setRegionalTrends(
          trendResult.data.map((r: any) => ({
            month: new Date(r.month).toLocaleDateString("en-GB", {
              month: "short",
              year: "2-digit",
            }),
            labour_cost: Number(r.labour_cost),
            avg_service_level: Number(r.avg_service_level),
            ...(r.region ? { region: r.region } : {}),
          }))
        );
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const regions = ["All", ...new Set(sites.map((s) => s.region))].sort();
  const filtered = regionFilter === "All" ? sites : sites.filter((s) => s.region === regionFilter);

  const trendData = regionalTrends;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-zinc-200 rounded" />
          <div className="h-4 w-64 bg-zinc-200 rounded" />
          <div className="h-64 bg-zinc-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Site Performance</h1>
        <p className="mt-1 text-zinc-500">
          Labour variance by site, monthly trends, and regional filters
        </p>
      </div>

      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>Monthly Cost Trend by Region</Title>
          <AreaChart
            className="mt-4 h-72"
            data={trendData}
            index="month"
            categories={["labour_cost"]}
            colors={["blue"]}
            valueFormatter={formatCurrency}
            showLegend={false}
            showGridLines
          />
        </Card>
        <Card>
          <Title>Service Level Trend by Region</Title>
          <AreaChart
            className="mt-4 h-72"
            data={trendData}
            index="month"
            categories={["avg_service_level"]}
            colors={["emerald"]}
            valueFormatter={formatPercent}
            showLegend={false}
            showGridLines
            minValue={0.7}
            maxValue={1}
          />
        </Card>
      </Grid>

      <Card>
        <Flex className="items-center justify-between">
          <div>
            <Title>Site Performance Details</Title>
            <Text className="mt-1 text-zinc-500">
              Labour cost, hours variance, and service level by site
            </Text>
          </div>
          <div className="w-48">
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </Select>
          </div>
        </Flex>
        <div className="mt-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Site</TableHeaderCell>
                <TableHeaderCell>Region</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell className="text-right">Labour Cost</TableHeaderCell>
                <TableHeaderCell className="text-right">Hours Variance</TableHeaderCell>
                <TableHeaderCell className="text-right">Service Level</TableHeaderCell>
                <TableHeaderCell className="text-right">Agency Cost</TableHeaderCell>
                <TableHeaderCell className="text-right">Overtime</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((s) => {
                const hoursVar = s.scheduled_hours > 0
                  ? ((s.actual_hours - s.scheduled_hours) / s.scheduled_hours) * 100
                  : 0;
                return (
                  <TableRow key={s.site_id}>
                    <TableCell className="font-medium">{s.site_name}</TableCell>
                    <TableCell>{s.region}</TableCell>
                    <TableCell>{s.site_type}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.labour_cost)}</TableCell>
                    <TableCell className="text-right">
                      <Badge color={hoursVar > 5 ? "red" : hoursVar < -5 ? "amber" : "emerald"}>
                        {hoursVar > 0 ? "+" : ""}
                        {hoursVar.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        color={
                          s.avg_sl >= 0.90
                            ? "emerald"
                            : s.avg_sl >= 0.85
                              ? "amber"
                              : "red"
                        }
                      >
                        {formatPercent(s.avg_sl)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(s.agency_cost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.overtime_cost)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
