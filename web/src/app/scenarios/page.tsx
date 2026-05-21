"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Card,
  Grid,
  Title,
  Text,
  BarChart,
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
  avg_absence_rate: number;
  agency_ratio: number;
};

type SiteCost = {
  site_id: number;
  site_name: string;
  region: string;
  archetype: string;
  labour_cost: number;
  agency_cost: number;
  overtime_cost: number;
  absence_rate: number;
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

export default function Scenarios() {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [siteCosts, setSiteCosts] = useState<SiteCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [dailyResult, siteResult, archResult] = await Promise.all([
        supabase.from("daily_operations").select(
          "labour_cost_gbp, agency_cost_gbp, overtime_cost_gbp"
        ),
        supabase.rpc("site_performance_ranking"),
        supabase.from("site_archetypes").select("site_id, archetype, avg_absence_rate, avg_agency_ratio"),
      ]);

      if (dailyResult.data) {
        const rows = dailyResult.data;
        setKpi({
          total_labour_cost: rows.reduce((s, r) => s + Number(r.labour_cost_gbp), 0),
          total_agency_cost: rows.reduce((s, r) => s + Number(r.agency_cost_gbp), 0),
          total_overtime_cost: rows.reduce((s, r) => s + Number(r.overtime_cost_gbp), 0),
          avg_absence_rate: 0,
          agency_ratio: 0,
        });
      }

      if (siteResult.data && archResult.data) {
        const archMap = new Map(
          (archResult.data as any[]).map((a) => [a.site_id, a])
        );
        const combined: SiteCost[] = (siteResult.data as any[]).map((s) => {
          const arch = archMap.get(s.site_id);
          return {
            site_id: s.site_id,
            site_name: s.site_name,
            region: s.region,
            archetype: arch?.archetype ?? "Unknown",
            labour_cost: Number(s.labour_cost),
            agency_cost: Number(s.agency_cost) || Number(s.labour_cost) * 0.05,
            overtime_cost: Number(s.overtime_cost) || Number(s.labour_cost) * 0.01,
            absence_rate: arch?.avg_absence_rate ?? 0,
            agency_ratio: arch?.avg_agency_ratio ?? Number(s.agency_ratio),
          };
        });
        setSiteCosts(combined.sort((a, b) => b.labour_cost - a.labour_cost));
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
          <div className="h-4 w-64 bg-zinc-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-zinc-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalCost = kpi?.total_labour_cost ?? 1;
  const agencyPct = ((kpi?.total_agency_cost ?? 0) / totalCost) * 100;
  const overtimePct = ((kpi?.total_overtime_cost ?? 0) / totalCost) * 100;

  // Scenario calculations
  const reduceAgencyByHalf = (kpi?.total_agency_cost ?? 0) * 0.5;
  const reduceOvertimeByThird = (kpi?.total_overtime_cost ?? 0) * 0.33;
  const totalSavings = reduceAgencyByHalf + reduceOvertimeByThird;

  const scenarios = [
    {
      name: "Reduce Agency Spend 50%",
      savings: reduceAgencyByHalf,
      description:
        "Convert agency staff to permanent hires at agency-heavy sites. Target: 8 sites with highest agency ratio.",
      icon: "50%",
    },
    {
      name: "Reduce Overtime 33%",
      savings: reduceOvertimeByThird,
      description:
        "Optimise shift scheduling and hire part-time staff to cover peak periods.",
      icon: "33%",
    },
    {
      name: "Combined Intervention",
      savings: totalSavings,
      description:
        "Both agency reduction and overtime optimisation combined.",
      icon: "Total",
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Scenario Model</h1>
        <p className="mt-1 text-zinc-500">
          Cost savings analysis and intervention modelling
        </p>
      </div>

      <Grid numItemsSm={3} className="gap-4">
        <Card decoration="top" decorationColor="blue">
          <Text>Total Labour Cost</Text>
          <Title className="mt-1">
            {kpi ? formatCurrency(kpi.total_labour_cost) : "—"}
          </Title>
        </Card>
        <Card decoration="top" decorationColor="amber">
          <Text>Agency Spend</Text>
          <Title className="mt-1">
            {kpi ? formatCurrency(kpi.total_agency_cost) : "—"}
          </Title>
          <Text className="text-xs text-zinc-400">
            {agencyPct.toFixed(1)}% of total
          </Text>
        </Card>
        <Card decoration="top" decorationColor="violet">
          <Text>Overtime Spend</Text>
          <Title className="mt-1">
            {kpi ? formatCurrency(kpi.total_overtime_cost) : "—"}
          </Title>
          <Text className="text-xs text-zinc-400">
            {overtimePct.toFixed(1)}% of total
          </Text>
        </Card>
      </Grid>

      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>Intervention Scenarios</Title>
          <div className="mt-4 space-y-4">
            {scenarios.map((s) => (
              <Card key={s.name}>
                <div className="flex items-start justify-between">
                  <div>
                    <Badge
                      color={
                        s.name === "Combined Intervention"
                          ? "emerald"
                          : "blue"
                      }
                    >
                      {s.icon}
                    </Badge>
                    <Title className="mt-2 text-base">{s.name}</Title>
                    <Text className="mt-1 text-sm text-zinc-500">
                      {s.description}
                    </Text>
                  </div>
                  <div className="text-right">
                    <Text className="text-xs text-zinc-400">Annual Savings</Text>
                    <Title className="text-emerald-600">
                      {formatCurrency(s.savings)}
                    </Title>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
        <Card>
          <Title>Savings Comparison</Title>
          <BarChart
            className="mt-4 h-64"
            data={scenarios}
            index="name"
            categories={["savings"]}
            colors={["emerald"]}
            valueFormatter={formatCurrency}
            showLegend={false}
            showGridLines
          />
          {totalSavings > 0 && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <Text className="text-emerald-800 font-medium">
                Total potential savings: {formatCurrency(totalSavings)}
              </Text>
              <Text className="text-emerald-600 text-sm mt-1">
                {((totalSavings / totalCost) * 100).toFixed(1)}% of total labour
                cost
              </Text>
            </div>
          )}
        </Card>
      </Grid>

      <Card>
        <Title>Site Cost Breakdown</Title>
        <Text className="mt-1 text-zinc-500">
          Agency and overtime spend by site
        </Text>
        <div className="mt-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Site</TableHeaderCell>
                <TableHeaderCell>Region</TableHeaderCell>
                <TableHeaderCell className="text-right">Labour Cost</TableHeaderCell>
                <TableHeaderCell className="text-right">Agency Cost</TableHeaderCell>
                <TableHeaderCell className="text-right">Overtime</TableHeaderCell>
                <TableHeaderCell className="text-right">Agency %</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {siteCosts.map((s) => (
                <TableRow key={s.site_id}>
                  <TableCell className="font-medium">{s.site_name}</TableCell>
                  <TableCell>{s.region}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(s.labour_cost)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      color={
                        s.agency_ratio > 0.1
                          ? "red"
                          : s.agency_ratio > 0.05
                            ? "amber"
                            : "emerald"
                      }
                    >
                      {formatCurrency(s.agency_cost)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(s.overtime_cost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {(s.agency_ratio * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
