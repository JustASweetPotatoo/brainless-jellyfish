const calcNumberRender = (value: number | undefined = 0): string => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)} b`;
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} m`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} k`;
  }

  if (value) {
    return `${value}`;
  }

  return "0";
};

const formatFriendlyTimestamp = (dateInput: Date | number | string | undefined): string => {
  if (!dateInput) return "No timestamp";
  const now = new Date();
  const date = new Date(dateInput);

  const isToday = now.toDateString() === date.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();

  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Hôm nay lúc ${time}`;
  }

  if (isYesterday) {
    return `Hôm qua lúc ${time}`;
  }

  const day = date.getDate();
  const month = date.getMonth() + 1;

  return `${day} thg ${month} lúc ${time}`;
};

async function checkInternetConnection() {
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.src = "https://www.gstatic.com/generate_204"; // endpoint test mạng của Google
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
}

export { calcNumberRender, formatFriendlyTimestamp, checkInternetConnection };
