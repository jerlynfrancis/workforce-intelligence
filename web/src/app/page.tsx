"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  Grid,
  Flex,
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
} from "@tremor/react";

type KpiData = {
  total_labour_cost: number;
  total_agency_cost: number;
  total_overtime_cost: number;
  avg_service_level: number;
  total_actual_hours: number;
  total_scheduled_hours: number;
};

type MonthlyTrend = {
  month: string;
  labour_cost: number;
  agency_cost: number;
  overtime_cost: number;
  avg_service_level: number;
};

type RegionalData = {
  region: string;
  labour_cost: number;
  avg_service_level: number;
  agency_cost: number;
  site_count: number;
};

type SitePerformance = {
  site_id: number;
  site_name: string;
  region: string;
  site_type: string;
  labour_cost: number;
  avg_service_level: number;
  agency_ratio: number;
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

export default function ExecutiveSummary() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [topSites, setTopSites] = useState<SitePerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [kpiResult, trendResult, regionResult, siteResult] = await Promise.all([
        supabase.from("daily_operations").select(
          "labour_cost_gbp, agency_cost_gbp, overtime_cost_gbp, service_level_score, actual_hours_worked, scheduled_hours"
        ),
        supabase.rpc("monthly_trends"),
        supabase.rpc("regional_summary"),
        supabase.rpc("site_performance_ranking"),
      ]);

      if (kpiResult.data) {
        const rows = kpiResult.data;
        setKpi({
          total_labour_cost: rows.reduce((s, r) => s + Number(r.labour_cost_gbp), 0),
          total_agency_cost: rows.reduce((s, r) => s + Number(r.agency_cost_gbp), 0),
          total_overtime_cost: rows.reduce((s, r) => s + Number(r.overtime_cost_gbp), 0),
          avg_service_level: rows.reduce((s, r) => s + Number(r.service_level_score), 0) / rows.length,
          total_actual_hours: rows.reduce((s, r) => s + Number(r.actual_hours_worked), 0),
          total_scheduled_hours: rows.reduce((s, r) => s + Number(r.scheduled_hours), 0),
        });
      }

      if (trendResult.data) {
        setMonthlyTrends(
          trendResult.data.map((r: any) => ({
            month: new Date(r.month).toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
            labour_cost: Number(r.labour_cost),
            agency_cost: Number(r.agency_cost),
            overtime_cost: Number(r.overtime_cost),
            avg_service_level: Number(r.avg_service_level),
          }))
        );
      }

      if (regionResult.data) {
        setRegionalData(
          regionResult.data.map((r: any) => ({
            region: r.region,
            labour_cost: Number(r.labour_cost),
            avg_service_level: Number(r.avg_service_level),
            agency_cost: Number(r.agency_cost),
            site_count: Number(r.site_count),
          }))
        );
      }

      if (siteResult.data) {
        setTopSites(
          siteResult.data.map((r: any) => ({
            site_id: r.site_id,
            site_name: r.site_name,
            region: r.region,
            site_type: r.site_type,
            labour_cost: Number(r.labour_cost),
            avg_service_level: Number(r.avg_service_level),
            agency_ratio: Number(r.agency_ratio),
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
          <div className="h-8 w-48 bg-zinc-200 rounded" />
          <div className="h-4 w-72 bg-zinc-200 rounded" />
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
        <h1 className="text-2xl font-bold text-zinc-900">Executive Summary</h1>
        <p className="mt-1 text-zinc-500">
          Workforce intelligence overview for COG &middot; Jan 2024 &ndash; Jun 2025
        </p>
      </div>

      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        <Card decoration="top" decorationColor="blue">
          <Text>Total Labour Cost</Text>
          <Title className="mt-1">{kpi ? formatCurrency(kpi.total_labour_cost) : "—"}</Title>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Text>Agency Spend</Text>
          <Title className="mt-1">{kpi ? formatCurrency(kpi.total_agency_cost) : "—"}</Title>
        </Card>
        <Card decoration="top" decorationColor="violet">
          <Text>Overtime Cost</Text>
          <Title className="mt-1">{kpi ? formatCurrency(kpi.total_overtime_cost) : "—"}</Title>
        </Card>
        <Card decoration="top" decorationColor="emerald">
          <Text>Avg Service Level</Text>
          <Title className="mt-1">{kpi ? formatPercent(kpi.avg_service_level) : "—"}</Title>
        </Card>
      </Grid>

      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>Monthly Labour & Agency Cost</Title>
          <AreaChart
            className="mt-4 h-72"
            data={monthlyTrends}
            index="month"
            categories={["labour_cost", "agency_cost"]}
            colors={["blue", "amber"]}
            valueFormatter={formatCurrency}
            showLegend
            showGridLines
          />
        </Card>
        <Card>
          <Title>Monthly Service Level</Title>
          <AreaChart
            className="mt-4 h-72"
            data={monthlyTrends}
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

      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>Cost by Region</Title>
          <BarChart
            className="mt-4 h-64"
            data={regionalData}
            index="region"
            categories={["labour_cost", "agency_cost"]}
            colors={["blue", "amber"]}
            valueFormatter={formatCurrency}
            stack
            showLegend
            showGridLines
          />
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Region</TableHeaderCell>
                  <TableHeaderCell className="text-right">Sites</TableHeaderCell>
                  <TableHeaderCell className="text-right">Labour Cost</TableHeaderCell>
                  <TableHeaderCell className="text-right">Service Level</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {regionalData.map((r) => (
                  <TableRow key={r.region}>
                    <TableCell className="font-medium">{r.region}</TableCell>
                    <TableCell className="text-right">{r.site_count}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(r.labour_cost)}</TableCell>
                    <TableCell className="text-right">
                      <Badge color={r.avg_service_level >= 0.88 ? "emerald" : "amber"}>
                        {formatPercent(r.avg_service_level)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
        <Card>
          <Title>Agency Spend Breakdown</Title>
          <DonutChart
            className="mt-4 h-64"
            data={regionalData}
            category="agency_cost"
            index="region"
            colors={["blue", "amber", "violet"]}
            valueFormatter={formatCurrency}
            showLabel
            showTooltip
          />
          <Flex className="mt-4">
            <Text className="text-zinc-500">
              Agency spend as % of total:{" "}
              {kpi ? ((kpi.total_agency_cost / kpi.total_labour_cost) * 100).toFixed(1) : "—"}%
            </Text>
          </Flex>
        </Card>
      </Grid>

      {topSites.length > 0 && (
        <Card>
          <Title>Site Performance Ranking</Title>
          <Text className="mt-1 text-zinc-500">
            Top &amp; bottom sites by service level
          </Text>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Site</TableHeaderCell>
                  <TableHeaderCell>Region</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell className="text-right">Service Level</TableHeaderCell>
                  <TableHeaderCell className="text-right">Labour Cost</TableHeaderCell>
                  <TableHeaderCell className="text-right">Agency Ratio</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topSites.slice(0, 10).map((s) => (
                  <TableRow key={s.site_id}>
                    <TableCell className="font-medium">{s.site_name}</TableCell>
                    <TableCell>{s.region}</TableCell>
                    <TableCell>{s.site_type}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        color={
                          s.avg_service_level >= 0.92
                            ? "emerald"
                            : s.avg_service_level >= 0.85
                              ? "amber"
                              : "red"
                        }
                      >
                        {formatPercent(s.avg_service_level)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatCurrency(s.labour_cost)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">{formatPercent(s.agency_ratio)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
