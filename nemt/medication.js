// version: v2.0.12
let routes = [];
let prtMap, medicationMap, date;

// 时间轴配置
const totalWidth = 1000; // 与 planing 一致
const driverLabelWidth = 100;
const timelineWidth = totalWidth - driverLabelWidth; // 900px
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

// 验证电话号码格式
function isValidPhoneFormat(phoneStr) {
  const regex = /^\d{3}-\d{3}-\d{4}$/;
  return regex.test(phoneStr);
}

// 解析 "HHMM" 格式时间为毫秒，假设当天日期
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
  street = street.replace(/[,]/g, '');
  const zipMatch = trimmed.match(/\b\d{5}\b/);
  const zip = zipMatch ? zipMatch[0] : '';
  console.log('Processed address:', address, { street: street.trim(), zip });
  return { street: street.trim(), zip };
}

// 获取电话号码
function getPassengerPhone(patient, prtMap, medicationMap) {
  const patientKey = patient.toLowerCase();
  let phone = medicationMap.get(patientKey)?.['Phone Number']?.slice(0, 12) || '';
  if (!phone) {
    phone = prtMap.get(patientKey)?.['Phone']?.slice(0, 12) || '000-000-0000';
  }
  return phone;
}

// curr facility 地址映射表
const facilityAddressMap = {
  'IOA': '3575 Geary Blvd San Francisco CA 94118',
  'Institute of Aging': '3575 Geary Blvd San Francisco CA 94118',
  'Merced Residential Care Facility (259 Broad)': '259 Broad St San Francisco CA 94112',
  'Merced Residential Care Facility (Girard)': '129 Girard St San Francisco CA 94134',
  'Parkside Retirement Homes': '2447 19th Ave San Francisco CA 94116',
  'Victorian Manor': '1444 McAllister St San Francisco CA 94115',
  'Providence Place': '2456 Geary Blvd San Francisco CA 94115',
  'Hayes Convalescent Hospital': '1250 Hayes St San Francisco CA 94117',
  'Laurel Heights Community Care': '2740 California St San Francisco CA 94115',
  'CENTRAL GARDENS POST ACUTE': '1355 Ellis St San Francisco CA 94115',
  'Portola Gardens, LLC': '350 University St San Francisco CA 94134',
  'MERCED THREE RESIDENTIAL CARE FACILITY (HAMPSHIRE)': '1420 Hampshire St San Francisco CA 94110',
  'Jewish Home and Rehab Center': '302 Silver Ave San Francisco CA 94112',
  'SF Health Care and Rehab Inc': '1477 Grove St San Francisco CA 94117',
  'Gee Building': '1333 Bush St San Francisco CA 94109',
  'Alma Via of San Francisco': '1 Thomas More Way San Francisco CA 94132'
};

// 解析表格数据
function parseTable(text) {
  const lines = text.trim().split('\n').map(line => line.trim());
  if (lines.length < 2) {
    showError('Invalid table format: at least 2 lines required');
    return { headers: [], data: [] };
  }
  const headers = lines[0].split('\t').map(h => h.trim());
  console.log('Parsed headers:', headers);
  const data = lines.slice(1).map(line => {
    const values = line.split('\t').map(v => v.trim());
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] !== undefined ? values[i] : '';
    });
    if (values.length < headers.length) {
      for (let i = values.length; i < headers.length; i++) {
        row[headers[i]] = '';
      }
    }
    return row;
  });
  console.log('Parsed data:', data);
  return { headers, data };
}

