import { md5 } from './MD5.js';

let drivers = [];
const workerUrl = 'https://tripsheetdata.conanluo.workers.dev/get';

// 设置 localStorage 带过期时间
function setWithExpiry(key, value, ttl) {
  const now = new Date();
  const item = {
    value: value,
    expires: now.getTime() + ttl // ttl 以毫秒为单位
  };
  localStorage.setItem(key, JSON.stringify(item));
}

// 获取 localStorage 数据并检查是否过期
function getWithExpiry(key) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) {
    return null;
  }
  // 兼容旧格式：直接存储的哈希值
  try {
    const item = JSON.parse(itemStr);
    // 检查是否是对象且有 expires 属性
    if (item && typeof item === 'object' && 'expires' in item && 'value' in item) {
      const now = new Date();
      if (now.getTime() > item.expires) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    }
    // 如果不是 JSON 对象，假设是旧格式的哈希值
    return itemStr;
  } catch (e) {
    // 解析失败，假设 itemStr 是旧格式的哈希值
    console.warn(`Invalid JSON in localStorage for key "${key}", treating as legacy hash:`, itemStr);
    return itemStr;
  }
}

// 格式化时间为 MM/DD/YYYY HH:mm:ss
function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

// 显示授权码弹框
function showAuthModal() {
  const modal = document.createElement('div');
  modal.className = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-modal-content">
      <h2>Please Enter Authorization code</h2>
      <input type="password" id="authCodeInput" placeholder="Authorization code">
      <button class="myButton" id="authSubmitBtn">Submit</button>
      <p id="authError" style="color: red; display: none;">Authorization code Wrong, Try again! </p>
    </div>
  `;
  document.body.appendChild(modal);

  const submitBtn = document.getElementById('authSubmitBtn');
  const authInput = document.getElementById('authCodeInput');
  const errorMsg = document.getElementById('authError');

  submitBtn.addEventListener('click', () => {
    const code = authInput.value.trim();
    const hashedCode = md5(code);
    if (hashedCode === 'bf15e467a5a10db8929fc01df0c55047') {
      // 设置 半 小时过期（0.5 * 60 * 60 * 1000 毫秒）
      setWithExpiry('pw', hashedCode, 30 * 60 * 1000);
      document.body.removeChild(modal);
      initializeApp();
    } else {
      errorMsg.style.display = 'block';
      authInput.value = '';
    }
  });

  authInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitBtn.click();
    }
  });
}

// 初始化应用
function initializeApp() {
  fetchTripsData();
  setInterval(fetchTripsData, 30000);
}

// 从 Cloudflare Worker 获取数据
async function fetchTripsData() {
  try {
    const response = await fetch(workerUrl + '?_=' + Date.now(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const newDrivers = JSON.parse(data.content); // 解析 content 字符串
    if (!Array.isArray(newDrivers) || !newDrivers.every(d => d.id && Array.isArray(d.passengers))) {
      throw new Error('Invalid drivers format');
    }
    console.log('Received drivers from Cloudflare Worker:', newDrivers);
    drivers = newDrivers; // 更新 drivers
    // 更新 timestamp
    const updateTimeSpan = document.getElementById('updateTime');
    if (updateTimeSpan && data.timestamp) {
      updateTimeSpan.textContent = formatDateTime(data.timestamp);
    }
    renderDrivers();
  } catch (e) {
    console.error('Error fetching trips data:', e);
    // 保持当前 drivers，不清空
    renderDrivers();
  }
}

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
  const match = id.match(emojiRegex); // 在完整 ID 上匹配 emoji
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

// 生成时间轴刻度
function renderTimelineHeader(minTime, maxTime) {
  const header = document.querySelector(".timeline-header");
  if (!header) {
    console.error('Timeline header not found');
    return;
  }
  header.innerHTML = '';
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
function renderDrivers() {
  const driversContainer = document.querySelector(".drivers");
  if (!driversContainer) {
    console.error('Drivers container not found');
    return;
  }
  driversContainer.innerHTML = '';
  const { minTime, maxTime } = getTimeRange();
  renderTimelineHeader(minTime, maxTime);

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
        console.warn(`Invalid trip:`, p);
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
  console.log('DOM loaded, checking auth');
  const storedPw = getWithExpiry('pw');
  if (!storedPw) {
    showAuthModal();
  } else if (storedPw === 'bf15e467a5a10db8929fc01df0c55047') { 
    initializeApp();
  } else {
    showAuthModal();
  }
});
