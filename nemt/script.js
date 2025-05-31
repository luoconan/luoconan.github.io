let drivers = [];

// 监听 postMessage
window.addEventListener('message', (event) => {
  // 支持 site1.com 和本地测试
  const allowedOrigins = ['http://site1.com', 'http://127.0.0.1:5500','https://provider.nemtplatform.com/trips','https://provider.nemtplatform.com'];
  if (!allowedOrigins.includes(event.origin)) {
    console.warn('Received message from untrusted origin:', event.origin);
    return;
  }
  const message = event.data;
  if (message.type === 'tripsData') {
    try {
      drivers = message.data;
      // 验证数据格式
      if (!Array.isArray(drivers) || !drivers.every(d => d.id && Array.isArray(d.passengers))) {
        throw new Error('Invalid drivers format');
      }
      console.log('Received drivers via postMessage:', drivers);
      renderDrivers(); // 重新渲染
    } catch (e) {
      console.error('Error parsing received trips data:', e);
      drivers = [];
      renderDrivers(); // 渲染空提示
    }
  }
}, false);

// 时间轴配置
const totalWidth = 1000; // 总宽度（像素）
const driverLabelWidth = 100; // 司机标签宽度（像素）
const timelineWidth = totalWidth; // 时间轴宽度（像素）
const laneHeight = 20; // 每条乘客轨道高度（像素）

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
    // 显示等待提示
    const driversContainer = document.querySelector(".drivers");
    if (driversContainer) {
      driversContainer.innerHTML = '<p style="color: #fff; text-align: center;">Waiting for trips data from check.html...</p>';
    }
    return { minTime: new Date(2025, 4, 30, 7, 0).getTime(), maxTime: new Date(2025, 4, 30, 18, 0).getTime() };
  }
  drivers.forEach(driver => {
    if (driver.passengers && Array.isArray(driver.passengers)) {
      driver.passengers.forEach(p => {
        const pickup = parseTime(p.pickup);
        const dropoff = parseTime(p.dropoff);
        if (pickup !== 0 && dropoff !== 0) {
          minTime = Math.min(minTime, pickup);
          maxTime = Math.max(maxTime, dropoff);
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
  const minHour = Math.floor(minDate.getHours())+1;
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
      const status = p.status;
      if (status === 1 || status === "onroad") {
        block.classList.add("status-onroad");
      } else if (status === 2 || status === "finished") {
        block.classList.add("status-finished");
      } else if (status === 3 || status === "canceled") {
        block.classList.add("status-canceled");
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
      block.textContent = p.id.includes(',') ? p.id.split(',')[0].trim() : p.id;
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
          // 添加司机信息
          const driverHeader = document.createElement("h2");
          driverHeader.textContent = `Driver: ${driver.id || 'Unknown Driver'}`;
          driverHeader.style.color = '#fff';
          displayContent.appendChild(driverHeader);
          // 添加表格内容
          for (const [key, value] of Object.entries(p)) {
            if (key !== "lane") {
              const row = document.createElement("tr");
              const keyCell = document.createElement("td");
              const valueCell = document.createElement("td");
              keyCell.textContent = key === "id" ? "name" : key;
              if (key === "status") {
                const statusMap = {
                  0: "noaction",
                  1: "onroad",
                  2: "finished",
                  3: "canceled",
                  "noaction": "noaction",
                  "onroad": "onroad",
                  "finished": "finished",
                  "canceled": "canceled"
                };
                valueCell.textContent = statusMap[value] || value;
              } else {
                valueCell.textContent = value;
              }
              row.appendChild(keyCell);
              row.appendChild(valueCell);
              displayContent.appendChild(row);
            }
          }
          // 添加分隔线
          const hr = document.createElement("hr");
          hr.style.borderColor = '#555';
          displayContent.appendChild(hr);
          // 添加其他司机行程
          const otherTripsHeader = document.createElement("h2");
          otherTripsHeader.textContent = "Other Trips";
          otherTripsHeader.style.color = '#fff';
          displayContent.appendChild(otherTripsHeader);
          let hasOtherTrips = false;
          drivers.forEach(otherDriver => {
            if (otherDriver.id !== driver.id && otherDriver.passengers) {
              otherDriver.passengers.forEach(otherP => {
                if (otherP.id === p.id) {
                  const tripInfo = document.createElement("h3");
                  tripInfo.textContent = `${otherDriver.id}: ${otherP.pickup}`;
                  tripInfo.style.color = '#fff';
                  displayContent.appendChild(tripInfo);
                  hasOtherTrips = true;
                }
              });
            }
          });
          if (!hasOtherTrips) {
            const noTrips = document.createElement("h3");
            noTrips.textContent = 'No other trips';
            noTrips.style.color = '#fff';
            displayContent.appendChild(noTrips);
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
}

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  console.log('DOM loaded, starting render');
  // 初始渲染，显示等待提示
  renderDrivers();
});