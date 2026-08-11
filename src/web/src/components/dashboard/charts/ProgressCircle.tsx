const ProgressCircle = ({ progress = 0.75, size = "80%" }) => {
  const angle = progress * 360;
  return (
    <div
      style={{
        height: size,
        aspectRatio: "1 / 1",
        background: `radial-gradient(var(--c-primary-400) 55%, transparent 56%),
            conic-gradient(transparent 0deg ${angle}deg, var(--c-blue-500) ${angle}deg 360deg),
            var(--c-green-500)`,
        borderRadius: "50%",
      }}
    />
  );
};

export default ProgressCircle;
