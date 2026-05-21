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
  Select,
  SelectItem,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@tremor/react";

type ForecastRow = {
  site_id: number;
  forecast_date: string;
  demand_forecast: number | null;
  service_level_forecast: number | null;
  cost_forecast: number | null;
};

type SiteInfo = {
  site_id: number;
  site_name: string;
  region: string;
  site_type: string;
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

export default function Forecasting() {
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [forecasts, setForecasts] = useState<ForecastRow[]>([]);
  const [monthlyActuals, setMonthlyActuals] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInitial() {
      const [siteResult, forecastResult, actualResult] = await Promise.all([
        supabase.from("site_master").select("site_id, site_name, region, site_type"),
        supabase.from("demand_forecasts").select("*").order("site_id").order("forecast_date"),
        supabase.rpc("monthly_trends"),
      ]);

      if (siteResult.data) {
        setSites(siteResult.data as SiteInfo[]);
        if (siteResult.data.length > 0) {
          setSelectedSite(siteResult.data[0].site_id);
        }
      }

      if (forecastResult.data) {
        setForecasts(forecastResult.data as ForecastRow[]);
      }

      if (actualResult.data) {
        setMonthlyActuals(
          actualResult.data.map((r: any) => ({
            month: new Date(r.month).toLocaleDateString("en-GB", {
              month: "short",
              year: "2-digit",
            }),
            actual_demand: Number(r.labour_cost) / 120,
          }))
        );
      }

      setLoading(false);
    }
    fetchInitial();
  }, []);

  const siteForecasts = selectedSite
    ? forecasts.filter((f) => f.site_id === selectedSite)
    : [];

  const selectedInfo = sites.find((s) => s.site_id === selectedSite);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-56 bg-zinc-200 rounded" />
          <div className="h-4 w-64 bg-zinc-200 rounded" />
          <div className="h-64 bg-zinc-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const chartData = siteForecasts.map((f) => ({
    date: new Date(f.forecast_date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
    "Demand Forecast": f.demand_forecast ?? 0,
    "SL Forecast": f.service_level_forecast ?? 0,
  }));

  const avgForecast =
    siteForecasts.length > 0
      ? siteForecasts.reduce((s, f) => s + (f.demand_forecast ?? 0), 0) /
        siteForecasts.length
      : 0;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Demand Forecasting</h1>
        <p className="mt-1 text-zinc-500">
          Actual vs forecast demand and accuracy metrics
        </p>
      </div>

      <Grid numItemsLg={2} className="gap-6">
        <Card>
          <Title>Historical Demand (Monthly)</Title>
          <AreaChart
            className="mt-4 h-64"
            data={monthlyActuals}
            index="month"
            categories={["actual_demand"]}
            colors={["blue"]}
            valueFormatter={(v) => v.toFixed(0)}
            showLegend={false}
            showGridLines
          />
        </Card>
        <Card>
          <Title>Forecast Accuracy by Site</Title>
          <Text className="mt-1 text-zinc-500">
            Average 8-week demand forecast per site
          </Text>
          <BarChart
            className="mt-4 h-64"
            data={sites.slice(0, 15).map((s) => {
              const fc = forecasts.filter((f) => f.site_id === s.site_id);
              const avg =
                fc.length > 0
                  ? fc.reduce((sum, f) => sum + (f.demand_forecast ?? 0), 0) /
                    fc.length
                  : 0;
              return { site: s.site_name.split(" COG")[0], forecast: avg };
            })}
            index="site"
            categories={["forecast"]}
            colors={["violet"]}
            valueFormatter={(v) => v.toFixed(0)}
            showLegend={false}
            showGridLines
          />
        </Card>
      </Grid>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <Title>Site-Level Forecast Detail</Title>
            <Text className="mt-1 text-zinc-500">
              {selectedInfo
                ? `${selectedInfo.site_name} — ${selectedInfo.region}`
                : "Select a site"}
            </Text>
          </div>
          <div className="w-56">
            <Select
              value={String(selectedSite ?? "")}
              onValueChange={(v) => setSelectedSite(Number(v))}
            >
              {sites.map((s) => (
                <SelectItem key={s.site_id} value={String(s.site_id)}>
                  {s.site_name}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        {selectedSite && (
          <>
            <Grid numItemsSm={3} className="mt-6 gap-4">
              <Card decoration="top" decorationColor="blue">
                <Text>Avg Demand Forecast</Text>
                <Title className="mt-1">{avgForecast.toFixed(0)}</Title>
                <Text className="text-xs text-zinc-400">Next 8 weeks</Text>
              </Card>
              <Card decoration="top" decorationColor="emerald">
                <Text>Avg SL Forecast</Text>
                <Title className="mt-1">
                  {siteForecasts.length > 0
                    ? formatPercent(
                        siteForecasts.reduce(
                          (s, f) => s + (f.service_level_forecast ?? 0),
                          0
                        ) / siteForecasts.length
                      )
                    : "—"}
                </Title>
                <Text className="text-xs text-zinc-400">Next 8 weeks</Text>
              </Card>
              <Card decoration="top" decorationColor="violet">
                <Text>Forecast Horizon</Text>
                <Title className="mt-1">56 days</Title>
                <Text className="text-xs text-zinc-400">
                  {siteForecasts[0]?.forecast_date} –{" "}
                  {siteForecasts[siteForecasts.length - 1]?.forecast_date}
                </Text>
              </Card>
            </Grid>

            <div className="mt-6">
              <Title>Demand Forecast (Daily)</Title>
              <AreaChart
                className="mt-4 h-72"
                data={chartData}
                index="date"
                categories={["Demand Forecast"]}
                colors={["blue"]}
                valueFormatter={(v) => v.toFixed(0)}
                showLegend={false}
                showGridLines
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
