"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Hash,
  Building2,
  Calendar,
  Layers,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MicroLabel } from "@/components/common/MicroLabel";
import { SynthesizeButton } from "@/components/ai/SynthesizeButton";
import { motion } from "framer-motion";
import {
  getTrends,
  getRecordsPerDay,
  getEntityFrequency,
  getGeoDistribution,
  getDuplicates,
  getProcessingStats,
} from "@/lib/api";
import {
  TrendsResponse,
  DayRecordCount,
  EntityFrequency,
  GeoDistributionItem,
  DuplicateMatch,
  ProcessingStats,
} from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";

export default function AnalyticsPage() {
  const [interval, setInterval] = useState<"week" | "month">("month");
  const [daysWindow, setDaysWindow] = useState<number>(90);

  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [dailyData, setDailyData] = useState<DayRecordCount[]>([]);
  const [topEntities, setTopEntities] = useState<EntityFrequency[]>([]);
  const [geoData, setGeoData] = useState<GeoDistributionItem[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchAllAnalytics() {
      setLoading(true);
      try {
        const [
          trendsRes,
          dailyRes,
          entitiesRes,
          geoRes,
          dupRes,
          statsRes,
        ] = await Promise.all([
          getTrends(interval),
          getRecordsPerDay(daysWindow),
          getEntityFrequency(10),
          getGeoDistribution(),
          getDuplicates(0.6),
          getProcessingStats(),
        ]);

        setTrends(trendsRes);
        setDailyData(dailyRes);
        setTopEntities(entitiesRes);
        setGeoData(geoRes);
        setDuplicates(dupRes);
        setProcessingStats(statsRes);
      } catch (err) {
        console.error("Failed to load analytics data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllAnalytics();
  }, [interval, daysWindow]);

  const CustomDailyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="p-3 bg-brivo-void border border-brivo-navy/20 rounded-md shadow-xl text-xs space-y-1 font-mono text-brivo-paper">
          <div className="text-brivo-slate font-semibold">{formatDate(label)}</div>
          <div className="text-brivo-cyan">Orders: {d.count}</div>
          <div className="text-brivo-mist">Penalties: {formatINR(d.total_penalty)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-brivo-navy/10 pb-6">
        <div className="space-y-2">
          <MicroLabel number="N°03" label="ANALYTICS & AGGREGATIONS" />
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-brivo-navy font-sans">
            Enforcement Trends & <span className="font-serif italic font-normal">Market Analytics</span>
          </h1>
          <p className="text-xs text-brivo-slate">
            Live aggregated metrics, period-over-period trend velocities, geographic distribution, and near-duplicate cluster detection.
          </p>
        </div>

        {/* Interval Switcher & AI Button */}
        <div className="flex flex-wrap items-center gap-2">
          <SynthesizeButton
            label="Synthesize Market Risk"
            variant="outline"
            className="shadow-sm"
          />

          <div className="flex items-center p-1 rounded-full bg-white border border-brivo-navy/15 shadow-sm">
            <button
              onClick={() => setInterval("week")}
              className="relative px-3.5 py-1 rounded-full text-xs font-mono transition-colors"
            >
              {interval === "week" && (
                <motion.div
                  layoutId="analyticsIntervalPill"
                  className="absolute inset-0 rounded-full bg-brivo-navy shadow-sm"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <span
                className={`relative z-10 ${
                  interval === "week"
                    ? "text-brivo-paper font-semibold"
                    : "text-brivo-slate hover:text-brivo-navy"
                }`}
              >
                Weekly Horizon
              </span>
            </button>
            <button
              onClick={() => setInterval("month")}
              className="relative px-3.5 py-1 rounded-full text-xs font-mono transition-colors"
            >
              {interval === "month" && (
                <motion.div
                  layoutId="analyticsIntervalPill"
                  className="absolute inset-0 rounded-full bg-brivo-navy shadow-sm"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <span
                className={`relative z-10 ${
                  interval === "month"
                    ? "text-brivo-paper font-semibold"
                    : "text-brivo-slate hover:text-brivo-navy"
                }`}
              >
                Monthly Horizon
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. ROLLING TREND CARDS */}
      {trends && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1: Orders Trend */}
          <div className="p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-brivo-slate">
              <span>Orders Published</span>
              <Scale className="w-4 h-4 text-brivo-slate" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold font-mono text-brivo-navy">
                {trends.total_orders_trend.current_value}
              </span>
              <span
                className={`text-xs font-mono flex items-center gap-0.5 ${
                  trends.total_orders_trend.percentage_change >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {trends.total_orders_trend.percentage_change >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{trends.total_orders_trend.percentage_change}% vs prior</span>
              </span>
            </div>
            <p className="text-[0.65rem] font-mono text-brivo-slate">
              Prior period baseline: {trends.total_orders_trend.previous_value} orders
            </p>
          </div>

          {/* Card 2: Penalties Trend */}
          <div className="p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-brivo-slate">
              <span>Aggregate Penalties (INR)</span>
              <Hash className="w-4 h-4 text-brivo-slate" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold font-mono text-brivo-navy">
                {formatINR(trends.total_penalties_trend.current_value)}
              </span>
              <span
                className={`text-xs font-mono flex items-center gap-0.5 ${
                  trends.total_penalties_trend.percentage_change >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {trends.total_penalties_trend.percentage_change >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{trends.total_penalties_trend.percentage_change}% vs prior</span>
              </span>
            </div>
            <p className="text-[0.65rem] font-mono text-brivo-slate">
              Prior period: {formatINR(trends.total_penalties_trend.previous_value)}
            </p>
          </div>

          {/* Card 3: Entities Tracked */}
          <div className="p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono text-brivo-slate">
              <span>Active Tracked Noticees</span>
              <Building2 className="w-4 h-4 text-brivo-slate" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold font-mono text-brivo-navy">
                {trends.active_entities_trend.current_value}
              </span>
              <span className="text-xs font-mono text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.5% expansion</span>
              </span>
            </div>
            <p className="text-[0.65rem] font-mono text-brivo-slate">
              Tracked across company & individual roles
            </p>
          </div>
        </div>
      )}

      {/* 2. DAILY RECORDS TIME-SERIES CHART */}
      <div className="p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-brivo-navy flex items-center gap-2">
              <Scale className="w-4 h-4 text-brivo-navy" />
              <span>Adjudication Orders Timeline</span>
            </h2>
            <p className="text-xs text-brivo-slate">
              Daily frequency of regulatory enforcement actions and associated penalty amounts.
            </p>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[0.65rem]">
            <button
              onClick={() => setDaysWindow(30)}
              className={`px-2.5 py-1 rounded ${daysWindow === 30 ? "bg-brivo-navy text-brivo-paper font-semibold" : "bg-brivo-paper text-brivo-slate hover:text-brivo-navy border border-brivo-navy/10"}`}
            >
              30D
            </button>
            <button
              onClick={() => setDaysWindow(90)}
              className={`px-2.5 py-1 rounded ${daysWindow === 90 ? "bg-brivo-navy text-brivo-paper font-semibold" : "bg-brivo-paper text-brivo-slate hover:text-brivo-navy border border-brivo-navy/10"}`}
            >
              90D
            </button>
            <button
              onClick={() => setDaysWindow(180)}
              className={`px-2.5 py-1 rounded ${daysWindow === 180 ? "bg-brivo-navy text-brivo-paper font-semibold" : "bg-brivo-paper text-brivo-slate hover:text-brivo-navy border border-brivo-navy/10"}`}
            >
              180D
            </button>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00c2d1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00c2d1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,35,51,0.06)" />
              <XAxis
                dataKey="date"
                tickFormatter={(val) => formatDate(val)}
                stroke="#98a2b3"
                tick={{ fontSize: 10, fontFamily: "monospace" }}
              />
              <YAxis
                stroke="#98a2b3"
                tick={{ fontSize: 10, fontFamily: "monospace" }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomDailyTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#00c2d1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#orderGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. TWO-COLUMN: TOP NOTICEES & GEOGRAPHIC DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Noticees Bar Chart */}
        <div className="p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-brivo-navy flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brivo-navy" />
              <span>Top Entities by Enforcement Frequency</span>
            </h2>
            <p className="text-xs text-brivo-slate">
              Noticees with the highest aggregate penalty actions.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {topEntities.map((ent, idx) => (
              <Link
                key={ent.id}
                href={`/entities/${ent.id}`}
                className="flex items-center justify-between p-2.5 rounded bg-brivo-paper hover:bg-brivo-mist/40 border border-brivo-navy/10 transition-all text-xs group"
              >
                <div className="flex items-center gap-2.5 max-w-[65%]">
                  <span className="font-mono text-[0.65rem] text-brivo-slate w-4">
                    #{idx + 1}
                  </span>
                  <span className="text-brivo-navy group-hover:text-brivo-cyan font-medium truncate">
                    {ent.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[0.7rem]">
                  <span className="text-brivo-slate">{ent.record_count} orders</span>
                  <span className="text-brivo-navy font-semibold">{formatINR(ent.total_penalty)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-brivo-navy flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brivo-navy" />
              <span>State-Level Enforcement Distribution</span>
            </h2>
            <p className="text-xs text-brivo-slate">
              Order volume across principal state jurisdictions and benches.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {geoData.map((item) => (
              <div
                key={item.state}
                className="p-3 rounded bg-brivo-paper border border-brivo-navy/10 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="text-brivo-navy font-semibold">{item.state}</span>
                  <span className="text-brivo-navy">{formatINR(item.total_penalty)}</span>
                </div>
                <div className="flex items-center justify-between text-[0.65rem] text-brivo-slate font-mono">
                  <span>{item.record_count} total order(s)</span>
                  <span>Top hubs: {item.top_cities?.join(", ") || "State Bench"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. PROCESSING STATS & DUPLICATE DETECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Processing Stats */}
        <div className="p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-brivo-navy flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>ETL Ingestion Engine Stats</span>
            </h2>
            <p className="text-xs text-brivo-slate">
              Crawler reliability and pipeline performance.
            </p>
          </div>

          {processingStats && (
            <div className="space-y-3 text-xs font-mono pt-2">
              <div className="flex justify-between p-2 rounded bg-brivo-paper border border-brivo-navy/10">
                <span className="text-brivo-slate">Total Crawl Runs</span>
                <span className="text-brivo-navy font-medium">{processingStats.total_runs}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-brivo-paper border border-brivo-navy/10">
                <span className="text-brivo-slate">Success Rate</span>
                <span className="text-emerald-600 font-medium">{processingStats.success_rate_percent}%</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-brivo-paper border border-brivo-navy/10">
                <span className="text-brivo-slate">Avg Execution Latency</span>
                <span className="text-brivo-navy font-medium">{processingStats.average_duration_seconds}s</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-brivo-paper border border-brivo-navy/10">
                <span className="text-brivo-slate">Records Synchronized</span>
                <span className="text-brivo-navy font-medium">{processingStats.total_records_ingested}</span>
              </div>
            </div>
          )}
        </div>

        {/* Near Duplicate Detection */}
        <div className="lg:col-span-2 p-6 rounded-lg bg-white border border-brivo-navy/10 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-brivo-navy flex items-center gap-2">
                <Layers className="w-4 h-4 text-brivo-navy" />
                <span>Near-Duplicate & Cross-Reference Detector</span>
              </h2>
              <p className="text-xs text-brivo-slate">
                Fuzzy similarity matches and multi-respondent linked proceedings.
              </p>
            </div>
            <span className="text-[0.65rem] font-mono px-2 py-0.5 rounded bg-brivo-paper border border-brivo-navy/15 text-brivo-slate">
              {duplicates.length} Clusters Found
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {duplicates.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-brivo-slate">
                No duplicate or clustered proceedings detected above similarity threshold.
              </div>
            ) : (
              duplicates.slice(0, 3).map((dup, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded bg-brivo-paper border border-brivo-navy/10 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded bg-brivo-mist border border-brivo-cyan/30 text-brivo-navy font-medium">
                      Similarity Score: {(dup.similarity_score * 100).toFixed(0)}%
                    </span>
                    <span className="text-[0.65rem] font-mono text-brivo-slate">
                      {dup.reason}
                    </span>
                  </div>

                  <div className="space-y-1 text-brivo-navy font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-brivo-navy shrink-0" />
                      <span className="font-medium truncate">{dup.primary_title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-brivo-slate pl-3.5">
                      <span className="text-brivo-slate/60">↳</span>
                      <span className="truncate">{dup.duplicate_title}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
