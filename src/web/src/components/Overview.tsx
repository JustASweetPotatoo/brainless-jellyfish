import { useState } from "react";
import { DownloadIcon, EmailIcon, PersonIcon, TrafficIcon } from "./dashboard/icons";
import Header from "./Header";
import LineChart from "./dashboard/charts/LineChart";
import GeographyChart from "./dashboard/charts/GeographyChart";
import BarChart from "./dashboard/charts/BarChart";
import ProgressCircle from "./dashboard/charts/ProgressCircle";
import StatBox from "./dashboard/charts/StatBox";

function Overview() {
  const [recordTime, setRecordTime] = useState("1");
  const [loading, setLoading] = useState(true); // State to control loading

  const handleChange = (value: string) => {
    switch (Number(value)) {
      case 3:
        setRecordTime("3");
        break;
      case 7:
        setRecordTime("7");
        break;
      case 30:
        setRecordTime("30");
        break;
      default:
        setRecordTime("1");
        break;
    }
  };

  // Simulate loading delay
  setTimeout(() => {
    setLoading(false);
  }, 2000);

  return (
    <div className="p-[20px]">
      {/* HEADER */}
      <div className="flex justify-between items-center max-h-[10vh]">
        <Header title="Overview: Thiên Hà Của Sứa" subtitle="Welcome to SuwaClient dashboard" />
        <div>
          <button className="bg-blue-700 text-grey-100 text-sm font-bold px-5 py-2.5 rounded flex items-center gap-2.5">
            <DownloadIcon />
            Download Reports
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center py-[10px]">
        <div className="flex flex-row items-center">
          <h4 className="text-xl text-green-400 font-bold pr-4 mb-[5px]">{`Last: ${recordTime} day(s)`}</h4>
        </div>
        <select
          className="m-[5px] min-w-[120px] text-sm bg-primary-400 text-grey-100 border border-primary-500 rounded px-2 py-1.5 outline-none"
          value={recordTime}
          onChange={(e) => handleChange(e.target.value)}
        >
          <option value={1}>1</option>
          <option value={3}>3</option>
          <option value={7}>7</option>
          <option value={30}>30</option>
        </select>
      </div>

      {/* GRID & CHARTS */}
      <div className="grid grid-cols-12 gap-5 auto-rows-32.5">
        {/* ROW 1 */}
        <StatBox
          loading={loading}
          Icon={EmailIcon} // Pass the component type directly
          title="0"
          subtitle="Message Sent"
          progress={0.75}
          increase={14}
        />
        <StatBox
          loading={loading}
          Icon={PersonIcon}
          title="32,441"
          subtitle="New Members"
          progress={0.3}
          increase={5}
        />
        <StatBox
          loading={loading}
          Icon={TrafficIcon}
          title="1,325,134"
          subtitle="Traffic Received"
          progress={0.8}
          increase={43}
        />

        {/* ROW 2 */}
        <div className="col-span-6 row-span-2 bg-primary-400">
          <div className="mt-[25px] px-[30px] flex justify-between items-center">
            <div>
              {loading ? (
                <div className="w-[150px] h-4 bg-grey-300/40 animate-pulse rounded" />
              ) : (
                <h5 className="text-base font-semibold text-grey-100">Revenue Generated</h5>
              )}
              {loading ? (
                <div className="w-[100px] h-4 bg-grey-300/40 animate-pulse rounded mt-1" />
              ) : (
                <h3 className="text-2xl font-bold text-green-500">$59,342.32</h3>
              )}
            </div>
            <div>
              <button className="p-1.5 rounded hover:bg-primary-500/20 transition-colors">
                <DownloadIcon size={26} className="text-green-500" />
              </button>
            </div>
          </div>
          <div className="h-[250px] -mt-[20px]">
            {loading ? (
              <div className="h-[250px] bg-grey-300/40 animate-pulse rounded" />
            ) : (
              <LineChart isDashboard={true} />
            )}
          </div>
        </div>
        <div className="col-span-6 row-span-2 bg-primary-400">
          <div className="mt-[25px] px-[30px] flex justify-between items-center">
            <div>
              {loading ? (
                <div className="w-[150px] h-4 bg-grey-300/40 animate-pulse rounded" />
              ) : (
                <h5 className="text-base font-semibold text-grey-100">Revenue Generated</h5>
              )}
              {loading ? (
                <div className="w-[100px] h-4 bg-grey-300/40 animate-pulse rounded mt-1" />
              ) : (
                <h3 className="text-2xl font-bold text-green-500">$59,342.32</h3>
              )}
            </div>
            <div>
              <button className="p-1.5 rounded hover:bg-primary-500/20 transition-colors">
                <DownloadIcon size={26} className="text-green-500" />
              </button>
            </div>
          </div>
          <div className="h-[250px] -mt-[20px]">
            {loading ? (
              <div className="h-[250px] bg-grey-300/40 animate-pulse rounded" />
            ) : (
              <LineChart isDashboard={true} />
            )}
          </div>
        </div>

        {/* ROW 3 */}
        <div className="col-span-4 row-span-2 bg-primary-400 p-[30px]">
          <h5 className="text-base font-semibold">Campaign</h5>
          <div className="flex flex-col items-center mt-[25px]">
            {loading ? (
              <div className="w-[125px] h-[125px] bg-grey-300/40 animate-pulse rounded-full" />
            ) : (
              <ProgressCircle size="125" />
            )}
            {loading ? (
              <div className="w-[200px] h-4 bg-grey-300/40 animate-pulse rounded mt-[15px]" />
            ) : (
              <h5 className="text-base text-green-500 mt-[15px]">$48,352 revenue generated</h5>
            )}
            {loading ? (
              <div className="w-[150px] h-4 bg-grey-300/40 animate-pulse rounded mt-1" />
            ) : (
              <p>Includes extra misc expenditures and costs</p>
            )}
          </div>
        </div>
        <div className="col-span-4 row-span-2 bg-primary-400">
          <h5 className="text-base font-semibold px-[30px] pt-[30px]">Sales Quantity</h5>
          <div className="h-[250px] -mt-[20px]">
            {loading ? (
              <div className="h-[250px] bg-grey-300/40 animate-pulse rounded" />
            ) : (
              <BarChart isDashboard={true} />
            )}
          </div>
        </div>
        <div className="col-span-4 row-span-2 bg-primary-400 p-[30px]">
          <h5 className="text-base font-semibold mb-[15px]">Geography Based Traffic</h5>
          <div className="h-[200px]">
            {loading ? (
              <div className="h-[200px] bg-grey-300/40 animate-pulse rounded" />
            ) : (
              <GeographyChart isDashboard={true} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;
