import ProgressCircle from "./ProgressCircle";

interface StatBoxProps {
  loading: boolean;
  Icon: React.ComponentType<{ className?: string }>; // Accepts icon component
  title: string;
  subtitle: string;
  progress?: number;
  increase?: number;
}

const StatBox: React.FC<StatBoxProps> = ({ title, subtitle, Icon, progress, increase, loading }) => {
  return (
    <div className="col-span-4 bg-primary-400 flex items-center justify-center">
      <div className="w-full px-7.5 flex justify-between items-center">
        <div className="w-[75%] flex flex-col items-start">
          {loading ? (
            <div className="w-full h-7.5 bg-grey-300/40 animate-pulse rounded" />
          ) : (
            <Icon className="text-green-600 text-[26px]" />
          )}
          {loading ? (
            <div className="w-full h-7.5 bg-grey-300/40 animate-pulse rounded" />
          ) : (
            <h4 className="text-xl font-bold text-grey-100">{`${title}`}</h4>
          )}
          {loading ? (
            <div className="w-full h-7.5 bg-grey-300/40 animate-pulse rounded" />
          ) : (
            <h5 className="text-base text-green-500">
              {`${subtitle} (${
                increase !== undefined ? (increase > 0 ? `+${increase}%` : `-${Math.abs(increase)}%`) : "N/A"
              })`}
            </h5>
          )}
        </div>

        <div className="w-[20%]">
          {loading ? (
            <div className="h-full aspect-square bg-grey-300/40 animate-pulse rounded-full" />
          ) : (
            <ProgressCircle progress={progress} />
          )}
        </div>
      </div>
    </div>
  );
};

export default StatBox;