// 生成行程并分配到路由
function generateTrips(prtInfoText, medicationText) {
  console.log('generateTrips function called');
  clearError();
  tripIdCounter = 0;
  const prtInfo = parseTable(prtInfoText);
  prtMap = new Map();
  prtInfo.data.forEach(row => {
    if (row['Name']) {
      prtMap.set(row['Name'].toLowerCase(), row);
    }
  });
  console.log('prt Info Map:', prtMap);

  const medicationLines = medicationText.trim().split('\n').map(line => line.trim());
  if (medicationLines.length < 2) {
    showError('Invalid Medication format: at least 2 lines required');
    console.error('Invalid Medication format');
    return { date: '', routes: [], medicationMap: new Map() };
  }

  const dateMatch = medicationLines[0].match(/(\w+,\s*(\d{2})\/(\d{2})\/(\d{4}))/);
  date = dateMatch ? `${dateMatch[2]}/${dateMatch[3]}/${dateMatch[4]}` : `--/--/${new Date().getFullYear()}`;
  const isAddOn = medicationLines[0].toLowerCase().includes('add-on med');
  const noteValue = isAddOn ? 'Medication(add-on)' : 'Medication';

  const medication = parseTable(medicationLines.slice(1).join('\n'));
  console.log('Medication Data:', medication);
  medicationMap = new Map();
  medication.data.forEach(row => {
    if (row['Name']) {
      medicationMap.set(row['Name'].toLowerCase(), row);
    }
  });

  const trips = [];

  medication.data.forEach(row => {
    const patient = row['Name'] || '';
    const patientKey = patient.toLowerCase();
    if (!patient) {
      console.warn(`Skipping Medication row with missing name:`, row);
      return;
    }

    let doaddress = row['Address'] || '';
    const prtRow = prtMap.get(patientKey) || {};
    if (!doaddress) {
      doaddress = prtRow['curr facility'] && facilityAddressMap[prtRow['curr facility']] ?
        facilityAddressMap[prtRow['curr facility']] : prtRow['Address'] || '';
    }
    if (!doaddress) {
      console.warn(`No valid address for ${patientKey}, skipping trip`);
      return;
    }

    console.log('Processing patient:', patientKey, 'Address:', doaddress);

    trips.push({
      tripId: generateTripId(),
      id: patient,
      pickup: '1700',
      dropoff: '1800',
      puaddress: facilityAddressMap.IOA,
      doaddress: doaddress,
      status: 'noAction',
      leg: 'b-leg-Med',
      note: noteValue,
      phone: getPassengerPhone(patient, prtMap, medicationMap)
    });
    console.log('Generated b-leg-Med for:', patientKey, 'Note:', noteValue);
  });

  const routeMap = new Map();
  for (let i = 0; i <= 12; i++) {
    routeMap.set(`Route ${i}`, { id: `Route ${i}`, passengers: [] });
  }
  routeMap.set('unschedule', { id: 'unschedule', passengers: [] });

  trips.forEach(trip => {
    const patient = trip.id.toLowerCase();
    const medicationRow = medicationMap.get(patient) || {};
    const prtRow = prtMap.get(patient) || {};
    let routeId = 'unschedule';

    const routeValue = medicationRow['Route']?.toLowerCase();
    if (routeValue && routeValue !== 'b') {
      if (routeValue === 'joe') {
        routeId = 'Route 0';
      } else {
        const rtNum = parseInt(routeValue, 10);
        if (!isNaN(rtNum) && rtNum >= 0 && rtNum <= 12) {
          routeId = `Route ${rtNum}`;
        }
      }
    } else if (prtRow['RT#']) {
      const rtNum = parseInt(prtRow['RT#'], 10);
      if (!isNaN(rtNum) && rtNum >= 0 && rtNum <= 12) {
        routeId = `Route ${rtNum}`;
      }
    }

    routeMap.get(routeId).passengers.push(trip);
  });

  routes = Array.from(routeMap.values());
  console.log('Generated routes:', JSON.stringify(routes));
  return { date, routes, medicationMap };
}

