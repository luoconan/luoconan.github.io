// version: v2.0.18 
var routes = []; // MODIFICATION: Used 'var' instead of 'let' to prevent 'already been declared' SyntaxError
let prtMap = new Map(); // 初始化为 Map
let darMap = new Map();
let date;
let prtInfoHistory = []; 

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

function showError(message) {
  const errorMsg = document.getElementById('errorMsg');
  if (errorMsg) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
  } else {
    console.error('Error message container not found');
  }
}

function clearError() {
  const errorMsg = document.getElementById('errorMsg');
  if (errorMsg) {
    errorMsg.textContent = '';
    errorMsg.style.display = 'none';
  }
}

function isValidTimeFormat(timeStr) {
  const regex = /^\d{4}$/;
  if (!regex.test(timeStr)) return false;
  const hours = parseInt(timeStr.slice(0, 2), 10);
  const minutes = parseInt(timeStr.slice(2, 4), 10);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function isValidPhoneFormat(phoneStr) {
  const regex = /^\d{3}-\d{3}-\d{4}$/;
  return regex.test(phoneStr);
}

function parseTime(timeStr) {
  try {
    const hours = parseInt(timeStr.slice(0, 2), 10);
    const minutes = parseInt(timeStr.slice(2, 4), 10);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return new Date(2025, 4, 15, hours, minutes).getTime();
  } catch (e) {
    return 0;
  }
}

function adjustTime(timeStr, minutes) {
  try {
    const hours = parseInt(timeStr.slice(0, 2), 10);
    const minutesCurrent = parseInt(timeStr.slice(2, 4), 10);
    if (isNaN(hours) || isNaN(minutesCurrent)) return timeStr;
    const date = new Date(2025, 4, 15, hours, minutesCurrent);
    date.setMinutes(date.getMinutes() + minutes);
    const newHours = date.getHours().toString().padStart(2, '0');
    const newMinutes = date.getMinutes().toString().padStart(2, '0');
    return `${newHours}${newMinutes}`;
  } catch (e) {
    return timeStr;
  }
}

function formatTimeToHHMM(timeStr) {
  if (!isValidTimeFormat(timeStr)) return timeStr;
  const hours = timeStr.slice(0, 2);
  const minutes = timeStr.slice(2, 4);
  return `${hours}:${minutes}`;
}

// Zip Code 默认为 94118
function processAddress(address) {
  if (!address) return { street: '', zip: '94118' };
  
  const trimmed = address.trim();
  const sanFranciscoIndex = trimmed.toLowerCase().indexOf('san francisco');
  let street = sanFranciscoIndex !== -1 ? trimmed.slice(0, sanFranciscoIndex).trim() : trimmed;
  street = street.replace(/[,]/g, '');
  
  const zipMatch = trimmed.match(/\b\d{5}\b/);
  const zip = zipMatch ? zipMatch[0] : '94118';
  
  return { street: street.trim(), zip };
}

function getPassengerPhone(patient, prtMap, darMap) {
  const patientKey = patient.toLowerCase();
  let phone = darMap.get(patientKey)?.['Phone']?.replace(/Hm: /g, '').slice(0, 12) || '';
  if (!phone) {
    phone = prtMap.get(patientKey)?.['Phone']?.slice(0, 12) || '000-000-0000';
  }
  return phone;
}

/**
 * 将 PRT Wander, DAR Escort 和 PRT Pickup Note 合并成一个备注字符串。
 * @param {object} prtRow PRT Info 行数据
 * @param {object | undefined} darRow DAR 行数据
 * @param {boolean} isMedication 是否为 Medication trip
 * @param {boolean} isAppointment 是否为 External Appointment trip
 * @returns {string} 合并后的备注字符串。
 */
function constructInitialNote(prtRow, darRow, isMedication, isAppointment) {
  const notes = [];

  // 1. PRT Wander (非 Medication)
  if (!isMedication) {
      const wander = (prtRow['Wander'] || '').trim();
      if (wander) {
          notes.push(wander);
      }
  }

  // 2. DAR Escort (Appointment 专用, 忽略特定值)
  if (isAppointment && darRow) {
      const escort = (darRow['Escort'] || '').trim();
      // 忽略 "-", "Y", "N", 以及纯数字
      const isSimpleEscort = ['-', 'y', 'n'].includes(escort.toLowerCase()) || /^\d+$/.test(escort);
      
      if (escort && !isSimpleEscort) {
          notes.push(`Escort: ${escort}`);
      }
  }
  
  // 3. PRT Pickup Note
  const pickupNote = (prtRow['Pickup Note'] || '').trim();
  if (pickupNote) {
      notes.push(pickupNote);
  }
  
  return notes.join(' / ').trim();
}


function getTripSpace(passenger, prtRow) {
  const leg = passenger.leg || '';
  const isMedication = leg === 'b-leg-Med';

  if (isMedication) {
      // 1. Medication Trip: DME & Rx
      return 'DME & Rx';
  } else {
      // 2. Non-Medication Trip: Use PRT Service Type
      const serviceType = (prtRow['Service Type'] || '').trim().toLowerCase();
      if (serviceType.includes('wheelchair')) {
          return 'Wheelchair';
      } else {
          // 默认为 Ambulatory
          return 'Ambulatory';
      }
  }
}

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

function parseVisitType(visitTypeStr) {
  if (!visitTypeStr) return { raw: [], has: () => false, findTime: () => null };
  const types = visitTypeStr.toLowerCase().split(',').map(s => s.trim());
  return {
    raw: types,
    has: (keyword) => types.includes(keyword),
    findTime: (prefix) => {
      const found = types.find(t => t.startsWith(prefix));
      return found ? found.replace(prefix, '').trim() : null;
    }
  };
}

function isCenterAddress(address) {
  return address && address.toLowerCase().includes('3595 geary');
}

// 智能地址标准化
function normalizeAddr(addr) {
  if (!addr) return '';
  let s = addr.toLowerCase();

  const firstDigitIdx = s.search(/\d/);
  if (firstDigitIdx !== -1) {
    s = s.substring(firstDigitIdx);
  }

  const replacements = {
    'street': 'st', 'avenue': 'ave', 'boulevard': 'blvd', 'road': 'rd',
    'drive': 'dr', 'lane': 'ln', 'court': 'ct', 'circle': 'cir',
    'way': 'way', 'place': 'pl', 'terrace': 'ter', 'apartment': 'apt', 'suite': 'ste'
  };
  
  Object.keys(replacements).forEach(key => {
    s = s.replace(new RegExp(`\\b${key}\\b`, 'g'), replacements[key]);
  });

  s = s.replace(/[^a-z0-9\s]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  const suffixes = ['st', 'ave', 'blvd', 'rd', 'dr', 'ln', 'ct', 'cir', 'way', 'pl', 'ter'];
  const unitMarkers = ['apt', 'ste', 'unit', 'fl', 'rm', 'bldg']; 

  const words = s.split(' ');
  let resultWords = [];
  
  for (let w of words) {
    if (unitMarkers.includes(w)) break; 
    resultWords.push(w);
    if (suffixes.includes(w)) break; 
  }
  
  return resultWords.join('').replace(/\s/g, '');
}

function checkMismatch(darRow, prtRow) {
  if (!prtRow) return false;
  
  const darCF = normalizeAddr(darRow['curr facility']);
  const prtCF = normalizeAddr(prtRow['Curr Facility']);
  if (darCF !== prtCF) return true;
  
  const darAddr = normalizeAddr(darRow['address']);
  const prtAddr = normalizeAddr(prtRow['Address']);
  
  if (!darAddr && !prtAddr) return false; 
  if (!darAddr || !prtAddr) return true;

  if (darAddr !== prtAddr) return true;
  
  return false;
}

function loadPrtInfo() {
  // 从模态框获取 PRT Info
  const prtInput = document.getElementById('prtInfoInputModal');
  const prtText = prtInput.value.trim();
  
  if (!prtText) {
    showError('PRT Info cannot be empty.');
    return false;
  }
  
  const newPrtData = parseTable(prtText).data;
  
  // 1. 覆盖 Map
  const newPrtMap = new Map();
  let hasValidData = false;
  newPrtData.forEach(row => {
    if (row['MRN'] === undefined) row['MRN'] = ''; 
    if (row['Wander'] === undefined) row['Wander'] = '';
    if (row['Pickup Note'] === undefined) row['Pickup Note'] = '';
    if (row['Name']) {
      newPrtMap.set(row['Name'].toLowerCase(), row);
      hasValidData = true;
    }
  });
  
  if (!hasValidData && newPrtData.length > 0) {
      showError('PRT Info loaded, but no valid data rows found. Check format (Tab separated and includes "Name").');
      return false;
  }
  
  if (!hasValidData) {
      showError('PRT Info cannot be parsed or is empty.');
      return false;
  }

  // 2. 更新全局变量和历史记录
  prtMap = newPrtMap;
  prtInfoHistory = Array.from(newPrtMap.values()); 
  window.prtMap = prtMap;
  
  // 隐藏模态框，显示主内容
  document.getElementById('prt-modal-backdrop').style.display = 'none';
  document.getElementById('main-content').classList.remove('main-content-hidden');
  
  // 默认打开 Data & Plan tab
  const defaultTab = document.querySelector('.tab-buttons [data-tab="data-planning"]');
  if (defaultTab) {
      defaultTab.click(); 
  }
  
  clearError();
  // 初始渲染 Summary 确保表格存在
  updateSummaryTable(); 
  return true;
}

function mergePrtInfo(newPrtInfoText) {
  // 此函数现在保留，但如果 PRT Info 输入仅在模态框中，则此函数仅返回当前的 prtMap
  return prtMap;
}

function generateTrips(prtInfoText, darText) {
  clearError();
  tripIdCounter = 0;
  
  const mergedPrtMap = prtMap;
  
  const darLines = darText.trim().split('\n').map(line => line.trim());
  if (darLines.length < 3) return { date: '', routes: [], darMap: new Map() };
  
  const dateMatch = darLines[0].match(/(\w+,\s*(\d{2})\/(\d{2})\/(\d{4}))/);
  date = dateMatch ? `${dateMatch[2]}/${dateMatch[3]}/${dateMatch[4]}` : `--/--/${new Date().getFullYear()}`;
  
  // FIX: 确保 dayOfWeek 在整个函数作用域内有效
  let dayOfWeek = -1; 
  if (dateMatch) {
    dayOfWeek = new Date(dateMatch[4], dateMatch[2] - 1, dateMatch[3]).getDay();
  }

  const dar = parseTable(darLines.slice(1).join('\n'));
  darMap = new Map();
  
  const uniquePatients = new Map();

  dar.data.forEach(row => {
    if (row['Phone'] === undefined) row['Phone'] = '';
    if (row['Escort'] === undefined) row['Escort'] = '';
    
    if (row['Patient']) darMap.set(row['Patient'].toLowerCase(), row);
    
    if (row['Transpo'] === 'Y') {
      const name = row['Patient'];
      const key = name.toLowerCase();
      
      if (!uniquePatients.has(key)) {
        uniquePatients.set(key, {
          name: name,
          rows: [],
          globalFlags: new Set(),
          baseAddress: '', 
          escort: ''
        });
      }
      
      const pData = uniquePatients.get(key);
      pData.rows.push(row);
      
      const vtStr = row['Visit Type'] || '';
      vtStr.toLowerCase().split(',').map(s => s.trim()).forEach(tag => {
        if(tag) pData.globalFlags.add(tag);
      });
      
      if (!pData.baseAddress) {
        let addr = row['address'] || '';
        const cf = row['curr facility'] || '';
        if (cf && facilityAddressMap[cf]) addr = facilityAddressMap[cf];
        pData.baseAddress = addr;
      }
    }
  });

  const allTrips = [];

  uniquePatients.forEach((pData, patientKey) => {
    const name = pData.name;
    const globalFlags = pData.globalFlags; 
    const address = pData.baseAddress;
    const prtRow = mergedPrtMap.get(patientKey) || {}; 
    const darRow = darMap.get(patientKey) || {}; // 基础 DAR Row
    
    const hasGlobal = (key) => globalFlags.has(key);
    const findGlobalTime = (prefix) => {
      for (let tag of globalFlags) {
        if (tag.startsWith(prefix)) return tag.replace(prefix, '').trim();
      }
      return null;
    };

    let baseMismatch = checkMismatch(darRow, prtRow);

    const baseTrips = { a: null, b: null };
    
    if (!isCenterAddress(address)) {
      baseTrips.a = {
        tripId: generateTripId(), id: name, status: 'noAction', leg: 'a-leg',
        pickup: '0900', dropoff: '1030',
        puaddress: address, doaddress: facilityAddressMap.IOA,
        phone: getPassengerPhone(name, mergedPrtMap, darMap),
        mismatch: baseMismatch
      };
      baseTrips.b = {
        tripId: generateTripId(), id: name, status: 'noAction', leg: 'b-leg',
        pickup: '1545', dropoff: '1645',
        puaddress: facilityAddressMap.IOA, doaddress: address,
        phone: getPassengerPhone(name, mergedPrtMap, darMap),
        mismatch: baseMismatch
      };
      
      const isMed = false; 
      const isAppt = false;
      baseTrips.a.note = constructInitialNote(prtRow, darRow, isMed, isAppt);
      baseTrips.b.note = constructInitialNote(prtRow, darRow, isMed, isAppt);
    }

    if (baseTrips.a) {
      if (hasGlobal('noam') || hasGlobal('fromhome')) {
        baseTrips.a = null;
      } else if (hasGlobal('2nd')) {
        baseTrips.a.pickup = '1030'; baseTrips.a.dropoff = '1100';
      }
      const aTime = findGlobalTime('a@');
      if (aTime && isValidTimeFormat(aTime)) {
        baseTrips.a.pickup = aTime; baseTrips.a.dropoff = adjustTime(aTime, 30);
      }
    }
    if (baseTrips.b) {
      if (hasGlobal('nopm') || hasGlobal('backhome')) {
        baseTrips.b = null;
      } else if (hasGlobal('early')) {
        baseTrips.b.pickup = '1400'; baseTrips.b.dropoff = '1430';
      }
      const pTime = findGlobalTime('p@');
      if (pTime && isValidTimeFormat(pTime)) {
        baseTrips.b.pickup = pTime; baseTrips.b.dropoff = adjustTime(pTime, 30);
      }
    }

    if (hasGlobal('dialysis') || hasGlobal('dia')) {
      if (!hasGlobal('fromioa')) baseTrips.a = null;
      if (!hasGlobal('backioa')) baseTrips.b = null;
    }

    pData.rows.forEach(row => {
      const vt = parseVisitType(row['Visit Type'] || '');
      const apptTimeRaw = (row['appt time'] || '').replace(':', '');
      const apptNote = row['Appt Notes'] || row['address'] || ''; 
      const rowMismatch = checkMismatch(row, prtRow);
      
      const isExt = vt.has('ext') || vt.has('external appointment') || vt.has('external');
      const isAcup = vt.has('acupuncture') || vt.has('acup');
      const isDia = vt.has('dialysis') || vt.has('dia');

      if (isExt || isAcup || isDia) {
        const currentDarRow = row; 
        const isMed = false;
        const isAppt = true;

        const extA = {
          tripId: generateTripId(), id: name, status: 'noAction', leg: 'a-leg-ext',
          puaddress: '', doaddress: apptNote, note: '', phone: getPassengerPhone(name, mergedPrtMap, darMap),
          mismatch: rowMismatch
        };
        const extB = {
          tripId: generateTripId(), id: name, status: 'noAction', leg: 'b-leg-ext',
          puaddress: apptNote, doaddress: '', note: '', phone: getPassengerPhone(name, mergedPrtMap, darMap),
          mismatch: rowMismatch
        };
        
        const mergedNote = constructInitialNote(prtRow, currentDarRow, isMed, isAppt);
        extA.note = mergedNote;
        extB.note = mergedNote;

        let validAppt = isValidTimeFormat(apptTimeRaw);
        if (isAcup) {
          extA.pickup = '1045'; extA.dropoff = '1100';
          extB.pickup = '1300'; extB.dropoff = '1330';
        } else if (isDia) {
          if (validAppt) {
            extA.pickup = adjustTime(apptTimeRaw, -45); extA.dropoff = apptTimeRaw;
            extB.pickup = adjustTime(apptTimeRaw, 210);
            extB.dropoff = adjustTime(extB.pickup, 45);
          }
        } else {
          if (validAppt) {
            extA.pickup = adjustTime(apptTimeRaw, -45); extA.dropoff = apptTimeRaw;
            extB.pickup = adjustTime(apptTimeRaw, 90);
            extB.dropoff = adjustTime(extB.pickup, 45);
          }
        }

        let startLoc = facilityAddressMap.IOA;
        let endLoc = facilityAddressMap.IOA;

        if (isDia) {
          startLoc = address;
          endLoc = address;
          if (vt.has('fromioa')) startLoc = facilityAddressMap.IOA;
          if (vt.has('backioa')) endLoc = facilityAddressMap.IOA;
        } else {
          if (vt.has('noam') || vt.has('fromhome')) startLoc = address;
          if (vt.has('nopm') || vt.has('backhome')) endLoc = address;
        }

        extA.puaddress = startLoc;
        extB.doaddress = endLoc;

        if (extA.pickup && extA.dropoff) allTrips.push(extA);
        if (extB.pickup && extB.dropoff) allTrips.push(extB);
      }
    });

    if (baseTrips.a) allTrips.push(baseTrips.a);
    if (baseTrips.b) allTrips.push(baseTrips.b);
  });

  // Medication Trip 逻辑
  if (dayOfWeek !== -1) {
    mergedPrtMap.forEach((prtRow, patientKey) => {
      const medDay = prtRow['Med Day'];
      if (matchesMedDay(medDay, dayOfWeek)) {
        const darRow = darMap.get(patientKey);
        if (darRow) {
           const dAddr = (darRow['address'] || '').toLowerCase();
           const dFac = (darRow['curr facility'] || '').trim();
           if (!dFac && dAddr.includes('3595 geary')) return;
        }
        const name = prtRow['Name'];
        let doaddress = prtRow['Address'] || '';
        
        if (isCenterAddress(doaddress)) return;
        
        const isMed = true;
        const isAppt = false;
        
        const medicationTrip = {
          tripId: generateTripId(), id: name, status: 'noAction', leg: 'b-leg-Med',
          pickup: '1700', dropoff: '1730',
          puaddress: facilityAddressMap.IOA, doaddress: doaddress,
          phone: getPassengerPhone(name, mergedPrtMap, darMap)
        };
        
        medicationTrip.note = constructInitialNote(prtRow, darRow, isMed, isAppt);
        
        allTrips.push(medicationTrip);
      }
    });
  }

  const routeMap = new Map();
  for (let i = 0; i <= 12; i++) {
    routeMap.set(`Route ${i}`, { id: `Route ${i}`, passengers: [] });
  }
  routeMap.set('unschedule', { id: 'unschedule', passengers: [] });

  allTrips.forEach(trip => {
    const patient = trip.id.toLowerCase();
    const prtRow = mergedPrtMap.get(patient);
    let routeId = 'unschedule';
    if (prtRow && prtRow['RT#']) {
      const rtNum = parseInt(prtRow['RT#'], 10);
      if (!isNaN(rtNum) && rtNum >= 0 && rtNum <= 12) {
        routeId = `Route ${rtNum}`;
      }
    }
    routeMap.get(routeId).passengers.push(trip);
  });

  routes = Array.from(routeMap.values());
  window.routes = routes;
  console.log('Generated routes:', JSON.stringify(routes));
  return { date, routes, darMap };
}

function updateSummaryTable() {
    const summaryContainer = document.getElementById('summaryTableContainer');
    if (!summaryContainer) return;

    let ambCount = 0;
    let wchCount = 0;
    let dmeCount = 0;
    let totalTrips = 0;

    routes.forEach(route => {
        route.passengers.forEach(p => {
            // Status Check: Only count trips that are not permanently deleted
            if (p.status !== 'deleted') { 
                totalTrips++;
                const patient = p.id.toLowerCase();
                const prtRow = prtMap.get(patient) || {};
                const space = getTripSpace(p, prtRow);

                if (space === 'Ambulatory') {
                    ambCount++;
                } else if (space === 'Wheelchair') {
                    wchCount++;
                } else if (space === 'DME & Rx') {
                    dmeCount++;
                }
            }
        });
    });

    const totalAmbWch = ambCount + wchCount;
    const totalTripCount = totalTrips;
    const tripTotalRatio = totalTripCount > 0 ? `${totalAmbWch}/${totalTripCount}` : '0/0';
    
    // Summary 表格结构和样式
    const summaryTableHtml = `
        <table class="tripsheet">
            <tbody>
                <tr class="row-sod">
                    <td colspan="2" style="text-align: left;">SOD</td>
                </tr>
                <tr class="row-ioapace">
                    <td colspan="2">IOA Pace: ${date || '--/--/----'}</td>
                </tr>
                <tr class="row-count">
                    <td>AMB</td><td>${ambCount}</td>
                </tr>
                <tr class="row-count">
                    <td>WCH</td><td>${wchCount}</td>
                </tr>
                <tr class="row-count">
                    <td>DME</td><td>${dmeCount}</td>
                </tr>
                <tr class="row-total">
                    <td>Trip Total</td><td>${totalTripCount}</td>
                </tr>
            </tbody>
        </table>
    `;
    summaryContainer.innerHTML = summaryTableHtml;
}


function exportRouteToCSV(route, date, prtMap, darMap) {
  const headers = [
    'Date', 'Req Pickup', 'Appointment', 'Patient', 'Space', 'Pickup Comment', 'Dropoff Comment', 'Type',
    'Pickup Phone', 'Dropoff Phone', 'Authorization', 'Funding Source', 'Distance', 'Run',
    'Pickup Address', 'Pickup Address1', 'Pickup City', 'Pickup State', 'Pickup Zip',
    'Dropoff Address', 'Dropoff Address1', 'Dropoff City', 'Dropoff State', 'Dropoff Zip', 'Trip ID'
  ];
  const rows = [];
  const fullDate = date; 

  route.passengers.forEach(passenger => {
    if (passenger.status === 'deleted') return;
    const patient = passenger.id.toLowerCase();
    const prtRow = prtMap.get(patient) || {};
    const space = getTripSpace(passenger, prtRow); 
    const phone = getPassengerPhone(patient, prtMap, darMap);
    const pickupAddr = processAddress(passenger.puaddress);
    const dropoffAddr = processAddress(passenger.doaddress);
    
    let typeVal = 'Center Day';
    if (passenger.leg && passenger.leg.includes('ext')) {
      typeVal = 'Outside Appointment';
    } else if (passenger.leg === 'b-leg-Med') {
      typeVal = 'Medication';
    }
    
    // Status handling for export comment
    let dropoffComment = '';
    if (passenger.status === 'cancelled') {
        dropoffComment = 'Cancelled';
    }

    // Pickup Comment 直接使用 passenger.note 的内容
    const finalNote = passenger.note || ''; 
    const authorization = prtRow['MRN'] || ''; 

    const row = {
      Date: fullDate,
      'Req Pickup': formatTimeToHHMM(passenger.pickup),
      Appointment: formatTimeToHHMM(passenger.dropoff),
      Patient: passenger.id,
      Space: space,
      'Pickup Comment': finalNote, 
      'Dropoff Comment': dropoffComment, // Use specific dropoff comment for cancelled status
      Type: typeVal,
      'Pickup Phone': phone,
      'Dropoff Phone': '',
      Authorization: authorization, 
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
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  // FIX: Provide a date for single route export
  const routeNum = route.id.replace('Route ', 'RT');
  const fileName = `${date.replace(/\//g, '')}_${routeNum}.csv`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportAllTrips(date, prtMap, darMap) {
  const headers = [
    'Date', 'Req Pickup', 'Appointment', 'Patient', 'Space', 'Pickup Comment', 'Dropoff Comment', 'Type',
    'Pickup Phone', 'Dropoff Phone', 'Authorization', 'Funding Source', 'Distance', 'Run',
    'Pickup Address', 'Pickup Address1', 'Pickup City', 'Pickup State', 'Pickup Zip',
    'Dropoff Address', 'Dropoff Address1', 'Dropoff City', 'Dropoff State', 'Dropoff Zip', 'Trip ID'
  ];
  const rows = [];
  const fullDate = date;

  routes.forEach(route => {
    if (route.id === 'unschedule') return;
    
    route.passengers.forEach(passenger => {
      // Only export scheduled and non-deleted trips
      if (passenger.status === 'deleted') return;
      
      const patient = passenger.id.toLowerCase();
      const prtRow = prtMap.get(patient) || {};
      const space = getTripSpace(passenger, prtRow); 
      const phone = getPassengerPhone(patient, prtMap, darMap);
      const pickupAddr = processAddress(passenger.puaddress);
      const dropoffAddr = processAddress(passenger.doaddress);
      const routeNumber = route.id.replace('Route ', '');

      let typeVal = 'Center Day';
      if (passenger.leg && passenger.leg.includes('ext')) {
        typeVal = 'Outside Appointment';
      } else if (passenger.leg === 'b-leg-Med') {
        typeVal = 'Medication';
      }

      const finalNote = passenger.note || ''; 
      const authorization = prtRow['MRN'] || ''; 
      
      let dropoffComment = `@van${parseInt(routeNumber)>9?routeNumber:'0'+parseInt(routeNumber)}`;
      if (passenger.status === 'cancelled') {
        dropoffComment = 'Cancelled';
      }

      const row = {
        Date: fullDate,
        'Req Pickup': formatTimeToHHMM(passenger.pickup),
        Appointment: formatTimeToHHMM(passenger.dropoff),
        Patient: passenger.id,
        Space: space,
        'Pickup Comment': finalNote, 
        'Dropoff Comment': dropoffComment,
        Type: typeVal,
        'Pickup Phone': phone,
        'Dropoff Phone': '',
        Authorization: authorization, 
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
}

function matchesMedDay(medDayValue, dayIndex) {
  if (!medDayValue) return false;
  const val = String(medDayValue).trim().toLowerCase();
  if (val === String(dayIndex)) return true;
  if (val === String(dayIndex) + '.0') return true;
  const days = ['su', 'm', 'tu', 'w', 'th', 'f', 'sa'];
  const fullDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  if (val.includes(days[dayIndex])) return true;
  if (val.includes(fullDays[dayIndex])) return true;
  if (dayIndex === 2 && val === 't') return true;
  return false;
}

function parseTable(text) {
  const lines = text.trim().split('\n').map(line => line.trim());
  if (lines.length < 2) {
    if (lines.length === 1 && lines[0].trim()) {
        const headers = lines[0].split('\t').map(h => h.trim());
        return { headers, data: [] };
    }
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

function getTimeRange() {
  let minTime = Infinity;
  let maxTime = -Infinity;
  if (!routes || !Array.isArray(routes) || routes.length === 0) {
    return { minTime: new Date(2025, 4, 15, 7, 0).getTime(), maxTime: new Date(2025, 4, 15, 18, 0).getTime() };
  }
  routes.forEach(route => {
    if (route.passengers) {
      route.passengers.forEach(p => {
        const pickup = parseTime(p.pickup);
        const dropoff = parseTime(p.dropoff);
        if (pickup !== 0 && dropoff !== 0 && p.status !== 'deleted') { // Exclude deleted trips from time range calculation
          minTime = Math.min(minTime, pickup);
          maxTime = Math.max(maxTime, dropoff);
        }
      });
    }
  });
  if (minTime === Infinity) return { minTime: new Date(2025, 4, 15, 7, 0).getTime(), maxTime: new Date(2025, 4, 15, 18, 0).getTime() };
  
  const minDate = new Date(minTime);
  const maxDate = new Date(maxTime);
  const startTime = new Date(minDate).setHours(Math.floor(minDate.getHours()), 0, 0, 0);
  const endTime = new Date(maxDate).setHours(Math.ceil(maxDate.getHours()), 0, 0, 0);
  return { minTime: startTime, maxTime: endTime };
}

function timeToPixel(time, minTime, maxTime) {
  const duration = maxTime - minTime;
  return duration === 0 ? 0 : ((time - minTime) / duration) * timelineWidth;
}

function assignLanes(passengers) {
  if (!passengers) return [];
  const activePassengers = passengers.filter(p => p.status !== 'deleted'); // Only assign lanes to active trips
  const sorted = activePassengers.slice().sort((a, b) => parseTime(a.pickup) - parseTime(b.pickup));
  const lanes = [];
  sorted.forEach(p => {
    const pickup = parseTime(p.pickup);
    const dropoff = parseTime(p.dropoff);
    if (pickup === 0) return;
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i];
      if (!lane.some(ex => parseTime(p.pickup) < parseTime(ex.dropoff) && parseTime(p.dropoff) > parseTime(ex.pickup))) {
        lane.push({ ...p, lane: i });
        placed = true;
        break;
      }
    }
    if (!placed) lanes.push([{ ...p, lane: lanes.length }]);
  });
  return lanes.flat();
}

function filterTrips(searchText) {
  const blocks = document.querySelectorAll(".passenger-block");
  if (!searchText) {
    blocks.forEach(b => b.style.opacity = "1");
    return;
  }
  const keywords = searchText.toLowerCase().replace(/[,-\s]+/g, ' ').trim().split(' ');
  blocks.forEach(block => {
    const id = block.dataset.id.toLowerCase();
    const match = keywords.every(k => id.includes(k));
    block.style.opacity = match ? "1" : "0.2";
  });
}

function formatDisplayName(id) {
  let base = id.split(',')[0].trim();
  const match = id.match(/([\p{Emoji_Presentation}\p{Emoji}\u200D]+)/u);
  if (match) {
    const emoji = match[1];
    const firstWordMatch = base.match(/^\S+/);
    return `${emoji}${firstWordMatch ? firstWordMatch[0].replace(match[1], '') : base}`.trim();
  }
  return base.split(' ')[0].trim();
}

function renderTimelineHeader(minTime, maxTime) {
  const header = document.querySelector(".timeline-header");
  if (!header) return;
  header.innerHTML = '';
  const duration = (maxTime - minTime) / (1000 * 60 * 60);
  const tickInterval = 1000 * 60 * 60;
  for (let i = 0; i <= Math.ceil(duration); i++) {
    const time = minTime + i * tickInterval;
    const pixel = timeToPixel(time, minTime, maxTime) + driverLabelWidth + 100;
    const tick = document.createElement("div");
    tick.className = "time-tick";
    tick.style.left = `${pixel}px`;
    header.appendChild(tick);
    const label = document.createElement("div");
    label.className = "time-label";
    label.style.left = `${pixel}px`;
    label.textContent = new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    header.appendChild(label);
  }
}

function findTripById(tripId) {
  for (const route of routes) {
    const passenger = route.passengers.find(p => p.tripId === tripId);
    if (passenger) return { route, passenger };
  }
  return null;
}

function createRouteSelectionTable(x, y) {
  const table = document.createElement('table');
  table.className = 'route-selection-table';
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
        cell.className = 'route-selection-cell';
        cell.dataset.routeId = routeId;
        cell.textContent = routeId === 'unschedule' ? 'UN' : routeId.replace('Route ', '');
        cell.addEventListener('dragover', (e) => e.preventDefault() && cell.classList.add('drag-over'));
        cell.addEventListener('dragleave', () => cell.classList.remove('drag-over'));
        cell.addEventListener('drop', (e) => {
          e.preventDefault(); cell.classList.remove('drag-over');
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          const targetRoute = routes.find(r => r.id === routeId);
          if (targetRoute) {
            data.tripIds.forEach(tid => {
              const tData = findTripById(tid);
              if (tData) {
                tData.route.passengers = tData.route.passengers.filter(p => p.tripId !== tid);
                targetRoute.passengers.push(tData.passenger);
              }
            });
            document.body.removeChild(table);
            renderRoutes(prtMap, darMap, date);
            updateSummaryTable();
          }
        });
        row.appendChild(cell);
        routeIndex++;
      }
    }
    table.appendChild(row);
  }
  document.body.appendChild(table);
  return table;
}

function openTripDetailTab() {
    const tripDetailTab = document.querySelector('.tab-buttons [data-tab="trip-detail"]');
    if (tripDetailTab) {
        tripDetailTab.click();
    }
}

function getSelectedTripIds() {
    const selectedBlocks = document.querySelectorAll(".passenger-block.selected");
    return Array.from(selectedBlocks).map(b => b.dataset.tripId);
}

// Helper to update status or delete based on selected trips
function updateSelectedTrips(actionType) {
    const selectedIds = getSelectedTripIds();
    if (selectedIds.length === 0) {
        showError('No trips selected. Use Ctrl/Cmd+Click to select multiple trips.');
        return;
    }

    selectedIds.forEach(tid => {
        const tripData = findTripById(tid);
        if (tripData) {
            if (actionType === 'delete') {
                // Completely remove trip from its route's passengers array
                tripData.route.passengers = tripData.route.passengers.filter(p => p.tripId !== tid);
            } else if (actionType === 'cancel') {
                tripData.passenger.status = 'cancelled';
            } else if (actionType === 'addBack') {
                tripData.passenger.status = 'noAction';
            }
        }
    });

    renderRoutes(prtMap, darMap, date);
    clearError();
    updateSummaryTable();
}

// Function to render the list of all trips for the same participant
function renderAllParticipantTrips(participantId, displayPanel) {
    const allTrips = [];
    routes.forEach(route => {
        route.passengers.filter(p => p.id === participantId).forEach(p => {
            // Only list trips that haven't been permanently deleted
            if (p.status !== 'deleted') {
                allTrips.push({
                    ...p,
                    routeId: route.id.replace('Route ', '')
                });
            }
        });
    });

    const table = document.createElement("table");
    table.className = "all-trips-table";
    table.innerHTML = `
        <thead>
            <tr>
                <th>Rt#</th>
                <th>Name</th>
                <th>Pickup</th>
                <th>Dropoff</th>
                <th>P/U Address</th>
                <th>D/O Address</th>
            </tr>
        </thead>
        <tbody>
            ${allTrips.map(p => {
                // Address formatting: remove "San Francisco" and subsequent parts
                const puAddr = p.puaddress.split('San Francisco')[0].trim();
                const doAddr = p.doaddress.split('San Francisco')[0].trim();

                return `
                    <tr>
                        <td>${p.routeId === 'unschedule' ? 'UN' : p.routeId}</td>
                        <td>${p.id}</td>
                        <td>${formatTimeToHHMM(p.pickup)}</td>
                        <td>${formatTimeToHHMM(p.dropoff)}</td>
                        <td>${puAddr}</td>
                        <td>${doAddr}</td>
                    </tr>
                `;
            }).join('')}
        </tbody>
    `;

    const moduleContainer = document.createElement("div");
    moduleContainer.className = "all-trips-module";
    moduleContainer.innerHTML = '<h3>All Trips for this Participant</h3>';
    moduleContainer.appendChild(table);
    displayPanel.appendChild(moduleContainer);
}


function renderRoutes(prtMap, darMap, date) {
  const driversContainer = document.querySelector(".drivers");
  const timelineHeader = document.querySelector(".timeline-header");
  const displayContent = document.querySelector("#trip-detail"); 
  
  if (!driversContainer || !timelineHeader || !displayContent) return;

  driversContainer.innerHTML = '';
  timelineHeader.innerHTML = '';
  displayContent.innerHTML = '<p style="color:#bbb;">Double-click a trip block on the timeline to view details here.</p>';

  const { minTime, maxTime } = getTimeRange();
  renderTimelineHeader(minTime, maxTime);

  routes.forEach(route => {
    const routeRow = document.createElement("div");
    routeRow.className = "driver-row";
    routeRow.dataset.routeId = route.id;
    routeRow.addEventListener('dragover', (e) => e.preventDefault() && routeRow.classList.add('drag-over'));
    routeRow.addEventListener('dragleave', () => routeRow.classList.remove('drag-over'));
    routeRow.addEventListener('drop', (e) => {
      e.preventDefault(); routeRow.classList.remove('drag-over');
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const targetRoute = routes.find(r => r.id === route.id);
      if (targetRoute) {
        data.tripIds.forEach(tid => {
          const tData = findTripById(tid);
          if (tData) {
            tData.route.passengers = tData.route.passengers.filter(p => p.tripId !== tid);
            targetRoute.passengers.push(tData.passenger);
          }
        });
      }
      const selTable = document.querySelector('.route-selection-table');
      if (selTable) document.body.removeChild(selTable);
      renderRoutes(prtMap, darMap, date);
      updateSummaryTable();
    });

    const routeLabel = document.createElement("div");
    routeLabel.className = "driver-label";
    routeLabel.textContent = route.id || 'Unknown';
    const exportBtn = document.createElement("button");
    exportBtn.className = "export-csv-btn";
    exportBtn.textContent = "Export CSV";
    exportBtn.addEventListener('click', () => exportRouteToCSV(route, date, prtMap, darMap));
    routeLabel.appendChild(document.createElement("br"));
    routeLabel.appendChild(exportBtn);
    routeRow.appendChild(routeLabel);

    const passengerContainer = document.createElement("div");
    passengerContainer.className = "passenger-container";
    passengerContainer.style.width = `${totalWidth}px`;
    const passengersWithLanes = assignLanes(route.passengers || []);
    const maxLane = passengersWithLanes.length > 0 ? Math.max(...passengersWithLanes.map(p => p.lane), 0) + 1 : 1;
    passengerContainer.style.height = `${maxLane * laneHeight + 4}px`;

    passengersWithLanes.forEach(p => {
      const tripData = findTripById(p.tripId);
      if (!tripData) return;
      const { passenger } = tripData;
      const lane = document.createElement("div");
      lane.className = "passenger-lane";
      lane.style.top = `${p.lane * laneHeight}px`;

      const block = document.createElement("div");
      block.className = "passenger-block";
      block.dataset.id = p.id;
      block.dataset.tripId = p.tripId;
      block.draggable = true;
      
      // Color logic
      if (p.leg === 'b-leg-Med') {
        block.style.backgroundColor = '#F4A460';
      } else if (p.mismatch) {
        block.style.backgroundColor = '#9400D3'; // Highlight address mismatch
      } else if (p.status === 'cancelled') {
        block.classList.add("status-cancelled"); // Use grey for cancelled
      } else if (p.leg && (p.leg.includes('ext') || p.leg.includes('manual'))) {
        block.classList.add("external-appointment");
      } else {
        const status = p.status;
        if (status === 1 || status === "onBoard") block.classList.add("status-onboard");
        else if (status === 2 || status === "finished") block.classList.add("status-finished");
      }

      const pickupTime = parseTime(p.pickup);
      const dropoffTime = parseTime(p.dropoff);
      if (pickupTime === 0 || dropoffTime === 0) return;
      const pickupPixel = timeToPixel(pickupTime, minTime, maxTime) + driverLabelWidth;
      const dropoffPixel = timeToPixel(dropoffTime, minTime, maxTime) + driverLabelWidth;
      block.style.left = `${pickupPixel}px`;
      block.style.width = `${dropoffPixel - pickupPixel}px`;
      block.textContent = formatDisplayName(p.id);
      block.title = `${p.id}\n${p.pickup}-${p.dropoff}\nNote: ${p.note || 'None'}`;

      block.addEventListener('dragstart', (e) => {
        block.classList.add('dragging');
        const selected = document.querySelectorAll(".passenger-block.selected");
        const ids = selected.length ? Array.from(selected).map(b => b.dataset.tripId) : [p.tripId];
        e.dataTransfer.setData('text/plain', JSON.stringify({ tripIds: ids }));
        createRouteSelectionTable(e.clientX, e.clientY);
      });
      block.addEventListener('dragend', () => {
        block.classList.remove('dragging');
        const selTable = document.querySelector('.route-selection-table');
        if (selTable) document.body.removeChild(selTable);
      });
      
      block.addEventListener('dblclick', () => { // 双击打开详情
          openTripDetailTab();
          block.click(); // 触发 click 事件来渲染详情
      });

      block.addEventListener('click', (e) => {
        // Clear previous selection/highlight
        document.querySelectorAll(".passenger-block").forEach(b => {
             // Preserve selection if Ctrl/Cmd is pressed for multi-select
             if (!e.ctrlKey && !e.metaKey) {
                b.classList.remove("selected");
             }
             b.classList.remove("same-id");
        });

        const isMultiSelectKeyPressed = e.ctrlKey || e.metaKey;
        if (isMultiSelectKeyPressed) {
           block.classList.toggle('selected');
        } else {
           block.classList.add("selected");
        }
        
        // Add same-id highlight
        document.querySelectorAll(".passenger-block").forEach(b => {
           if (b.dataset.id === p.id && b !== block) {
               b.classList.add("same-id");
           }
        });

        // Render Trip Detail Panel
        const displayPanel = document.getElementById('trip-detail');
        displayPanel.innerHTML = '';
        
        // --- Module 1: Edit Trip Details ---
        const editModule = document.createElement("div");
        editModule.className = "edit-module";
        editModule.innerHTML = `<h3>Edit Trip Details</h3>`; 
        
        const mainTable = document.createElement("table");
        mainTable.className = "display-table";
        
        // Reordered fields
        const editableFields = ['id', 'pickup', 'dropoff', 'puaddress', 'doaddress', 'status', 'leg', 'note', 'phone']; 

        editableFields.forEach((field, index) => {
          const row = document.createElement("tr");
          const keyCell = document.createElement("td");
          const valueCell = document.createElement("td");
          
          let fieldName = field.charAt(0).toUpperCase() + field.slice(1);
          if (field === 'id') fieldName = 'Name';
          if (field === 'puaddress') fieldName = 'Puaddress';
          if (field === 'doaddress') fieldName = 'Doaddress';

          keyCell.textContent = fieldName;
          
          let input;
          const isNote = field === 'note';
          const isDisabled = field === 'leg' || field === 'status'; // Leg and Status are now read-only inputs
          
          if (isNote) {
              input = document.createElement('textarea');
              input.className = 'edit-textarea';
              input.rows = 3; 
          } else {
              input = document.createElement('input');
              input.type = 'text';
              input.className = 'edit-input';
          }
          
          input.value = passenger[field] || '';
          
          if (isDisabled) {
              input.disabled = true; 
              // Set background color for disabled fields
              input.style.backgroundColor = '#555'; 
          }
          
          // Input Change Listener (updates the model directly)
          input.addEventListener('change', () => {
              let newValue = input.value.trim();
              if ((field === 'pickup' || field === 'dropoff') && newValue && !isValidTimeFormat(newValue)) {
                  showError(`Invalid ${field} format: must be HHMM`);
                  input.value = passenger[field] || ''; // Revert input value
                  return;
              }
              
              // Update the passenger object
              passenger[field] = newValue;
              
              // Update the block data for immediate visual update on the timeline
              block.dataset[field] = newValue;
              if (field === 'id') block.dataset.id = newValue;
              if (field === 'note') block.title = `${p.id}\n${p.pickup}-${p.dropoff}\nNote: ${newValue || 'None'}`;
              
              clearError();
          });

          valueCell.appendChild(input);
          row.appendChild(keyCell);
          row.appendChild(valueCell); 
          mainTable.appendChild(row);
        });
        
        editModule.appendChild(mainTable);
        
        // New Button Container V2 (Cancel / Save Changes)
        const buttonContainerV2 = document.createElement("div");
        buttonContainerV2.className = "button-container-v2";

        const cancelBtn = document.createElement("button");
        cancelBtn.id = "cancelTripBtn";
        cancelBtn.textContent = "Cancel"; // Cancel = Change status to 'cancelled'
        cancelBtn.className = "cancel-btn";
        cancelBtn.addEventListener('click', () => {
          passenger.status = 'cancelled';
          renderRoutes(prtMap, darMap, date);
          updateSummaryTable();
        });
        buttonContainerV2.appendChild(cancelBtn);
        
        const confirmBtn = document.createElement("button");
        confirmBtn.id = "confirmEditBtn";
        confirmBtn.textContent = "Save Changes";
        confirmBtn.className = "save-changes-btn";
        confirmBtn.addEventListener('click', () => {
          // The input change listeners already updated the data model (passenger object)
          renderRoutes(prtMap, darMap, date);
          clearError();
          updateSummaryTable();
        });
        buttonContainerV2.appendChild(confirmBtn);
        
        editModule.appendChild(buttonContainerV2);
        displayPanel.appendChild(editModule);


        // --- Module 2: Batch Selection Actions ---
        const batchModule = document.createElement("div");
        batchModule.className = "batch-module";
        batchModule.innerHTML = `
          <h3>Batch Selection Actions</h3>
          <p class="batch-hint">Apply to trips selected with Ctrl/Cmd+Click on the timeline.</p>
        `;
        const buttonContainerBatch = document.createElement("div");
        buttonContainerBatch.className = "button-container-batch";

        const cancelSelectedBtn = document.createElement("button");
        cancelSelectedBtn.id = "cancelSelectedBtn";
        cancelSelectedBtn.textContent = "Cancel Selected";
        cancelSelectedBtn.className = "batch-cancel-btn";
        cancelSelectedBtn.addEventListener('click', () => updateSelectedTrips('cancel'));
        buttonContainerBatch.appendChild(cancelSelectedBtn);

        const addBackSelectedBtn = document.createElement("button");
        addBackSelectedBtn.id = "addBackSelectedBtn";
        addBackSelectedBtn.textContent = "Add Back Selected";
        addBackSelectedBtn.className = "batch-addback-btn";
        addBackSelectedBtn.addEventListener('click', () => updateSelectedTrips('addBack'));
        buttonContainerBatch.appendChild(addBackSelectedBtn);

        const deleteSelectedBtn = document.createElement("button");
        deleteSelectedBtn.id = "deleteSelectedBtn";
        deleteSelectedBtn.textContent = "Delete Selected";
        deleteSelectedBtn.className = "batch-delete-btn";
        deleteSelectedBtn.addEventListener('click', () => updateSelectedTrips('delete'));
        buttonContainerBatch.appendChild(deleteSelectedBtn);
        
        batchModule.appendChild(buttonContainerBatch);
        displayPanel.appendChild(batchModule);


        // --- Module 3: All Trips for this Participant ---
        renderAllParticipantTrips(p.id, displayPanel);

      });

      lane.appendChild(block);
      passengerContainer.appendChild(lane);
    });
    routeRow.appendChild(passengerContainer);
    driversContainer.appendChild(routeRow);
  });
  
  updateSummaryTable(); 
}

// Tab 切换功能
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-buttons button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.tab;

            tabContents.forEach(content => {
                content.style.display = 'none';
            });

            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });

            document.getElementById(targetId).style.display = 'block';
            button.classList.add('active');

            // Special action for Summary tab
            if (targetId === 'summary') {
                updateSummaryTable();
            }
        });
    });
}


document.addEventListener("DOMContentLoaded", () => {
  setupTabs(); 
  
  const prtLoadBtn = document.getElementById('prtLoadBtn');
  const darInput = document.getElementById('darInput');
  const planBtn = document.getElementById('planBtn');
  const resetBtn = document.getElementById('resetBtn');
  const planDateSpan = document.getElementById('planDate');
  const searchInput = document.getElementById('searchInput');
  const exportAllBtn = document.getElementById('exportAllBtn');

  // Load PRT Info listener
  if (prtLoadBtn) {
      prtLoadBtn.addEventListener('click', loadPrtInfo);
  }

  // --- Plan Button Listener (remains unchanged) ---
  if (planBtn) {
    planBtn.addEventListener('click', () => {
      const prt = ''; 
      const dar = darInput.value.trim();
      
      if (prtMap.size === 0) return showError('PRT Info has not been loaded yet.');
      if (!dar) return showError('Enter DAR Data to Plan');
      
      const res = generateTrips(prt, dar);
      routes = res.routes; 
      date = res.date; 
      darMap = res.darMap;
      
      planDateSpan.textContent = `Date: ${date}`;
      renderRoutes(prtMap, darMap, date);
      updateSummaryTable();
    });
  }

  if (resetBtn) {
      resetBtn.addEventListener('click', () => {
          darInput.value = '';
          darMap = new Map();
          routes = [];
          planDateSpan.textContent = 'Date: --/--';
          document.querySelector(".drivers").innerHTML = '';
          document.querySelector(".timeline-header").innerHTML = '';
          document.getElementById('trip-detail').innerHTML = '<p style="color:#bbb;">Double-click a trip block on the timeline to view details here.</p>';
          clearError();
          updateSummaryTable();
          // Default to Data & Plan tab
          const defaultTab = document.querySelector('.tab-buttons [data-tab="data-planning"]');
          if (defaultTab) {
              defaultTab.click(); 
          }
      });
  }

  if (exportAllBtn) exportAllBtn.addEventListener('click', () => exportAllTrips(date, prtMap, darMap));
  if (searchInput) searchInput.addEventListener('input', () => filterTrips(searchInput.value));
});