let routes = [];

// 时间轴配置
const totalWidth = 1000;
const driverLabelWidth = 100;
const timelineWidth = totalWidth;
const laneHeight = 20;

// 生成唯一 tripId
let tripIdCounter = 0;
function generateTripId() {
  return `trip-${tripIdCounter++}`;
}

// 显示错误提示
function showError(message) {
  const errorMsg = document.getElementById('errorMsg');
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
  } else {
    console.error('Error message container not found');
  }
}

// 清除错误提示
function clearError() {
  const errorMsg = document.getElementById('errorMsg');
  if (errorMsg) {
    errorMsg.textContent = '';
    errorMsg.style.display = 'none';
  }
}

// 验证 HHMM 格式
function isValidTimeFormat(timeStr) {
  const regex = /^\d{4}$/;
  if (!regex.test(timeStr)) return false;
  const hours = parseInt(timeStr.slice(0, 2), 10);
  const minutes = parseInt(timeStr.slice(2, 4), 10);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

// 解析 "HHMM" 格式时间为毫秒，假设虚拟日期
function parseTime(timeStr) {
  try {
    const hours = parseInt(timeStr.slice(0, 2), 10);
    const minutes = parseInt(timeStr.slice(2, 4), 10);
    if (isNaN(hours) || isNaN(minutes)) {
      console.error(`Invalid time format: ${timeStr}`);
      return 0;
    }
    return new Date(2025, 4, 15, hours, minutes).getTime();
  } catch (e) {
    console.error(`Error parsing time ${timeStr}:`, e);
    return 0;
  }
}

// 从 HHMM 时间减去/加上分钟数，返回 HHMM 格式
function adjustTime(timeStr, minutes) {
  try {
    const hours = parseInt(timeStr.slice(0, 2), 10);
    const minutesCurrent = parseInt(timeStr.slice(2, 4), 10);
    if (isNaN(hours) || isNaN(minutesCurrent)) {
      console.error(`Invalid time format: ${timeStr}`);
      return timeStr;
    }
    const date = new Date(2025, 4, 15, hours, minutesCurrent);
    date.setMinutes(date.getMinutes() + minutes);
    const newHours = date.getHours().toString().padStart(2, '0');
    const newMinutes = date.getMinutes().toString().padStart(2, '0');
    return `${newHours}${newMinutes}`;
  } catch (e) {
    console.error(`Error adjusting time ${timeStr}:`, e);
    return timeStr;
  }
}

// 将 HHMM 转换为 HH:MM 格式
function formatTimeToHHMM(timeStr) {
  if (!isValidTimeFormat(timeStr)) return timeStr;
  const hours = timeStr.slice(0, 2);
  const minutes = timeStr.slice(2, 4);
  return `${hours}:${minutes}`;
}

// 处理地址，提取 San Francisco 前的部分和 Zip 码
function processAddress(address) {
  if (!address) return { street: '', zip: '' };
  const trimmed = address.trim();
  const sanFranciscoIndex = trimmed.toLowerCase().indexOf('san francisco');
  let street = sanFranciscoIndex !== -1 ? trimmed.slice(0, sanFranciscoIndex).trim() : trimmed;
  street = street.replace(/[,]/g, ''); // 移除逗号
  const zipMatch = trimmed.match(/\b\d{5}\b/);
  const zip = zipMatch ? zipMatch[0] : '';
  console.log('Processed address:', address, { street: street.trim(), zip });
  return { street: street.trim(), zip };
}

// curr facility 地址映射表
const facilityAddressMap = {
  'Institute of Aging': '3575 Geary Blvd San Francisco 94118',
  'Merced Residential Care Facility (259 Broad)': '259 Broad St San Francisco 94112',
  'Merced Residential Care Facility (Girard)': '129 Girard St San Francisco 94134',
  'Parkside Retirement Homes': '2447 19th Ave San Francisco 94116',
  'Victorian Manor': '1444 McAllister St San Francisco 94115',
  'Providence Place': '2456 Geary Blvd San Francisco 94115',
  'Hayes Convalescent Hospital': '1250 Hayes St San Francisco 94117',
  'Laurel Heights Community Care': '2740 California St San Francisco 94115',
  'CENTRAL GARDENS POST ACUTE': '1355 Ellis St San Francisco 94115',
  'Portola Gardens, LLC': '350 University St San Francisco 94134',
  'MERCED THREE RESIDENTIAL CARE FACILITY (HAMPSHIRE)': '1420 Hampshire St San Francisco 94110',
  'Jewish Home and Rehab Center': '302 Silver Ave San Francisco 94112',
  'SF Health Care and Rehab Inc': '1477 Grove St San Francisco 94117',
  'Gee Building': '1333 Bush St San Francisco 94109',
  'Alma Via of San Francisco': '1 Thomas More Way San Francisco 94132'
};

// 导出 route 的 CSV 文件
function exportRouteToCSV(route, date, prtMap, darMap) {
  const headers = [
    'Date', 'Req Pickup', 'Appointment', 'Patient', 'Space', 'Pickup Comment', 'Dropoff Comment', 'Type',
    'Pickup Phone', 'Dropoff Phone', 'Authorization', 'Funding Source', 'Distance', 'Run',
    'Pickup Address', 'Pickup Address1', 'Pickup City', 'Pickup State', 'Pickup Zip',
    'Dropoff Address', 'Dropoff Address1', 'Dropoff City', 'Dropoff State', 'Dropoff Zip', 'Trip ID'
  ];
  const rows = [];

  route.passengers.forEach(passenger => {
    const patient = passenger.id.toLowerCase();
    const prtRow = prtMap.get(patient) || {};
    const darRow = darMap.get(patient) || {};
    const space = prtRow['Service Type'] || 'Ambulatory';
    let phone = darRow['Phone'] ? darRow['Phone'].replace(/Hm: /g, '').slice(0, 12) : '';
    if (!phone) {
      phone = prtRow['Phone'] ? prtRow['Phone'].slice(0, 12) : '000-000-0000';
    }
    const pickupAddr = processAddress(passenger.puaddress);
    const dropoffAddr = processAddress(passenger.doaddress);

    const row = {
      Date: date,
      'Req Pickup': formatTimeToHHMM(passenger.pickup),
      Appointment: '',
      Patient: passenger.id,
      Space: space,
      'Pickup Comment': passenger.note || '',
      'Dropoff Comment': '',
      Type: '',
      'Pickup Phone': phone,
      'Dropoff Phone': '',
      Authorization: '',
      'Funding Source': 'PACE - IOA',
      Distance: '',
      Run: '',
      'Pickup Address': pickupAddr.street,
      'Pickup Address1': '',
      'Pickup City': 'San Francisco',
      'Pickup State': 'CA',
      'Pickup Zip': pickupAddr.zip,
      'Dropoff Address': dropoffAddr.street,
      'Dropoff Address1': '',
      'Dropoff City': 'San Francisco',
      'Dropoff State': 'CA',
      'Dropoff Zip': dropoffAddr.zip,
      'Trip ID': ''
    };
    rows.push(headers.map(header => `"${(row[header] || '').replace(/"/g, '""')}"`).join(','));
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = route.id === 'unschedule' ? 'unschedule.csv' : `${route.id.replace('Route ', '')}.csv`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  console.log(`Exported CSV for ${route.id}: ${fileName}`);
}

// 计算时间范围
function getTimeRange() {
  console.log('Computing time range for routes:', routes);
  let minTime = Infinity;
  let maxTime = -Infinity;
  if (!routes || !Array.isArray(routes) || routes.length === 0) {
    console.error('No valid routes data');
    const driversContainer = document.querySelector(".drivers");
    if (driversContainer) {
      driversContainer.innerHTML = '<p style="color: #fff; text-align: center;">No trips planned...</p>';
    }
    return { minTime: new Date(2025, 4, 15, 7, 0).getTime(), maxTime: new Date(2025, 4, 15, 18, 0).getTime() };
  }
  routes.forEach(route => {
    if (route.passengers && Array.isArray(route.passengers)) {
      route.passengers.forEach(p => {
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
    return { minTime: new Date(2025, 4, 15, 7, 0).getTime(), maxTime: new Date(2025, 4, 15, 18, 0).getTime() };
  }
  const minDate = new Date(minTime);
  const maxDate = new Date(maxTime);
  const minHour = Math.floor(minDate.getHours());
  const maxHour = Math.ceil(maxDate.getHours());
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

// 分配行程到不重叠的轨道
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
  console.log(`Lanes:`, flatLanes);
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
    let passengerId = block.dataset.id.toLowerCase()
      .replace(/,/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const idWithoutEmoji = passengerId.replace(/[\p{Emoji_Presentation}\p{Emoji}\u200D]+/gu, '').trim();
    const matches = keywords.every(keyword => {
      return passengerId.includes(keyword) || idWithoutEmoji.includes(keyword);
    });
    block.style.opacity = matches ? "1" : "0.2";
  });
}

// 处理时间轴显示的 ID（仅限时间轴）
function formatDisplayName(id) {
  let baseName = id.includes(',') ? id.split(',')[0].trim() : id;
  const emojiRegex = /([\p{Emoji_Presentation}\p{Emoji}\u200D]+)/u;
  const match = id.match(emojiRegex);
  if (match) {
    const emoji = match[1];
    const firstWordMatch = baseName.match(/^\S+/);
    const firstWord = firstWordMatch ? firstWordMatch[0] : baseName;
    return `${emoji}${firstWord.replace(emojiRegex, '')}`.trim();
  }
  return baseName.includes(' ') ? baseName.split(' ')[0].trim() : baseName;
}

// 生成时间轴刻度
function renderTimelineHeader(minTime, maxTime) {
  const header = document.querySelector(".timeline-header");
  if (!header) {
    console.error('Timeline header not found');
    showError('Timeline header element missing in HTML');
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

// 查找行程通过 tripId
function findTripById(tripId) {
  for (const route of routes) {
    const passenger = route.passengers.find(p => p.tripId === tripId);
    if (passenger) {
      return { route, passenger };
    }
  }
  return null;
}

// 解析表格数据
function parseTable(text) {
  const lines = text.trim().split('\n').map(line => line.trim());
  if (lines.length < 2) {
    showError('Invalid table format: at least 2 lines required');
    return { headers: [], data: [] };
  }
  const headers = lines[0].split('\t').map(h => h.trim());
  const data = lines.slice(1).map(line => {
    const values = line.split('\t').map(v => v.trim());
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return row;
  });
  return { headers, data };
}

// 生成行程并分配到路由
function generateTrips(prtInfoText, darText) {
  clearError();
  // 重置 tripId 计数器
  tripIdCounter = 0;
  // 解析 prt Info
  const prtInfo = parseTable(prtInfoText);
  const prtMap = new Map();
  prtInfo.data.forEach(row => {
    if (row['Name']) {
      prtMap.set(row['Name'].toLowerCase(), row);
    }
  });
  console.log('prt Info Map:', prtMap);

  // 解析 DAR
  const darLines = darText.trim().split('\n').map(line => line.trim());
  if (darLines.length < 3) {
    showError('Invalid DAR format: at least 3 lines required');
    console.error('Invalid DAR format');
    return { date: '', routes: [], darMap: new Map() };
  }

  // 提取日期
  const dateMatch = darLines[0].match(/(\w+,\s*(\d{2})\/(\d{2})\/(\d{4}))/);
  const date = dateMatch ? `${dateMatch[2]}/${dateMatch[3]}` : '--/--'; // 格式化为 MM/DD

  // 解析 DAR 数据
  const dar = parseTable(darLines.slice(1).join('\n'));
  console.log('DAR Data:', dar);
  const darMap = new Map();
  dar.data.forEach(row => {
    if (row['Patient']) {
      darMap.set(row['Patient'].toLowerCase(), row);
    }
  });

  const trips = [];
  const seenPatientsForNormalTrips = new Set();

  dar.data.forEach(row => {
    if (row['Transpo'] === 'Y') {
      const patient = row['Patient'] || '';
      let address = row['address'] || '';
      const currFacility = row['curr facility'] || '';
      const visitType = row['Visit Type'] || '';
      const patientKey = patient.toLowerCase();
      if (!patient || !address) {
        console.warn(`Skipping DAR row with missing patient or address:`, row);
        return;
      }

      // 如果 curr facility 不为空，替换 address
      if (currFacility.trim() && facilityAddressMap[currFacility]) {
        address = facilityAddressMap[currFacility];
        console.log(`Replaced address for ${patientKey} with curr facility ${currFacility}: ${address}`);
      }

      console.log('Processing patient:', patientKey, 'Visit Type:', visitType, 'Address:', address, 'Curr Facility:', currFacility);

      // 检查地址是否包含 3595 Geary 且 curr facility 为空
      const isGeary3595AndNoFacility = address.toLowerCase().includes('3595 geary') && !currFacility.trim();

      // 生成正常行程（非 EXTERNAL APPOINTMENT，且不满足 3595 Geary 条件）
      if (!isGeary3595AndNoFacility && !seenPatientsForNormalTrips.has(patientKey)) {
        seenPatientsForNormalTrips.add(patientKey);
        const visitTypeLower = visitType.toLowerCase();
        let aLegPickup = '0900';
        let aLegDropoff = '1000';
        let bLegPickup = '1530';
        let bLegDropoff = '1630';
        let generateALeg = !visitTypeLower.includes('noam');
        let generateBLeg = !visitTypeLower.includes('nopm');

        // 调整时间根据 Visit Type
        if (visitTypeLower.includes('2nd')) {
          aLegPickup = '1030';
          aLegDropoff = '1100';
          console.log('Adjusted a-leg for 2nd:', aLegPickup, aLegDropoff);
        }
        if (visitTypeLower.includes('early')) {
          bLegPickup = '1400';
          bLegDropoff = '1430';
          console.log('Adjusted b-leg for early:', bLegPickup, bLegDropoff);
        }

        if (generateALeg) {
          trips.push({
            tripId: generateTripId(),
            id: patient,
            pickup: aLegPickup,
            dropoff: aLegDropoff,
            puaddress: address,
            doaddress: '3575 Geary Blvd San Francisco CA 94118',
            status: 'noAction',
            leg: 'a-leg',
            note: ''
          });
          console.log('Generated a-leg for:', patientKey);
        } else {
          console.log('Skipped a-leg due to noam for:', patientKey);
        }

        if (generateBLeg) {
          trips.push({
            tripId: generateTripId(),
            id: patient,
            pickup: bLegPickup,
            dropoff: bLegDropoff,
            puaddress: '3575 Geary Blvd San Francisco CA 94118',
            doaddress: address,
            status: 'noAction',
            leg: 'b-leg',
            note: ''
          });
          console.log('Generated b-leg for:', patientKey);
        } else {
          console.log('Skipped b-leg due to nopm for:', patientKey);
        }
      }

      // 生成 EXTERNAL APPOINTMENT 行程
      if (visitType === 'EXTERNAL APPOINTMENT') {
        const apptTime = row['appt time'].replace(":", "") || '0900'; // 默认值
        const pickupALeg = adjustTime(apptTime, -45); // appt time - 45min
        const dropoffALeg = apptTime;
        const pickupBLeg = adjustTime(dropoffALeg, 90); // a-leg dropoff + 1.5hr
        const dropoffBLeg = adjustTime(pickupBLeg, 45); // b-leg pickup + 45min
        const apptNote = row['Appt Notes'] || '';
        // a-leg
        trips.push({
          tripId: generateTripId(),
          id: patient,
          pickup: pickupALeg,
          dropoff: dropoffALeg,
          puaddress: address,
          doaddress: apptNote,
          status: 'noAction',
          leg: 'a-leg-ext',
          note: ''
        });
        // b-leg
        trips.push({
          tripId: generateTripId(),
          id: patient,
          pickup: pickupBLeg,
          dropoff: dropoffBLeg,
          puaddress: apptNote,
          doaddress: address,
          status: 'noAction',
          leg: 'b-leg-ext',
          note: ''
        });
        console.log('Generated external trips for:', patientKey, 'apptTime:', apptTime);
      }
    }
  });

  // 初始化所有路由（包括空路由）
  const routeMap = new Map();
  for (let i = 0; i <= 12; i++) {
    routeMap.set(`Route ${i}`, { id: `Route ${i}`, passengers: [] });
  }
  routeMap.set('unschedule', { id: 'unschedule', passengers: [] });

  // 分配行程
  trips.forEach(trip => {
    const patient = trip.id.toLowerCase();
    const prtRow = prtMap.get(patient);
    let routeId = 'unschedule';
    if (prtRow && prtRow['RT#']) {
      const rtNum = parseInt(prtRow['RT#'], 10);
      if (!isNaN(rtNum) && rtNum >= 0 && rtNum <= 12) {
        routeId = `Route ${rtNum}`;
      }
    }
    routeMap.get(routeId).passengers.push(trip);
  });

  // 转换为数组
  const routes = Array.from(routeMap.values());
  console.log('Generated routes:', routes);
  return { date, routes, darMap };
}

// 渲染路由和乘客
function renderRoutes(prtMap, darMap, date) {
  // 查询 DOM 元素
  const driversContainer = document.querySelector(".drivers");
  const timelineHeader = document.querySelector(".timeline-header");
  const displayPanel = document.querySelector(".display-panel");
  const inputContainer = document.querySelector(".input-container");
  const displayContent = document.querySelector(".display-content");
  console.log('Drivers container:', driversContainer);
  console.log('Timeline header:', timelineHeader);
  console.log('Display panel:', displayPanel);

  if (!driversContainer || !timelineHeader || !displayPanel || !displayContent) {
    console.error('Required DOM elements not found');
    showError('Failed to render trips: container not found. Check HTML structure.');
    return;
  }

  // 隐藏输入框，显示行程详情
  inputContainer.style.display = 'none';
  displayContent.style.display = 'block';

  // 清空旧 DOM
  console.log('Clearing drivers container and timeline header');
  driversContainer.innerHTML = '';
  timelineHeader.innerHTML = '';
  displayContent.innerHTML = '';

  // 计算时间范围
  const { minTime, maxTime } = getTimeRange();
  renderTimelineHeader(minTime, maxTime);

  routes.forEach(route => {
    const routeRow = document.createElement("div");
    routeRow.className = "driver-row";
    routeRow.dataset.routeId = route.id;

    // 允许拖放
    routeRow.addEventListener('dragover', (e) => {
      e.preventDefault();
      routeRow.classList.add('drag-over');
    });
    routeRow.addEventListener('dragleave', () => {
      routeRow.classList.remove('drag-over');
    });
    routeRow.addEventListener('drop', (e) => {
      e.preventDefault();
      routeRow.classList.remove('drag-over');
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { tripIds } = data;

      // 查找并移动所有选中的行程
      const targetRoute = routes.find(r => r.id === route.id);
      tripIds.forEach(tripId => {
        const tripData = findTripById(tripId);
        if (!tripData) {
          console.error('Trip not found for drag:', tripId);
          return;
        }
        const { route: sourceRoute, passenger } = tripData;

        // 从源路由移除
        sourceRoute.passengers = sourceRoute.passengers.filter(p => p.tripId !== tripId);

        // 添加到目标路由
        targetRoute.passengers.push(passenger);
      });

      // 重渲染
      console.log('Routes after drag:', routes);
      renderRoutes(prtMap, darMap, date);
    });

    const routeLabel = document.createElement("div");
    routeLabel.className = "driver-label";
    routeLabel.textContent = route.id || 'Unknown Route';

    // 添加 Export CSV 按钮
    const exportBtn = document.createElement("button");
    exportBtn.className = "export-csv-btn";
    exportBtn.textContent = "Export CSV";
    exportBtn.addEventListener('click', () => {
      exportRouteToCSV(route, date, prtMap, darMap);
    });
    routeLabel.appendChild(document.createElement("br"));
    routeLabel.appendChild(exportBtn);

    routeRow.appendChild(routeLabel);

    const passengerContainer = document.createElement("div");
    passengerContainer.className = "passenger-container";
    passengerContainer.style.width = `${totalWidth}px`;

    const passengersWithLanes = assignLanes(route.passengers || []);
    const maxLane = passengersWithLanes.length > 0 ? Math.max(...passengersWithLanes.map(p => p.lane), 0) + 1 : 1;
    passengerContainer.style.height = `${maxLane * laneHeight + 4}px`;
    console.log(`Route ${route.id} maxLane: ${maxLane}, height: ${passengerContainer.style.height}`);

    passengersWithLanes.forEach(p => {
      // 获取原始 passenger 对象
      const tripData = findTripById(p.tripId);
      if (!tripData) {
        console.error('Trip not found for rendering, tripId=', p.tripId);
        return;
      }
      const { passenger } = tripData;

      const lane = document.createElement("div");
      lane.className = "passenger-lane";
      lane.style.top = `${p.lane * laneHeight}px`;

      const block = document.createElement("div");
      block.className = "passenger-block";
      block.dataset.id = p.id;
      block.dataset.tripId = p.tripId;
      block.draggable = true;
      block.dataset.routeId = route.id;
      block.dataset.pickup = p.pickup;
      block.dataset.dropoff = p.dropoff;

      // 添加 external-appointment 类
      if (p.leg === 'a-leg-ext' || p.leg === 'b-leg-ext') {
        block.classList.add('external-appointment');
      }

      block.addEventListener('click', (e) => {
        const isCtrlPressed = e.ctrlKey;
        const isSelected = block.classList.contains('selected');

        if (isCtrlPressed) {
          if (isSelected) {
            // 取消选中当前行程，保持其他选中状态
            block.classList.remove('selected');
          } else {
            // 添加当前行程到选中
            block.classList.add('selected');
          }
          // 清除所有 same-id 高亮
          document.querySelectorAll(".passenger-block").forEach(b => {
            b.classList.remove("same-id");
          });
          // 为当前点击的行程添加 same-id 高亮
          document.querySelectorAll(".passenger-block").forEach(otherBlock => {
            if (otherBlock.dataset.id === p.id && !otherBlock.classList.contains('selected') && otherBlock !== block) {
              otherBlock.classList.add("same-id");
            }
          });
        } else {
          // 非 Ctrl 点击，清空所有选中和高亮，只选中当前行程
          document.querySelectorAll(".passenger-block").forEach(b => {
            b.classList.remove("selected", "same-id");
          });
          block.classList.add("selected");
          // 高亮所有关联行程
          document.querySelectorAll(".passenger-block").forEach(otherBlock => {
            if (otherBlock.dataset.id === p.id && otherBlock !== block) {
              otherBlock.classList.add("same-id");
            }
          });
        }
      });

      block.addEventListener('dragstart', (e) => {
        block.classList.add('dragging');
        // 收集拖拽的 tripIds
        const selectedBlocks = document.querySelectorAll(".passenger-block.selected");
        let tripIds;
        if (selectedBlocks.length > 0) {
          // 如果有选中的行程，拖拽所有选中的行程
          tripIds = Array.from(selectedBlocks).map(b => b.dataset.tripId);
        } else {
          // 否则只拖拽当前行程
          tripIds = [block.dataset.tripId];
        }
        e.dataTransfer.setData('text/plain', JSON.stringify({ tripIds }));
      });

      block.addEventListener('dragend', () => {
        block.classList.remove('dragging');
      });

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
      block.textContent = formatDisplayName(p.id);
      block.title = `${p.id}\n${p.pickup}-${p.dropoff}`;
      console.log(`Rendering trip: tripId=${p.tripId}, id=${p.id}, pickup=${p.pickup} at ${pickupPixel}px, dropoff=${p.dropoff} at ${dropoffPixel}px`);

      block.addEventListener("click", () => {
        displayContent.innerHTML = '';
        const routeHeader = document.createElement("h2");
        routeHeader.textContent = `Route: ${route.id || 'Unknown Route'}`;
        routeHeader.style.color = '#fff';
        displayContent.appendChild(routeHeader);

        const mainTable = document.createElement("table");
        mainTable.className = "display-table";
        const editableFields = ['id', 'pickup', 'dropoff', 'puaddress', 'doaddress', 'note', 'leg'];
        const inputs = {};

        editableFields.forEach((field, index) => {
          const row = document.createElement("tr");
          const keyCell = document.createElement("td");
          const valueCell = document.createElement("td");
          keyCell.textContent = field === 'id' ? 'Name' : field.charAt(0).toUpperCase() + field.slice(1);
          const valueSpan = document.createElement("span");
          valueSpan.className = "editable-field";
          valueSpan.textContent = passenger[field] || '';
          valueCell.appendChild(valueSpan);
          row.appendChild(keyCell);
          row.appendChild(valueCell);
          mainTable.appendChild(row);

          valueSpan.addEventListener('click', () => {
            const input = field === 'note' || field === 'puaddress' || field === 'doaddress' ?
              document.createElement('textarea') : document.createElement('input');
            input.className = field === 'note' ? 'edit-textarea' : 'edit-input';
            input.value = passenger[field] || '';
            inputs[field] = input;
            valueCell.replaceChild(input, valueSpan);
            input.focus();

            // 添加 Tab 键监听
            const tabHandler = (e) => {
              if (e.key === 'Tab') {
                e.preventDefault();
                const nextField = editableFields[(index + 1) % editableFields.length];
                const nextSpan = document.querySelector(`[data-field="${nextField}"]`);
                if (nextSpan) {
                  nextSpan.click();
                }
              }
            };
            input.addEventListener('keydown', tabHandler);

            input.addEventListener('blur', () => {
              let newValue = input.value.trim();
              if ((field === 'pickup' || field === 'dropoff') && newValue && !isValidTimeFormat(newValue)) {
                showError(`Invalid ${field} format: must be HHMM (e.g., 0900)`);
                newValue = passenger[field]; // 恢复原值
              }
              passenger[field] = newValue;
              block.dataset[field] = newValue;
              if (field === 'id') {
                block.dataset.id = newValue;
              }
              valueSpan.textContent = newValue || '';
              valueCell.replaceChild(valueSpan, input);
              input.removeEventListener('keydown', tabHandler); // 移除 Tab 监听
              console.log(`Updated ${field} to ${newValue} for tripId=${p.tripId}:`, passenger);
            });

            input.addEventListener('keypress', (e) => {
              if (e.key === 'Enter') {
                input.blur();
              }
            });

            // 设置 data-field 以便 Tab 切换
            valueSpan.dataset.field = field;
          });
        });

        displayContent.appendChild(mainTable);

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "button-container";

        const confirmBtn = document.createElement("button");
        confirmBtn.id = "confirmEditBtn";
        confirmBtn.textContent = "Confirm Edit";
        confirmBtn.addEventListener('click', () => {
          // 验证 pickup 和 dropoff
          if (!isValidTimeFormat(passenger.pickup) || !isValidTimeFormat(passenger.dropoff)) {
            showError('Invalid pickup or dropoff time format: must be HHMM (e.g., 0900)');
            return;
          }

          // 更新 routes 中的行程
          console.log('Before update: tripId=', p.tripId, ':', passenger);
          for (let i = 0; i < routes.length; i++) {
            if (JSON.stringify(routes[i]).includes(`"${p.tripId}"`)) {
              let tempPassengers = routes[i].passengers;
              for (let j = 0; j < tempPassengers.length; j++) {
                if (JSON.stringify(tempPassengers[j]).includes(`"${p.tripId}"`)) {
                  tempPassengers[j] = { ...passenger };
                  console.log('Updated passenger at index', j, ':', tempPassengers[j]);
                  break;
                }
              }
              break;
            }
          }

          console.log('After update: tripId=', p.tripId, ':', passenger);
          console.log('Routes after update:', routes);
          clearError();
          renderRoutes(prtMap, darMap, date);
        });
        buttonContainer.appendChild(confirmBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.id = "deleteTripBtn";
        deleteBtn.textContent = "Delete Trip";
        deleteBtn.addEventListener('click', () => {
          // 从 routes 中删除行程
          console.log('Deleting tripId=', p.tripId);
          for (let i = 0; i < routes.length; i++) {
            if (JSON.stringify(routes[i]).includes(`"${p.tripId}"`)) {
              routes[i].passengers = routes[i].passengers.filter(t => t.tripId !== p.tripId);
              console.log('Deleted trip from route:', routes[i].id);
              break;
            }
          }

          console.log('Routes after deletion:', routes);
          clearError();
          renderRoutes(prtMap, darMap, date);
          displayContent.innerHTML = '<p style="color: #fff;">Trip deleted. Select another trip to edit.</p>';
        });
        buttonContainer.appendChild(deleteBtn);

        displayContent.appendChild(buttonContainer);

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
          ["Route", "Lunch Time"].forEach(text => {
            const th = document.createElement("th");
            th.textContent = text;
            headerRow.appendChild(th);
          });
        } else {
          ["Route", "PU Time", "P/U Address", "D/O Address"].forEach(text => {
            const th = document.createElement("th");
            th.textContent = text;
            headerRow.appendChild(th);
          });
        }
        thead.appendChild(headerRow);
        otherTripsTable.appendChild(thead);
        const tbody = document.createElement("tbody");
        let hasOtherTrips = false;
        routes.forEach(otherRoute => {
          if (otherRoute.passengers) {
            otherRoute.passengers.forEach(otherP => {
              if (otherP.id === p.id) {
                const row = document.createElement("tr");
                if (otherP.tripId === p.tripId && otherRoute.id === route.id) {
                  row.classList.add("highlight");
                }
                row.dataset.id = otherP.id;
                row.dataset.tripId = otherP.tripId;
                row.dataset.pickup = otherP.pickup;
                row.dataset.dropoff = otherP.dropoff;
                const routeCell = document.createElement("td");
                routeCell.textContent = otherRoute.id || 'Unknown Route';
                row.appendChild(routeCell);
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
      });
      lane.appendChild(block);
      passengerContainer.appendChild(lane);
    });

    routeRow.appendChild(passengerContainer);
    driversContainer.appendChild(routeRow);
  });
  console.log('Rendering complete');
}

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  console.log('DOM loaded, initializing planing');
  const planBtn = document.getElementById('planBtn');
  const prtInfoInput = document.getElementById('prtInfoInput');
  const darInput = document.getElementById('darInput');
  const planDateSpan = document.getElementById('planDate');
  const searchInput = document.getElementById('searchInput');

  console.log('Plan Button:', planBtn);
  console.log('prt Info Input:', prtInfoInput);
  console.log('DAR Input:', darInput);
  console.log('Plan Date Span:', planDateSpan);
  console.log('Search Input:', searchInput);

  if (!planBtn || !prtInfoInput || !darInput || !planDateSpan || !searchInput) {
    console.error('Input fields or plan button not found');
    showError('Page initialization failed: input fields or plan button missing');
    return;
  }

  // 初始化显示：隐藏行程详情，显示输入框
  const inputContainer = document.querySelector('.input-container');
  const displayContent = document.querySelector('.display-content');
  if (inputContainer && displayContent) {
    inputContainer.style.display = 'block';
    displayContent.style.display = 'none';
  } else {
    console.error('Input container or display content not found');
  }

  // 搜索功能
  searchInput.addEventListener('input', () => {
    filterTrips(searchInput.value.trim());
  });

  let prtMap, darMap, date;
  planBtn.addEventListener('click', () => {
    console.log('Plan button clicked');
    const prtInfoText = prtInfoInput.value.trim();
    const darText = darInput.value.trim();
    if (!prtInfoText || !darText) {
      showError('Please enter both prt Info and DAR data');
      return;
    }
    const result = generateTrips(prtInfoText, darText);
    routes = result.routes;
    date = result.date;
    darMap = result.darMap;
    prtMap = new Map();
    const prtInfo = parseTable(prtInfoText);
    prtInfo.data.forEach(row => {
      if (row['Name']) {
        prtMap.set(row['Name'].toLowerCase(), row);
      }
    });
    console.log('Initial routes:', routes);
    planDateSpan.textContent = `Date: ${date}`; // 显示 Date: MM/DD
    renderRoutes(prtMap, darMap, date);
  });
});
