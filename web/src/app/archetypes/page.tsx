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
  Flex,
  DonutChart,
} from "@tremor/react";

type ArchetypeRow = {
  site_id: number;
  site_name: string;
  region: string;
  site_type: string;
  cluster: number;
  archetype: string;
  pca_x: number;
  pca_y: number;
  avg_absence_rate: number;
  avg_turnover: number;
  avg_agency_ratio: number;
  avg_service_level: number;
  avg_cost_per_hour: number;
  total_labour_cost: number;
  weekend_sl_gap: number;
  demand_volatility: number;
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

const CLUSTER_COLORS: Record<number, string> = {
  0: "blue",
  1: "amber",
  2: "violet",
  3: "emerald",
};

const INTERVENTION_MAP: Record<string, string> = {
  "Agency-Dependent + High-Absence + Volatile-Demand + Forecast-Poor":
    "Reduce agency dependency through permanent hiring; improve demand forecasting; implement absence management program",
  "High-Absence + Weekend-SL-Gap + Low-SL + High-Cost + Volatile-Demand":
    "Target weekend staffing gaps with shift incentives; review cost structure; address absence drivers",
  "Agency-Dependent + Volatile-Demand":
    "Build flexible permanent workforce; consider flexi-time contracts to reduce agency spend",
  "Agency-Dependent + Weekend-SL-Gap + Low-SL + High-Cost + Volatile-Demand":
    "High priority: reduce agency costs, close weekend gaps, and optimise scheduling for Large sites",
};

export default function Archetypes() {
  const [data, setData] = useState<ArchetypeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: result } = await supabase
        .from("site_archetypes")
        .select("*");
      if (result) setData(result as ArchetypeRow[]);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-72 bg-zinc-200 rounded-xl" />
            <div className="h-72 bg-zinc-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const clusters = [...new Set(data.map((d) => d.cluster))].sort();
  const clusterCounts = clusters.map((c) => ({
    cluster: `Cluster ${c}`,
    count: data.filter((d) => d.cluster === c).length,
  }));

  const archetypeGroups: Record<string, ArchetypeRow[]> = {};
  for (const d of data) {
    if (!archetypeGroups[d.archetype]) archetypeGroups[d.archetype] = [];
    archetypeGroups[d.archetype].push(d);
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Site Archetypes</h1>
        <p className="mt-1 text-zinc-500">
          Clustered site patterns from KMeans analysis and suggested interventions
        </p>
      </div>

      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>Cluster Distribution</Title>
          <DonutChart
            className="mt-4 h-64"
            data={clusterCounts}
            category="count"
            index="cluster"
            colors={["blue", "amber", "violet", "emerald"]}
            valueFormatter={(v) => `${v} sites`}
            showLabel={false}
            showTooltip
          />
        </Card>
        <Card>
          <Title>Key Metrics by Archetype</Title>
          <BarChart
            className="mt-4 h-64"
            data={Object.entries(archetypeGroups).map(([name, sites]) => ({
              archetype: name.split("+")[0].trim(),
              "Avg Service Level": parseFloat(
                (
                  sites.reduce((s, d) => s + d.avg_service_level, 0) /
                  sites.length
                ).toFixed(2)
              ),
              "Avg Absence %": parseFloat(
                (
                  sites.reduce((s, d) => s + d.avg_absence_rate, 0) /
                  sites.length
                ).toFixed(2)
              ),
            }))}
            index="archetype"
            categories={["Avg Service Level", "Avg Absence %"]}
            colors={["emerald", "rose"]}
            valueFormatter={(v) => v.toFixed(1)}
            showLegend
            showGridLines
          />
        </Card>
      </Grid>

      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>PCA Projection</Title>
          <Text className="mt-1 text-zinc-500">
            2D projection of site feature space (PCA)
          </Text>
          <div className="mt-4 h-64 relative">
            <svg viewBox="0 0 400 300" className="w-full h-full">
              {data.map((d, i) => {
                const x = ((d.pca_x + 3) / 6) * 380 + 10;
                const y = ((d.pca_y + 3) / 6) * 260 + 20;
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={6}
                      fill={
                        d.cluster === 0
                          ? "#3b82f6"
                          : d.cluster === 1
                            ? "#f59e0b"
                            : d.cluster === 2
                              ? "#8b5cf6"
                              : "#10b981"
                      }
                      opacity={0.7}
                    />
                    <title>{d.site_name}</title>
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>
        <Card>
          <Title>Intervention Recommendations</Title>
          {Object.entries(archetypeGroups).map(([archetype, sites]) => (
            <div key={archetype} className="mt-3 pb-3 border-b border-zinc-100 last:border-0">
              <Flex>
                <Badge color={CLUSTER_COLORS[sites[0].cluster]}>
                  {sites.length} sites
                </Badge>
                <Text className="text-xs text-zinc-400 ml-2">{archetype}</Text>
              </Flex>
              <Text className="mt-1 text-sm text-zinc-600">
                {INTERVENTION_MAP[archetype] || "Review operational practices"}
              </Text>
            </div>
          ))}
        </Card>
      </Grid>

      <Card>
        <Title>All Sites — Archetype Classification</Title>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Site</TableHeaderCell>
                <TableHeaderCell>Region</TableHeaderCell>
                <TableHeaderCell>Archetype</TableHeaderCell>
                <TableHeaderCell className="text-right">Service Level</TableHeaderCell>
                <TableHeaderCell className="text-right">Absence</TableHeaderCell>
                <TableHeaderCell className="text-right">Agency Ratio</TableHeaderCell>
                <TableHeaderCell className="text-right">Cost/Hour</TableHeaderCell>
                <TableHeaderCell className="text-right">Weekend SL Gap</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.site_id}>
                  <TableCell className="font-medium whitespace-nowrap">{d.site_name}</TableCell>
                  <TableCell>{d.region}</TableCell>
                  <TableCell>
                    <Badge color={CLUSTER_COLORS[d.cluster]} size="sm">
                      {d.archetype.split("+")[0].trim()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      color={
                        d.avg_service_level >= 0.90
                          ? "emerald"
                          : d.avg_service_level >= 0.85
                            ? "amber"
                            : "red"
                      }
                    >
                      {formatPercent(d.avg_service_level)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatPercent(d.avg_absence_rate / 100)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatPercent(d.avg_agency_ratio)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(d.avg_cost_per_hour)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {(d.weekend_sl_gap * 100).toFixed(1)}%
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
