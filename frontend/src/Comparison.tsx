import { usePreferences } from "./preferences";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { Result } from "./types";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);
export default function Comparison({ result }: { result: Result }) {
  const display = usePreferences();
  const tick = display.dark ? "#b7c6ad" : "#596b50";
  return (
    <div className="comparison-chart">
      <Bar
        aria-label={`Baseline ${result.baseline}, scenario ${result.scenario} ${result.unit}`}
        role="img"
        data={{
          labels: ["Baseline", "Your scenario"],
          datasets: [
            {
              data: [result.baseline, result.scenario],
              backgroundColor: ["#d9e2da", "#487959"],
              borderRadius: 6,
              barThickness: 52,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: tick },
              grid: { color: display.dark ? "#344638" : "#edf0eb" },
            },
            x: {
              ticks: { color: tick },
              grid: { display: false },
              border: { display: false },
            },
          },
        }}
      />
    </div>
  );
}
