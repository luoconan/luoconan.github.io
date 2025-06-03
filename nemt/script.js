let drivers = []; //

// 监听 postMessage
window.addEventListener('message', (event) => {
  const allowedOrigins = ['http://127.0.0.1:5500', 'https://provider.nemtplatform.com/trips', 'https://provider.nemtplatform.com'];
  if (!allowedOrigins.includes(event.origin)) {
    console.warn('Received message from untrusted origin:', event.origin);
    return;
  }
  const message = event.data;
  if (message.type === 'tripsData') {
    try {
      drivers = message.data;
      if (!Array.isArray(drivers) || !drivers.every(d => d.id && Array.isArray(d.passengers))) {
        throw new Error('Invalid drivers format');
      }
      console.log('Received drivers via postMessage:', drivers);
      // 保存到 localStorage，包括当前时间戳
      const cacheData = {
        drivers: drivers,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('cachedTripsData', JSON.stringify(cacheData));
      renderDrivers(false); // 新数据，不显示 Old Data 标题
    } catch (e) {
      console.error('Error parsing received trips data:', e);
      drivers = [];
      // 尝试加载缓存数据
      const cachedData = localStorage.getItem('cachedTripsData');
      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData);
          drivers = parsedCache.drivers;
          if (Array.isArray(drivers) && drivers.every(d => d.id && Array.isArray(d.passengers))) {
            console.log('Loaded cached drivers from localStorage:', drivers);
            renderDrivers(true, parsedCache.timestamp); // 缓存数据，显示 Old Data 标题和时间
          } else {
            drivers = [];
            renderDrivers(false);
          }
        } catch (cacheError) {
          console.error('Error parsing cached trips data:', cacheError);
          drivers = [];
          renderDrivers(false);
        }
      } else {
        drivers = [];
        renderDrivers(false);
      }
    }
  }
}, false);

// 时间轴配置
const totalWidth = 1000;
const driverLabelWidth = 100;
const timelineWidth = totalWidth;
const laneHeight = 20;

// 解析 "HHMM" 格式时间为毫秒，假设虚拟日期
function parseTime(timeStr) {
  try {
    const hours = parseInt(timeStr.slice(0, 2), 10);
    const minutes = parseInt(timeStr.slice(2, 4), 10);
    if (isNaN(hours) || isNaN(minutes)) {
      console.error(`Invalid time format: ${timeStr}`);
      return 0;
    }
    return new Date(2025, 4, 30, hours-1, minutes).getTime();
  } catch (e) {
    console.error(`Error parsing time ${timeStr}:`, e);
    return 0;
  }
}

// 计算时间范围
function getTimeRange() {
  console.log('Drivers:', drivers);
  let minTime = Infinity;
  let maxTime = -Infinity;
  if (!drivers || !Array.isArray(drivers) || drivers.length === 0) {
    console.error('No valid drivers data');
    const driversContainer = document.querySelector(".drivers");
    if (driversContainer) {
      driversContainer.innerHTML = '<p style="color: #fff; text-align: center;">Waiting for trips data from NEMT...</p>';
    }
    return { minTime: new Date(2025, 4, 30, 7, 0).getTime(), maxTime: new Date(2025, 4, 30, 18, 0).getTime() };
  }
  drivers.forEach(driver => {
    if (driver.passengers && Array.isArray(driver.passengers)) {
      driver.passengers.forEach(p => {
        if (p.id !== "Lunch") {
          const pickup = parseTime(p.pickup);
          const dropoff = parseTime(p.dropoff);
          if (pickup !== 0 && dropoff !== 0) {
            minTime = Math.min(minTime, pickup);
            maxTime = Math.max(maxTime, dropoff);
          }
        }
      });
    }
  });
  if (minTime === Infinity || maxTime === -Infinity) {
    console.error('No valid trip times found');
    return { minTime: new Date(2025, 4, 30, 7, 0).getTime(), maxTime: new Date(2025, 4, 30, 18, 0).getTime() };
  }
  const minDate = new Date(minTime);
  const maxDate = new Date(maxTime);
  const minHour = Math.floor(minDate.getHours());
  const maxHour = Math.ceil(maxDate.getHours())+1;
  const startTime = new Date(minDate).setHours(minHour, 0, 0, 0);
  const endTime = new Date(maxDate).setHours(maxHour, 0, 0, 0);
  console.log(`Time Range: ${new Date(startTime)} to ${new Date(endTime)}`);
  return { minTime: startTime, maxTime: endTime };
}

// 将时间映射到像素
function timeToPixel(time, minTime, maxTime) {
  const duration = maxTime - minTime;
  if (duration === 0) {
    console.error('Invalid time duration');
    return 0;
  }
  const pixel = ((time - minTime) / duration) * timelineWidth;
  return pixel;
}

