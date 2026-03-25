import React, { useEffect, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

const MAX_SECONDS = 60; // 1 phút
const UPDATE_INTERVAL = 1000; // 1s

type Point = {
  time: string;
  value: number;
};

interface UsageLineChartProps {
  id: string;
  data: Array<any>;
}

const UsageChart: React.FC<UsageLineChartProps> = (props) => {
  const [data, setData] = useState<Point[]>(
    (() => {
      const arr: Point[] = [];

      for (let i = 0; i < MAX_SECONDS; i++) {
        arr.push({
          time: new Date(
            Date.now() - (MAX_SECONDS - i) * UPDATE_INTERVAL
          ).toLocaleTimeString(),
          value: 70 + Math.random() * 25,
        });
      }

      return arr;
    })()
  );

  useEffect(() => {
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket("ws://localhost:3000/server-stats");

      ws.onopen = () => {
        console.log("WS Connected 🚀");
      };

      ws.onmessage = (event) => {
        const incoming = JSON.parse(event.data);
        const nodeDate = new Date(incoming.timeseconds);

        const timeString =
          event.data % 60 == 0
            ? nodeDate.toLocaleTimeString()
            : (event.data % 60).toString();

        console.log(timeString);

        const newPoint: Point = {
          time: timeString,
          value: incoming.value,
        };

        setData((prev) => {
          const updated = [...prev, newPoint];

          if (updated.length > MAX_SECONDS) {
            updated.shift();

            if (hoveredIndexRef.current !== null) {
              hoveredIndexRef.current -= 1;

              if (hoveredIndexRef.current < 0) {
                hoveredIndexRef.current = null;
              }
            }
          }

          return updated;
        });
      };

      ws.onclose = () => {
        console.log("Reconnect...");
        setTimeout(connect, 2000);
      };
    };

    connect();

    return () => ws?.close();
  }, [setData]);

  const chartRef = useRef<ReactECharts>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const freezeRef = useRef(false);
  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) return;

    if (freezeRef.current) {
      const index = hoveredIndexRef.current;
      if (index === null) return;
      if (index >= data.length) return;
      chart.dispatchAction({
        type: "showTip",
        seriesIndex: 0,
        dataIndex: index,
      });
    }
  }, [data]);

  const option: EChartsOption = {
    animation: false,

    backgroundColor: "transparent",

    tooltip: {
      trigger: "axis",
      transitionDuration: 0.2,

      axisPointer: {
        type: "line",
        snap: true,
        animation: true,
        animationDurationUpdate: 200,
        lineStyle: {
          color: "#A78BFA",
        },
      },

      backgroundColor: "#111827",
      borderWidth: 0,
      textStyle: { color: "#fff" },
    },

    grid: {
      left: 50,
      right: 20,
      top: 20,
      bottom: 40,
    },

    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((d) => d.time),
      axisLine: { lineStyle: { color: "#374151" } },
      axisLabel: { color: "#9CA3AF" },
    },

    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLine: { show: false },
      splitLine: {
        lineStyle: { color: "rgba(255,255,255,0.08)" },
      },
      axisLabel: { color: "#9CA3AF" },
    },

    series: [
      {
        name: "Interaction Processing Rate",
        type: "line",
        smooth: false,

        showSymbol: true,
        symbol: "none",

        data: data.map((d) => d.value),

        lineStyle: {
          width: 3,
          color: "#A78BFA",
        },

        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(167,139,250,0.35)" },
              { offset: 1, color: "rgba(167,139,250,0.02)" },
            ],
          },
        },
      },
    ],
  };

  /* ================= EVENTS ================= */

  const onEvents = {
    /** Hover realtime */
    updateAxisPointer: (e: any) => {
      if (!e.axesInfo?.length) return;

      freezeRef.current = false;

      const index = e.axesInfo[0].value + 1;
      hoveredIndexRef.current = index;

      /** Detect mouse stop */
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }

      stopTimerRef.current = setTimeout(() => {
        freezeRef.current = true; // 🧊 Freeze khi dừng chuột
      }, 80);
    },

    /** Mouse rời chart */
    globalout: () => {
      freezeRef.current = false;
      hoveredIndexRef.current = null;
      chartRef.current?.getEchartsInstance().dispatchAction({ type: "hideTip" });
    },
  };

  /* ================= RENDER ================= */

  return (
    <div style={{ height: 300 }}>
      <ReactECharts ref={chartRef} option={option} onEvents={onEvents} />
    </div>
  );
};

export default UsageChart;