// 导出 route 的 CSV 文件（单个路由）
function exportRouteToCSV(route, date, prtMap, medicationMap) {
  const headers = [
    'Date', 'Req Pickup', 'Appointment', 'Patient', 'Space', 'Pickup Comment', 'Dropoff Comment', 'Type',
    'Pickup Phone', 'Dropoff Phone', 'Authorization', 'Funding Source', 'Distance', 'Run',
    'Pickup Address', 'Pickup Address1', 'Pickup City', 'Pickup State', 'Pickup Zip',
    'Dropoff Address', 'Dropoff Address1', 'Dropoff City', 'Dropoff State', 'Dropoff Zip', 'Trip ID'
  ];
  const rows = [];

  const dateParts = date.split('/');
  const fullDate = dateParts.length === 2 ? `${date}/${new Date().getFullYear()}` : date;

  route.passengers.forEach(passenger => {
    if (passenger.status === 'deleted') return; // 排除已删除的行程
    const patient = passenger.id.toLowerCase();
    const prtRow = prtMap.get(patient) || {};
    const medicationRow = medicationMap.get(patient) || {};
    const space = prtRow['Service Type'] || 'Ambulatory';
    const phone = getPassengerPhone(patient, prtMap, medicationMap);
    const pickupAddr = processAddress(passenger.puaddress);
    const dropoffAddr = processAddress(passenger.doaddress);

    const row = {
      Date: fullDate,
      'Req Pickup': formatTimeToHHMM(passenger.pickup),
      Appointment: formatTimeToHHMM(passenger.dropoff),
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

// 导出所有行程的 CSV 文件（排除 unschedule）
function exportAllTrips(date, prtMap, medicationMap) {
  const headers = [
    'Date', 'Req Pickup', 'Appointment', 'Patient', 'Space', 'Pickup Comment', 'Dropoff Comment', 'Type',
    'Pickup Phone', 'Dropoff Phone', 'Authorization', 'Funding Source', 'Distance', 'Run',
    'Pickup Address', 'Pickup Address1', 'Pickup City', 'Pickup State', 'Pickup Zip',
    'Dropoff Address', 'Dropoff Address1', 'Dropoff City', 'Dropoff State', 'Dropoff Zip', 'Trip ID'
  ];
  const rows = [];

  const dateParts = date.split('/');
  const fullDate = dateParts.length === 2 ? `${date}/${new Date().getFullYear()}` : date;

  routes.forEach(route => {
    if (route.id === 'unschedule') return; // 排除 unschedule 路由
    route.passengers.forEach(passenger => {
      if (passenger.status === 'deleted') return; // 排除已删除的行程
      const patient = passenger.id.toLowerCase();
      const prtRow = prtMap.get(patient) || {};
      const medicationRow = medicationMap.get(patient) || {};
      const space = prtRow['Service Type'] || 'Ambulatory';
      const phone = getPassengerPhone(patient, prtMap, medicationMap);
      const pickupAddr = processAddress(passenger.puaddress);
      const dropoffAddr = processAddress(passenger.doaddress);
      const routeNumber = route.id.replace('Route ', '');

      const row = {
        Date: fullDate,
        'Req Pickup': formatTimeToHHMM(passenger.pickup),
        Appointment: formatTimeToHHMM(passenger.dropoff),
        Patient: passenger.id,
        Space: space,
        'Pickup Comment': passenger.note || '',
        'Dropoff Comment': `@van${routeNumber}`,
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
  });

  const now = new Date();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const YYYY = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const fileName = `${MM}${DD}${YYYY}${hh}${mm}${ss}.csv`;

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  console.log(`Exported all trips to ${fileName}`);
}

// 计算时间范围（0800-1800）
function getTimeRange() {
  console.log('Computing time range for medication routes:', routes);
  const startTime = new Date(2025, 4, 15, 8, 0).getTime();
  const endTime = new Date(2025, 4, 15, 18, 0).getTime();
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

// 过滤行程并显示建议
function filterTrips(searchText) {
  const blocks = document.querySelectorAll(".medication-passenger-block");
  if (!searchText) {
    blocks.forEach(block => {
      block.style.opacity = "1";
    });
    showSuggestions(searchText, prtMap); // 清空建议
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

  showSuggestions(searchText, prtMap); // 显示名字建议
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

// 显示名字建议
function showSuggestions(input, prtMap) {
  const suggestions = document.getElementById('suggestions');
  const searchInput = document.getElementById('searchInput');
  if (!suggestions || !searchInput) {
    console.error('Suggestions or searchInput element not found');
    showError('Internal error: Suggestions or input element missing');
    return;
  }
  suggestions.innerHTML = '';
  if (!input || !prtMap) {
    suggestions.style.display = 'none';
    return;
  }

  const inputLower = input.toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  // 检查输入是否完全匹配 prtMap 中的名字
  const exactMatch = Array.from(prtMap.entries()).some(([key, row]) => {
    const nameLower = row['Name'].toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    return nameLower === inputLower;
  });

  if (exactMatch) {
    suggestions.style.display = 'none';
    return;
  }

  const keywords = inputLower.split(' ');
  const matches = Array.from(prtMap.entries())
    .filter(([key, row]) => {
      const nameLower = row['Name'].toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
      return keywords.every(keyword => nameLower.includes(keyword));
    })
    .slice(0, 5); // 最多显示5个

  if (matches.length === 0) {
    suggestions.style.display = 'none';
    return;
  }

  matches.forEach(([key, row]) => {
    const suggestion = document.createElement('div');
    suggestion.className = 'suggestion-item';
    suggestion.textContent = row['Name'] || '';
    if (!row['Name']) {
      console.warn('Empty name in prtMap for key:', key);
      return;
    }
    suggestion.addEventListener('click', (e) => {
      console.log('Suggestion clicked:', row['Name']);
      searchInput.value = row['Name'];
      suggestions.innerHTML = '';
      suggestions.style.display = 'none';
      filterTrips(row['Name']);
      console.log(`Filled input with ${row['Name']}`);
    });
    suggestion.addEventListener('mousedown', (e) => {
      console.log('Suggestion mousedown:', row['Name']);
      searchInput.value = row['Name'];
      suggestions.innerHTML = '';
      suggestions.style.display = 'none';
      filterTrips(row['Name']);
      console.log(`Filled input with ${row['Name']} (mousedown)`);
    });
    suggestions.appendChild(suggestion);
  });

  // 动态设置 suggestions 位置
  const inputRect = searchInput.getBoundingClientRect();
  suggestions.style.left = `${inputRect.left}px`;
  suggestions.style.top = `${inputRect.bottom + window.scrollY}px`;
  suggestions.style.display = 'block';
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
  const duration = (maxTime - minTime) / (1000 * 60 * 60); // 10 hours
  const tickInterval = 1000 * 60 * 60; // 每1小时一个刻度
  for (let i = 0; i <= Math.floor(duration); i++) {
    const time = minTime + i * tickInterval;
    const pixel = timeToPixel(time, minTime, maxTime) + driverLabelWidth;
    const tick = document.createElement("div");
    tick.className = "medication-time-tick";
    tick.style.left = `${pixel}px`;
    header.appendChild(tick);

    const label = document.createElement("div");
    label.className = "medication-time-label";
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
  console.error(`Trip not found: ${tripId}`);
  return null;
}

// 创建拖拽选择表格
function createRouteSelectionTable(x, y) {
  const table = document.createElement('table');
  table.className = 'medication-route-selection-table';
  table.style.position = 'fixed';
  const maxX = window.innerWidth - 160;
  const maxY = window.innerHeight - 160;
  table.style.left = `${Math.min(x + 10, maxX)}px`;
  table.style.top = `${Math.min(y, maxY)}px`;
  table.style.zIndex = '1000';

  const routesList = Array.from({ length: 13 }, (_, i) => `Route ${i}`).concat('unschedule');
  let routeIndex = 0;

  for (let i = 0; i < 5; i++) {
    const row = document.createElement('tr');
    for (let j = 0; j < 3; j++) {
      if (routeIndex < routesList.length) {
        const cell = document.createElement('td');
        const routeId = routesList[routeIndex];
        cell.className = 'medication-route-selection-cell';
        cell.dataset.routeId = routeId;
        cell.textContent = routeId === 'unschedule' ? 'UN' : routeId.replace('Route ', '');
        cell.addEventListener('dragover', (e) => {
          e.preventDefault();
          cell.classList.add('drag-over');
        });
        cell.addEventListener('dragleave', () => {
          cell.classList.remove('drag-over');
        });
        cell.addEventListener('drop', (e) => {
          e.preventDefault();
          cell.classList.remove('drag-over');
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          const { tripIds } = data;
          console.log(`Dropping trips ${tripIds} to ${routeId}`);
          const targetRoute = routes.find(r => r.id === routeId);
          if (!targetRoute) {
            console.error(`Target route ${routeId} not found`);
            return;
          }
          tripIds.forEach(tripId => {
            const tripData = findTripById(tripId);
            if (!tripData) {
              console.error(`Trip ${tripId} not found during drop`);
              return;
            }
            const { route: sourceRoute, passenger } = tripData;
            console.log(`Moving trip ${tripId} from ${sourceRoute.id} to ${routeId}`);
            sourceRoute.passengers = sourceRoute.passengers.filter(p => p.tripId !== tripId);
            targetRoute.passengers.push(passenger);
          });
          document.body.removeChild(table);
          console.log('Routes after table drop:', JSON.stringify(routes));
          renderRoutes(prtMap, medicationMap, date);
        });
        row.appendChild(cell);
        routeIndex++;
      }
    }
    table.appendChild(row);
  }

  document.body.appendChild(table);
  console.log(`Created route selection table at (${x}, ${y})`);
  return table;
}

// 渲染路由和乘客
function renderRoutes(prtMap, medicationMap, date) {
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

  inputContainer.style.display = 'none';
  displayContent.style.display = 'block';

  driversContainer.innerHTML = '';
  timelineHeader.innerHTML = '';
  displayContent.innerHTML = '';

  const { minTime, maxTime } = getTimeRange();
  renderTimelineHeader(minTime, maxTime);

  routes.forEach(route => {
    const routeRow = document.createElement("div");
    routeRow.className = "driver-row";
    routeRow.dataset.routeId = route.id;

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

      const targetRoute = routes.find(r => r.id === route.id);
      tripIds.forEach(tripId => {
        const tripData = findTripById(tripId);
        if (!tripData) {
          console.error(`Trip ${tripId} not found during row drop`);
          return;
        }
        const { route: sourceRoute, passenger } = tripData;
        console.log(`Moving trip ${tripId} from ${sourceRoute.id} to ${route.id}`);
        sourceRoute.passengers = sourceRoute.passengers.filter(p => p.tripId !== tripId);
        targetRoute.passengers.push(passenger);
      });

      const selectionTable = document.querySelector('.medication-route-selection-table');
      if (selectionTable) {
        document.body.removeChild(selectionTable);
      }

      console.log('Routes after row drop:', JSON.stringify(routes));
      renderRoutes(prtMap, medicationMap, date);
    });

    const routeLabel = document.createElement("div");
    routeLabel.className = "driver-label";
    routeLabel.textContent = route.id || 'Unknown Route';

    const exportBtn = document.createElement("button");
    exportBtn.className = "medication-export-csv-btn";
    exportBtn.textContent = "Export CSV";
    exportBtn.addEventListener('click', () => {
      exportRouteToCSV(route, date, prtMap, medicationMap);
    });
    routeLabel.appendChild(document.createElement("br"));
    routeLabel.appendChild(exportBtn);

    routeRow.appendChild(routeLabel);

    const passengerContainer = document.createElement("div");
    passengerContainer.className = "passenger-container";
    passengerContainer.style.width = `${timelineWidth}px`;

    const passengersWithLanes = assignLanes(route.passengers || []);
    const maxLane = passengersWithLanes.length > 0 ? Math.max(...passengersWithLanes.map(p => p.lane), 0) + 1 : 1;
    passengerContainer.style.height = `${maxLane * laneHeight + 4}px`;
    console.log(`Route ${route.id} maxLane: ${maxLane}, height: ${passengerContainer.style.height}`);

    passengersWithLanes.forEach(p => {
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
      block.className = "medication-passenger-block";
      block.dataset.id = p.id;
      block.dataset.tripId = p.tripId;
      block.draggable = true;
      block.dataset.routeId = route.id;
      block.dataset.pickup = p.pickup;
      block.dataset.dropoff = p.dropoff;

      if (p.status === 'deleted') {
        block.classList.add("medication-status-cancelled");
      } else if (p.status === 'added') {
        block.classList.add("medication-status-added"); // 新增行程为红色
      } else {
        block.classList.add("medication-b-leg-med"); // 默认咖啡色
      }

      block.addEventListener('click', (e) => {
        const isMultiSelectKeyPressed = e.ctrlKey || e.metaKey;
        const isSelected = block.classList.contains('selected');

        if (isMultiSelectKeyPressed) {
          if (isSelected) {
            block.classList.remove('selected');
          } else {
            block.classList.add('selected');
          }
          document.querySelectorAll(".medication-passenger-block").forEach(b => {
            b.classList.remove("same-id");
          });
          document.querySelectorAll(".medication-passenger-block").forEach(otherBlock => {
            if (otherBlock.dataset.id === p.id && !otherBlock.classList.contains('selected') && otherBlock !== block) {
              otherBlock.classList.add("same-id");
            }
          });
        } else {
          document.querySelectorAll(".medication-passenger-block").forEach(b => {
            b.classList.remove("selected", "same-id");
          });
          block.classList.add("selected");
          document.querySelectorAll(".medication-passenger-block").forEach(otherBlock => {
            if (otherBlock.dataset.id === p.id && otherBlock !== block) {
              otherBlock.classList.add("same-id");
            }
          });
        }
      });

      block.addEventListener('dragstart', (e) => {
        block.classList.add('dragging');
        const selectedBlocks = document.querySelectorAll(".medication-passenger-block.selected");
        let tripIds;
        if (selectedBlocks.length > 0) {
          tripIds = Array.from(selectedBlocks).map(b => b.dataset.tripId);
        } else {
          tripIds = [block.dataset.tripId];
        }
        e.dataTransfer.setData('text/plain', JSON.stringify({ tripIds }));
        createRouteSelectionTable(e.clientX, e.clientY);
      });

      block.addEventListener('dragend', () => {
        block.classList.remove('dragging');
        const selectionTable = document.querySelector('.medication-route-selection-table');
        if (selectionTable) {
          document.body.removeChild(selectionTable);
        }
      });

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
        mainTable.className = "medication-display-table";
        const editableFields = ['id', 'pickup', 'dropoff', 'puaddress', 'doaddress', 'phone', 'note', 'leg'];
        const inputs = {};

        editableFields.forEach((field, index) => {
          const row = document.createElement("tr");
          const keyCell = document.createElement("td");
          const valueCell = document.createElement("td");
          keyCell.textContent = field === 'id' ? 'Name' : field === 'phone' ? 'Phone' : field.charAt(0).toUpperCase() + field.slice(1);
          const valueSpan = document.createElement("span");
          valueSpan.className = "medication-editable-field";
          valueSpan.textContent = passenger[field] || '';
          valueCell.appendChild(valueSpan);
          row.appendChild(keyCell);
          row.appendChild(valueCell);
          mainTable.appendChild(row);

          valueSpan.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'medication-edit-input';
            input.value = passenger[field] || '';
            inputs[field] = input;
            valueCell.replaceChild(input, valueSpan);
            input.focus();

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
                showError(`Invalid ${field} format: must be HHMM (e.g., 1700)`);
                newValue = passenger[field];
              } else if (field === 'phone' && newValue && !isValidPhoneFormat(newValue)) {
                showError(`Invalid phone format: must be XXX-XXX-XXXX (e.g., 123-456-7890)`);
                newValue = passenger[field];
              }
              passenger[field] = newValue;
              block.dataset[field] = newValue;
              if (field === 'id') {
                block.dataset.id = newValue;
              }
              valueSpan.textContent = newValue || '';
              valueCell.replaceChild(valueSpan, input);
              input.removeEventListener('keydown', tabHandler);
              console.log(`Updated ${field} to ${newValue} for tripId=${p.tripId}:`, passenger);
            });

            input.addEventListener('keypress', (e) => {
              if (e.key === 'Enter') {
                input.blur();
              }
            });

            valueSpan.dataset.field = field;
          });
        });

        displayContent.appendChild(mainTable);

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "button-container";

        const confirmBtn = document.createElement("button");
        confirmBtn.id = "medication-confirmEditBtn";
        confirmBtn.textContent = "Confirm Edit";
        confirmBtn.addEventListener('click', () => {
          if (!isValidTimeFormat(passenger.pickup) || !isValidTimeFormat(passenger.dropoff)) {
            showError('Invalid pickup or dropoff time format: must be HHMM (e.g., 1700)');
            return;
          }
          if (passenger.phone && !isValidPhoneFormat(passenger.phone)) {
            showError('Invalid phone format: must be XXX-XXX-XXXX (e.g., 123-456-7890)');
            return;
          }

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

          console.log('Routes after update:', JSON.stringify(routes));
          clearError();
          renderRoutes(prtMap, medicationMap, date);
        });
        buttonContainer.appendChild(confirmBtn);

        const toggleDeleteBtn = document.createElement("button");
        toggleDeleteBtn.id = "medication-toggleDeleteBtn";
        toggleDeleteBtn.textContent = passenger.status === 'deleted' ? "Add Back" : "Delete Trip";
        toggleDeleteBtn.className = passenger.status === 'deleted' ? "medication-add-back-btn" : "medication-delete-trip-btn";
        toggleDeleteBtn.addEventListener('click', () => {
          console.log(`${passenger.status === 'deleted' ? 'Restoring' : 'Marking as deleted'} tripId=`, p.tripId);
          for (let i = 0; i < routes.length; i++) {
            if (JSON.stringify(routes[i]).includes(`"${p.tripId}"`)) {
              let tempPassengers = routes[i].passengers;
              for (let j = 0; j < tempPassengers.length; j++) {
                if (JSON.stringify(tempPassengers[j]).includes(`"${p.tripId}"`)) {
                  if (passenger.status === 'deleted') {
                    delete tempPassengers[j].status; // 恢复正常状态
                    console.log('Restored trip:', tempPassengers[j]);
                  } else {
                    tempPassengers[j].status = 'deleted'; // 标记为已删除
                    console.log('Marked trip as deleted:', tempPassengers[j]);
                  }
                  break;
                }
              }
              break;
            }
          }

          console.log('Routes after toggle delete:', JSON.stringify(routes));
          clearError();
          renderRoutes(prtMap, medicationMap, date);
          displayContent.innerHTML = '<p style="color: #fff;">Trip ' + (passenger.status === 'deleted' ? 'restored' : 'marked as deleted') + '. Select another trip to edit.</p>';
        });
        buttonContainer.appendChild(toggleDeleteBtn);

        displayContent.appendChild(buttonContainer);

        const hr = document.createElement("hr");
        hr.style.borderColor = '#555';
        displayContent.appendChild(hr);
        const otherTripsHeader = document.createElement("h2");
        otherTripsHeader.textContent = "Other Trips";
        otherTripsHeader.style.color = '#fff';
        displayContent.appendChild(otherTripsHeader);
        const otherTripsTable = document.createElement("table");
        otherTripsTable.className = "medication-other-trips-table";
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        ["Route", "PU Time", "P/U Address", "D/O Address"].forEach(text => {
          const th = document.createElement("th");
          th.textContent = text;
          headerRow.appendChild(th);
        });
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
                const pickupCell = document.createElement("td");
                pickupCell.textContent = otherP.pickup || 'Unknown';
                row.appendChild(pickupCell);
                const puAddressCell = document.createElement("td");
                puAddressCell.textContent = otherP.puaddress || '';
                row.appendChild(puAddressCell);
                const doAddressCell = document.createElement("td");
                doAddressCell.textContent = otherP.doaddress || '';
                row.appendChild(doAddressCell);
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
  console.log('DOM loaded, initializing medication');
  const planBtn = document.getElementById('planBtn');
  const prtInfoInput = document.getElementById('prtInfoInput');
  const medicationInput = document.getElementById('medicationInput');
  const planDateSpan = document.getElementById('planDate');
  const searchInput = document.getElementById('searchInput');
  const exportAllBtn = document.getElementById('exportAllBtn');
  const addBtn = document.getElementById('addBtn');
  const displayContent = document.querySelector(".display-content");

  console.log('Plan Button:', planBtn);
  console.log('prt Info Input:', prtInfoInput);
  console.log('Medication Input:', medicationInput);
  console.log('Plan Date Span:', planDateSpan);
  console.log('Search Input:', searchInput);
  console.log('Export All Button:', exportAllBtn);
  console.log('Add Button:', addBtn);
  console.log('Display Content:', displayContent);

  if (!planBtn || !prtInfoInput || !medicationInput || !planDateSpan || !searchInput || !exportAllBtn || !addBtn || !displayContent) {
    console.error('Input fields, buttons, or display content not found');
    showError('Page initialization failed: required elements missing');
    return;
  }

  const inputContainer = document.querySelector('.input-container');
  if (inputContainer && displayContent) {
    inputContainer.style.display = 'block';
    displayContent.style.display = 'none';
  } else {
    console.error('Input container or display content not found');
  }

  searchInput.addEventListener('input', () => {
    filterTrips(searchInput.value.trim());
  });

  searchInput.addEventListener('blur', () => {
    const suggestions = document.getElementById('suggestions');
    suggestions.style.display = 'none';
  });

  addBtn.addEventListener('click', () => {
    const name = searchInput.value.trim();
    if (!name) {
      showError('Please enter a name to add');
      return;
    }
    const patientKey = name.toLowerCase();
    const prtRow = prtMap.get(patientKey);
    const addType = document.querySelector('input[name="addType"]:checked').value;
    const noteValue = addType === 'Add-on' ? 'Medication(add-on)' : 'Medication';

    if (prtRow) {
      let doaddress = prtRow['curr facility'] && facilityAddressMap[prtRow['curr facility']] ?
        facilityAddressMap[prtRow['curr facility']] : prtRow['Address'] || '';
      if (!doaddress) {
        showError(`No valid address for ${name}`);
        return;
      }

      let routeId = 'unschedule';
      if (prtRow['RT#']) {
        const rtNum = parseInt(prtRow['RT#'], 10);
        if (!isNaN(rtNum) && rtNum >= 0 && rtNum <= 12) {
          routeId = `Route ${rtNum}`;
        }
      }

      const newTrip = {
        tripId: generateTripId(),
        id: name,
        pickup: '1700',
        dropoff: '1800',
        puaddress: facilityAddressMap.IOA,
        doaddress: doaddress,
        status: 'added',
        leg: 'b-leg-Med',
        note: noteValue,
        phone: getPassengerPhone(name, prtMap, medicationMap)
      };

      const targetRoute = routes.find(r => r.id === routeId);
      if (targetRoute) {
        targetRoute.passengers.push(newTrip);
      } else {
        routes.push({ id: routeId, passengers: [newTrip] });
      }

      console.log('Added new trip:', newTrip);
      clearError();
      renderRoutes(prtMap, medicationMap, date);
      searchInput.value = ''; // 清空输入框
      document.getElementById('suggestions').innerHTML = '';
      document.getElementById('suggestions').style.display = 'none';
    } else {
      // 名字不在 prtMap 中，显示错误并生成可编辑表格
      showError(`Patient ${name} not found in prt Info`);
      displayContent.innerHTML = '';

      const header = document.createElement("h2");
      header.textContent = `New Trip: ${name}`;
      header.style.color = '#fff';
      displayContent.appendChild(header);

      const mainTable = document.createElement("table");
      mainTable.className = "medication-display-table";
      const editableFields = ['id', 'pickup', 'dropoff', 'puaddress', 'doaddress', 'phone', 'note', 'leg'];
      const inputs = {};
      const newTrip = {
        id: name,
        pickup: '1700',
        dropoff: '1800',
        puaddress: facilityAddressMap.IOA,
        doaddress: '',
        phone: '',
        note: noteValue,
        leg: 'b-leg-Med'
      };

      editableFields.forEach((field, index) => {
        const row = document.createElement("tr");
        const keyCell = document.createElement("td");
        const valueCell = document.createElement("td");
        keyCell.textContent = field === 'id' ? 'Name' : field === 'phone' ? 'Phone' : field.charAt(0).toUpperCase() + field.slice(1);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'medication-edit-input';
        input.value = newTrip[field] || '';
        inputs[field] = input;
        valueCell.appendChild(input);

        const tabHandler = (e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const nextField = editableFields[(index + 1) % editableFields.length];
            const nextInput = inputs[nextField];
            if (nextInput) {
              nextInput.focus();
            }
          }
        };
        input.addEventListener('keydown', tabHandler);

        input.addEventListener('blur', () => {
          newTrip[field] = input.value.trim();
          console.log(`Updated ${field} to ${newTrip[field]} for new trip`);
        });

        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            input.blur();
          }
        });

        row.appendChild(keyCell);
        row.appendChild(valueCell);
        mainTable.appendChild(row);
      });

      displayContent.appendChild(mainTable);

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "button-container";

      const confirmBtn = document.createElement("button");
      confirmBtn.id = "medication-confirmEditBtn";
      confirmBtn.textContent = "Confirm Edit";
      confirmBtn.addEventListener('click', () => {
        if (!isValidTimeFormat(newTrip.pickup) || !isValidTimeFormat(newTrip.dropoff)) {
          showError('Invalid pickup or dropoff time format: must be HHMM (e.g., 1700)');
          return;
        }
        if (newTrip.phone && !isValidPhoneFormat(newTrip.phone)) {
          showError('Invalid phone format: must be XXX-XXX-XXXX (e.g., 123-456-7890)');
          return;
        }
        if (!newTrip.id) {
          showError('Name is required');
          return;
        }
        if (!newTrip.doaddress) {
          showError('Dropoff address is required');
          return;
        }

        const trip = {
          tripId: generateTripId(),
          id: newTrip.id,
          pickup: newTrip.pickup,
          dropoff: newTrip.dropoff,
          puaddress: newTrip.puaddress,
          doaddress: newTrip.doaddress,
          status: 'added',
          leg: newTrip.leg,
          note: newTrip.note,
          phone: newTrip.phone || '000-000-0000'
        };

        const targetRoute = routes.find(r => r.id === 'unschedule') || { id: 'unschedule', passengers: [] };
        if (!routes.find(r => r.id === 'unschedule')) {
          routes.push(targetRoute);
        }
        targetRoute.passengers.push(trip);

        console.log('Added new trip:', trip);
        clearError();
        renderRoutes(prtMap, medicationMap, date);
        searchInput.value = '';
        displayContent.innerHTML = '';
        document.getElementById('suggestions').innerHTML = '';
        document.getElementById('suggestions').style.display = 'none';
      });
      buttonContainer.appendChild(confirmBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.id = "medication-toggleDeleteBtn";
      deleteBtn.textContent = "Delete Trip";
      deleteBtn.className = "medication-delete-trip-btn";
      deleteBtn.addEventListener('click', () => {
        console.log('Clearing new trip input');
        searchInput.value = '';
        displayContent.innerHTML = '';
        document.getElementById('suggestions').innerHTML = '';
        document.getElementById('suggestions').style.display = 'none';
        clearError();
      });
      buttonContainer.appendChild(deleteBtn);

      displayContent.appendChild(buttonContainer);
    }
  });

  exportAllBtn.addEventListener('click', () => {
    if (!routes || routes.length === 0) {
      showError('No trips available to export');
      return;
    }
    exportAllTrips(date, prtMap, medicationMap);
  });

  planBtn.addEventListener('click', () => {
    console.log('Plan button clicked');
    if (typeof generateTrips !== 'function') {
      console.error('generateTrips is not a function');
      showError('Internal error: generateTrips function not found');
      return;
    }
    const prtInfoText = prtInfoInput.value.trim();
    const medicationText = medicationInput.value.trim();
    if (!prtInfoText || !medicationText) {
      showError('Please enter both prt Info and Medication data');
      return;
    }
    const result = generateTrips(prtInfoText, medicationText);
    routes = result.routes;
    date = result.date;
    medicationMap = result.medicationMap;
    prtMap = new Map();
    const prtInfo = parseTable(prtInfoText);
    prtInfo.data.forEach(row => {
      if (row['Name']) {
        prtMap.set(row['Name'].toLowerCase(), row);
      }
    });
    console.log('Initial routes:', JSON.stringify(routes));
    planDateSpan.textContent = `Date: ${date.split('/').slice(0, 2).join('/')}`;
    renderRoutes(prtMap, medicationMap, date);
  });
});