// 分配乘客到不重叠的轨道
function assignLanes(passengers) {
  if (!passengers || !Array.isArray(passengers)) {
    console.error('Invalid passengers data');
    return [];
  }
  const sortedPassengers = passengers.slice().sort((a, b) => {
    return parseTime(a.pickup) - parseTime(b.pickup);
  });

  const lanes = [];
  sortedPassengers.forEach(p => {
    const pickup = parseTime(p.pickup);
    const dropoff = parseTime(p.dropoff);
    if (pickup === 0 || dropoff === 0) return;
    let placed = false;

    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i];
      const hasOverlap = lane.some(existing => {
        const existingPickup = parseTime(existing.pickup);
        const existingDropoff = parseTime(existing.dropoff);
        return pickup < existingDropoff && dropoff > existingPickup;
      });
      if (!hasOverlap) {
        lane.push({ ...p, pickup: p.pickup, dropoff: p.dropoff, lane: i });
        placed = true;
        break;
      }
    }

    if (!placed) {
      lanes.push([{ ...p, pickup: p.pickup, dropoff: p.dropoff, lane: lanes.length }]);
    }
  });

  const flatLanes = lanes.flat();
  console.log(`Lanes:`, lanes);
  return flatLanes;
}

// 过滤行程根据输入
function filterTrips(searchText) {
  const blocks = document.querySelectorAll(".passenger-block");
  if (!searchText) {
    blocks.forEach(block => {
      block.style.opacity = "1";
    });
    return;
  }

  const keywords = searchText.toLowerCase()
    .replace(/,/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/);

  blocks.forEach(block => {
    // 清理 dataset.id，保留 emoji
    let passengerId = block.dataset.id.toLowerCase()
      .replace(/,/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // 移除 emoji 后的 ID，用于匹配不含 emoji 的关键字
    const idWithoutEmoji = passengerId.replace(/[\p{Emoji_Presentation}\p{Emoji}\u200D]+/gu, '').trim();
    // 检查是否所有关键字都在 passengerId（含 emoji）或 idWithoutEmoji 中
    const matches = keywords.every(keyword => {
      // 允许关键字包含 emoji 或纯文本
      return passengerId.includes(keyword) || idWithoutEmoji.includes(keyword);
    });
    block.style.opacity = matches ? "1" : "0.2";
  });
}

// 处理时间轴显示的 ID（仅限时间轴）
function formatDisplayName(id) {
  // 先提取逗号前的部分
  let baseName = id.includes(',') ? id.split(',')[0].trim() : id;
  // 匹配任意位置的 emoji
  const emojiRegex = /([\p{Emoji_Presentation}\p{Emoji}\u200D]+)/u;
  const match = id.match(emojiRegex); // 在完整 ID 上匹配
  if (match) {
    const emoji = match[1];
    // 提取第一个单词（假设为姓氏）
    const firstWordMatch = baseName.match(/^\S+/);
    const firstWord = firstWordMatch ? firstWordMatch[0] : baseName;
    // 将 emoji 移到前面，仅显示姓氏
    return `${emoji}${firstWord.replace(emojiRegex, '')}`.trim();
  }
  return baseName.includes(' ') ? baseName.split(' ')[0].trim() : baseName;
}

// 格式化时间戳为 MM/dd/YYYY hh:mm:ss
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

// 生成时间轴刻度
function renderTimelineHeader(minTime, maxTime, showOldData, timestamp) {
  const header = document.querySelector(".timeline-header");
  if (!header) {
    console.error('Timeline header not found');
    return;
  }
  header.innerHTML = '';
  if (showOldData && timestamp) {
    const oldDataTitle = document.createElement("h3");
    oldDataTitle.textContent = `Old Data (${formatTimestamp(timestamp)})`;
    oldDataTitle.style.color = '#fff';
    oldDataTitle.style.position = 'absolute';
    oldDataTitle.style.top = '5px';
    oldDataTitle.style.right = '5px';
    oldDataTitle.style.margin = '0';
    oldDataTitle.style.fontSize = '14px';
    header.appendChild(oldDataTitle);
  }
  const duration = (maxTime - minTime) / (1000 * 60 * 60);
  const tickInterval = 1000 * 60 * 60;
  for (let i = 0; i <= Math.ceil(duration); i++) {
    const time = minTime + i * tickInterval;
    const pixel = timeToPixel(time, minTime, maxTime) + driverLabelWidth;
    const tick = document.createElement("div");
    tick.className = "time-tick";
    tick.style.left = `${pixel}px`;
    header.appendChild(tick);

    const label = document.createElement("div");
    label.className = "time-label";
    label.style.left = `${pixel}px`;
    label.textContent = new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    header.appendChild(label);
    console.log(`Tick at ${new Date(time).toLocaleTimeString([])}: ${pixel}px`);
  }
}

// 渲染司机和乘客
function renderDrivers(showOldData = false, timestamp = null) {
  const driversContainer = document.querySelector(".drivers");
  if (!driversContainer) {
    console.error('Drivers container not found');
    return;
  }
  driversContainer.innerHTML = '';
  const { minTime, maxTime } = getTimeRange();
  renderTimelineHeader(minTime, maxTime, showOldData, timestamp);

  drivers.forEach(driver => {
    if (!driver || !driver.passengers) {
      console.warn(`Invalid driver data:`, driver);
      return;
    }
    const hasNonLunchTrips = driver.passengers.some(p => p.id !== "Lunch");
    if (!hasNonLunchTrips) {
      console.log(`Skipping driver ${driver.id} with no non-Lunch trips`);
      return;
    }
    const driverRow = document.createElement("div");
    driverRow.className = "driver-row";

    const driverLabel = document.createElement("div");
    driverLabel.className = "driver-label";
    driverLabel.textContent = driver.id || 'Unknown Driver';
    driverRow.appendChild(driverLabel);

    const passengerContainer = document.createElement("div");
    passengerContainer.className = "passenger-container";
    passengerContainer.style.width = `${totalWidth}px`;

    const passengersWithLanes = assignLanes(driver.passengers);
    const maxLane = Math.max(...passengersWithLanes.map(p => p.lane), 0) + 1;
    passengerContainer.style.height = `${maxLane * laneHeight + 4}px`;
    console.log(`Driver ${driver.id} maxLane: ${maxLane}, height: ${passengerContainer.style.height}`);

    passengersWithLanes.forEach(p => {
      const lane = document.createElement("div");
      lane.className = "passenger-lane";
      lane.style.top = `${p.lane * laneHeight}px`;

      const block = document.createElement("div");
      block.className = "passenger-block";
      block.dataset.id = p.id;
      if (p.id === "Lunch") {
        block.classList.add("id-lunch");
      } else {
        const status = p.status;
        if (status === 1 || status === "onBoard") {
          block.classList.add("status-onboard");
        } else if (status === 2 || status === "finished") {
          block.classList.add("status-finished");
        } else if (status === 3 || status === "cancelled") {
          block.classList.add("status-cancelled");
        }
      }
      const pickupTime = parseTime(p.pickup);
      const dropoffTime = parseTime(p.dropoff);
      if (pickupTime === 0 || dropoffTime === 0) {
        console.warn(`Skipping invalid trip:`, p);
        return;
      }
      const pickupPixel = timeToPixel(pickupTime, minTime, maxTime) + driverLabelWidth;
      const dropoffPixel = timeToPixel(dropoffTime, minTime, maxTime) + driverLabelWidth;
      block.style.left = `${pickupPixel}px`;
      block.style.width = `${dropoffPixel - pickupPixel}px`;
      block.textContent = formatDisplayName(p.id); // 时间轴显示格式化名称
      block.title = `${p.id}\n${p.pickup}-${p.dropoff}`;
      block.addEventListener("click", () => {
        document.querySelectorAll(".passenger-block").forEach(b => {
          b.classList.remove("selected", "same-id");
        });
        block.classList.add("selected");
        document.querySelectorAll(".passenger-block").forEach(b => {
          if (b.dataset.id === p.id && b !== block) {
            b.classList.add("same-id");
          }
        });
        const displayContent = document.querySelector(".display-content");
        if (displayContent) {
          displayContent.innerHTML = '';
          const driverHeader = document.createElement("h2");
          driverHeader.textContent = `Driver: ${driver.id || 'Unknown Driver'}`;
          driverHeader.style.color = '#fff';
          displayContent.appendChild(driverHeader);
          const mainTable = document.createElement("table");
          mainTable.className = "display-table";
          if (p.id === "Lunch") {
            const row1 = document.createElement("tr");
            const keyCell1 = document.createElement("td");
            const valueCell1 = document.createElement("td");
            keyCell1.textContent = "Driver";
            valueCell1.textContent = driver.id || 'Unknown Driver';
            row1.appendChild(keyCell1);
            row1.appendChild(valueCell1);
            mainTable.appendChild(row1);
            const row2 = document.createElement("tr");
            const keyCell2 = document.createElement("td");
            const valueCell2 = document.createElement("td");
            keyCell2.textContent = "Lunch Time";
            valueCell2.textContent = `${p.pickup}-${p.dropoff}`;
            row2.appendChild(keyCell2);
            row2.appendChild(valueCell2);
            mainTable.appendChild(row2);
          } else {
            for (const [key, value] of Object.entries(p)) {
              if (key !== "lane") {
                const row = document.createElement("tr");
                const keyCell = document.createElement("td");
                const valueCell = document.createElement("td");
                keyCell.textContent = key === "id" ? "name" : key;
                if (key === "status") {
                  const statusMap = {
                    0: "noAction",
                    1: "onBoard",
                    2: "finished",
                    3: "cancelled",
                    "noaction": "noAction",
                    "onboard": "onBoard",
                    "finished": "finished",
                    "cancelled": "cancelled"
                  };
                  valueCell.textContent = statusMap[value] || value;
                } else {
                  valueCell.textContent = value; // 右侧表格保持原始 id
                }
                row.appendChild(keyCell);
                row.appendChild(valueCell);
                mainTable.appendChild(row);
              }
            }
          }
          displayContent.appendChild(mainTable);
          const hr = document.createElement("hr");
          hr.style.borderColor = '#555';
          displayContent.appendChild(hr);
          const otherTripsHeader = document.createElement("h2");
          otherTripsHeader.textContent = "Other Trips";
          otherTripsHeader.style.color = '#fff';
          displayContent.appendChild(otherTripsHeader);
          const otherTripsTable = document.createElement("table");
          otherTripsTable.className = "other-trips-table";
          if (p.id === "Lunch") {
            otherTripsTable.classList.add("lunch-table");
          }
          const thead = document.createElement("thead");
          const headerRow = document.createElement("tr");
          if (p.id === "Lunch") {
            ["Driver", "Lunch Time"].forEach(text => {
              const th = document.createElement("th");
              th.textContent = text;
              headerRow.appendChild(th);
            });
          } else {
            ["Driver", "PU Time", "P/U Address", "D/O Address"].forEach(text => {
              const th = document.createElement("th");
              th.textContent = text;
              headerRow.appendChild(th);
            });
          }
          thead.appendChild(headerRow);
          otherTripsTable.appendChild(thead);
          const tbody = document.createElement("tbody");
          let hasOtherTrips = false;
          drivers.forEach(otherDriver => {
            if (otherDriver.passengers) {
              otherDriver.passengers.forEach(otherP => {
                if (otherP.id === p.id) {
                  const row = document.createElement("tr");
                  if (otherP.pickup === p.pickup && otherP.dropoff === p.dropoff && otherDriver.id === driver.id) {
                    row.classList.add("highlight");
                  }
                  row.dataset.pickup = otherP.pickup;
                  row.dataset.dropoff = otherP.dropoff;
                  const driverCell = document.createElement("td");
                  driverCell.textContent = otherDriver.id || 'Unknown Driver';
                  row.appendChild(driverCell);
                  if (p.id === "Lunch") {
                    const lunchTimeCell = document.createElement("td");
                    lunchTimeCell.textContent = `${otherP.pickup}-${otherP.dropoff}`;
                    row.appendChild(lunchTimeCell);
                  } else {
                    const pickupCell = document.createElement("td");
                    pickupCell.textContent = otherP.pickup || 'Unknown';
                    row.appendChild(pickupCell);
                    const puAddressCell = document.createElement("td");
                    puAddressCell.textContent = otherP.puaddress || '';
                    row.appendChild(puAddressCell);
                    const doAddressCell = document.createElement("td");
                    doAddressCell.textContent = otherP.doaddress || '';
                    row.appendChild(doAddressCell);
                  }
                  tbody.appendChild(row);
                  hasOtherTrips = true;
                }
              });
            }
          });
          otherTripsTable.appendChild(tbody);
          if (!hasOtherTrips) {
            const noTrips = document.createElement("h3");
            noTrips.textContent = 'No other trips';
            noTrips.style.color = '#fff';
            displayContent.appendChild(noTrips);
          } else {
            displayContent.appendChild(otherTripsTable);
          }
        } else {
          console.error('Display content not found');
        }
      });
      console.log(`Passenger ${p.id}: pickup ${p.pickup} at ${pickupPixel}px, dropoff ${p.dropoff} at ${dropoffPixel}px`);
      lane.appendChild(block);
      passengerContainer.appendChild(lane);
    });

    driverRow.appendChild(passengerContainer);
    driversContainer.appendChild(driverRow);
  });
  console.log('Rendering complete');

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filterTrips(e.target.value);
    });
  }
}

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  console.log('DOM loaded, starting render');
  // 页面加载时尝试使用缓存数据
  const cachedData = localStorage.getItem('cachedTripsData');
  if (cachedData) {
    try {
      const parsedCache = JSON.parse(cachedData);
      drivers = parsedCache.drivers;
      if (Array.isArray(drivers) && drivers.every(d => d.id && Array.isArray(d.passengers))) {
        console.log('Loaded cached drivers from localStorage on init:', drivers);
        renderDrivers(true, parsedCache.timestamp); // 显示 Old Data 标题和时间
      } else {
        drivers = [];
        renderDrivers(false);
      }
    } catch (e) {
      console.error('Error parsing cached trips data on init:', e);
      drivers = [];
      renderDrivers(false);
    }
  } else {
    renderDrivers(false);
  }
});
