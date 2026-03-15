import React, { useEffect, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

const MAX_SECONDS = 60; // 1 phút
const MAX_MINUTES = 10; // 10 phút

type Point = {
  timeseconds: string;
  rate: number;
};

interface UsageLineChartProps {
  id: string;
  data: Array<any>;
}

const UsageChart: React.FC<UsageLineChartProps> = (_props) => {
  const [data, setData] = useState<Point[]>(
    (() => {
      const arr: Point[] = [];

      for (let i = 0; i < MAX_MINUTES; i++) {
        arr.push({
          timeseconds: new Date(
            (Math.floor(Date.now() / 1000 / 60) - (MAX_MINUTES - i)) * 60 * 1000
          ).toLocaleTimeString(),
          rate: 0,
        });
      }

      return arr;
    })()
  );
  const [socketState, setSocketState] = useState(false);

  useEffect(() => {
    if (!ws && !socketState) {
      console.log("Connecting...");
      connect();
    }
  }, [socketState]);

  let ws: WebSocket;

  const connect = () => {
    if (ws && ws.OPEN) return;

    ws = new WebSocket("ws://localhost:3000/message-monitor");

    ws.onmessage = (event) => {
      const incoming = JSON.parse(event.data);
      const pointValue = new Date(incoming.timeseconds * 1000);

      const newPoint: Point = {
        timeseconds: pointValue.toLocaleTimeString(),
        rate: incoming.rate,
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
      setSocketState(false);
    };
  };

  useEffect(() => {
    connect();
  }, []);

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
    // title: {
    //   text: "Guild 811939594882777128 real-time monitor (MPS/Message per second)",
    //   left: "center",
    //   textStyle: {
    //     color: "#fff",
    //     fontSize: 14,
    //     fontWeight: "bold",
    //   },
    // },

    legend: {
      show: true,
      top: 0,
      textStyle: {
        color: "#9CA3AF",
      },
    },

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
      data: data.map((d) => d.timeseconds),
      axisLine: { lineStyle: { color: "#374151" } },
      axisLabel: { color: "#9CA3AF" },
    },

    yAxis: {
      type: "value",
      min: 0,

      max: (value: any) => {
        return Math.max(5, value.max);
      },

      axisLine: { show: false },
      splitLine: {
        lineStyle: { color: "rgba(255,255,255,0.08)" },
      },
      axisLabel: { color: "#9CA3AF" },
    },

    series: [
      {
        name: "MPS",
        type: "line",
        smooth: false,

        showSymbol: true,
        symbol: "none",

        data: data.map((d) => d.rate),

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
        freezeRef.current = true;
      }, 80);
    },

    /** Mouse rời chart */
    globalout: () => {
      freezeRef.current = false;
      hoveredIndexRef.current = null;
      chartRef.current?.getEchartsInstance().dispatchAction({ type: "hideTip" });
    },
  };

  return (
    <div className="p-10">
      <ReactECharts ref={chartRef} option={option} onEvents={onEvents} />
    </div>
  );
};

export default UsageChart;
