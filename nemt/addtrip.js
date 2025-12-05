// version: v1.1.1 (Route Assignment & Medication Data Override)

document.addEventListener('DOMContentLoaded', () => {
    // === 变量定义 ===
    const IOA_ADDR = '3575 Geary Blvd San Francisco CA 94118';
    
    // 将 localPrtMap 挂载到 window 上，以供 planning.js 的导出函数 exportAllTrips 访问和使用
    window.localPrtMap = new Map(); 
    let localPrtMap = window.localPrtMap; // 使用 local 别名方便代码阅读
    
    // 确保全局变量存在，防止 planning.js 报错
    if (typeof window.darMap === 'undefined') window.darMap = new Map();
    if (typeof window.date === 'undefined') window.date = new Date().toLocaleDateString('en-US');

    // === DOM 元素引用 ===
    const prtInput = document.getElementById('prtSourceInput');
    const prtStatus = document.getElementById('prtStatus');
    const nameInput = document.getElementById('tripName');
    const phoneInput = document.getElementById('tripPhone');
    const radioButtons = document.querySelectorAll('input[name="tripType"]');
    const addTripBtn = document.getElementById('addTripBtn');
    
    // A-Leg 元素
    const aElements = {
        pickup: document.getElementById('aPickup'),
        dropoff: document.getElementById('aDropoff'),
        puAddr: document.getElementById('aPuAddr'),
        doAddr: document.getElementById('aDoAddr'),
        note: document.getElementById('aNote'),
    };

    // B-Leg 元素
    const bElements = {
        pickup: document.getElementById('bPickup'),
        dropoff: document.getElementById('bDropoff'),
        puAddr: document.getElementById('bPuAddr'),
        doAddr: document.getElementById('bDoAddr'),
        note: document.getElementById('bNote')
    };

    const autocompleteList = document.createElement('div');
    autocompleteList.setAttribute('id', 'autocomplete-list');
    autocompleteList.setAttribute('class', 'autocomplete-items');
    nameInput.parentNode.style.position = 'relative'; 
    nameInput.parentNode.appendChild(autocompleteList);
    
    // 初始化 B-Leg Medication 默认值 (如果 DOM 中没有值)
    if (!bElements.pickup.value) bElements.pickup.value = '1700';
    if (!bElements.dropoff.value) bElements.dropoff.value = '1800';
    if (!bElements.note.value) bElements.note.value = 'addon-Med';
    if (!bElements.puAddr.value) bElements.puAddr.value = IOA_ADDR;


    // === 初始化 左侧时间轴 (关键步骤) ===
    function initTimeline() {
        if (typeof routes !== 'undefined') {
            routes = [];
            for (let i = 0; i <= 12; i++) {
                routes.push({ id: `Route ${i}`, passengers: [] });
            }
            routes.push({ id: 'unschedule', passengers: [] });
            
            if (typeof renderRoutes === 'function') {
                renderRoutes(localPrtMap, window.darMap, window.date);
            }
        }
    }
    initTimeline();


    // === 核心逻辑部分 ===

    // 1. 监听 PRT 数据输入
    prtInput.addEventListener('input', (e) => {
        const text = e.target.value.trim();
        if (!text) {
            localPrtMap.clear();
            // 同步全局变量
            window.prtMap = localPrtMap; 
            prtStatus.textContent = "Waiting for data...";
            return;
        }
        
        if (typeof parseTable === 'function') {
            const result = parseTable(text);
            localPrtMap.clear();
            let count = 0;
            result.data.forEach(row => {
                 // 确保 MRN 字段存在
                if (row['MRN'] === undefined) row['MRN'] = ''; 
                if (row['Name']) {
                    localPrtMap.set(row['Name'].toLowerCase(), row);
                    count++;
                }
            });
            
            // 同步给 planning.js 使用的全局变量
            window.prtMap = localPrtMap; 
            
            prtStatus.textContent = `Loaded ${count} records.`;
            prtStatus.style.color = '#00e676';
        } else {
            prtStatus.textContent = "Error: planning.js not loaded";
        }
    });

    // 2. 监听 Trip Type 切换
    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            applyTripTypeLogic(radio.value);
        });
    });

    function applyTripTypeLogic(type) {
        // 步骤 1: 启用所有输入
        // 确保 A-Leg 和 B-Leg 的 section title/content 是可见的
        toggleInputs(aElements, true, true);
        toggleInputs(bElements, true, true);

        let currentHomeAddr = '';
        if (aElements.puAddr.value && !isCenter(aElements.puAddr.value)) currentHomeAddr = aElements.puAddr.value;
        else if (bElements.doAddr.value && !isCenter(bElements.doAddr.value)) currentHomeAddr = bElements.doAddr.value;

        // 步骤 2: 应用类型逻辑和默认值
        if (type === 'medication') {
            // Medication: 禁用 A-Leg
            toggleInputs(aElements, false, true); 
            clearInputs(aElements);
            
            // B-Leg 默认值 (使用 DOMContentLoaded 初始化时的值)
            bElements.pickup.value = '1700';
            bElements.dropoff.value = '1800';
            bElements.note.value = 'addon-Med';
            bElements.puAddr.value = IOA_ADDR;
            if (currentHomeAddr) bElements.doAddr.value = currentHomeAddr;

        } else if (type === 'daily') {
            aElements.pickup.value = '0900';
            aElements.dropoff.value = '1030';
            aElements.note.value = 'Center Day';
            if (currentHomeAddr) aElements.puAddr.value = currentHomeAddr;
            aElements.doAddr.value = IOA_ADDR;

            bElements.pickup.value = '1545';
            bElements.dropoff.value = '1645';
            bElements.note.value = 'Center Day';
            bElements.puAddr.value = IOA_ADDR;
            if (currentHomeAddr) bElements.doAddr.value = currentHomeAddr;

        } else if (type === 'appointment') {
            // Appointment 模式：清空，不做预设
            clearInputs(aElements);
            clearInputs(bElements);
        }
    }

    // 3. 名字自动补全
    nameInput.addEventListener('input', function(e) {
        const val = this.value;
        closeAllLists();
        if (!val) return false;
        
        autocompleteList.innerHTML = '';

        let matchCount = 0;
        for (let [key, row] of localPrtMap) {
            if (key.includes(val.toLowerCase())) {
                if (matchCount > 10) break;
                
                const item = document.createElement('div');
                item.textContent = row['Name'];
                item.innerHTML += `<input type='hidden' value='${row['Name']}'>`;
                
                item.addEventListener('click', function() {
                    const selectedName = this.getElementsByTagName('input')[0].value;
                    nameInput.value = selectedName;
                    
                    const selectedRow = localPrtMap.get(selectedName.toLowerCase());
                    fillPassengerInfo(selectedRow);
                    
                    closeAllLists();
                });
                
                autocompleteList.appendChild(item);
                matchCount++;
            }
        }
        if (matchCount > 0) autocompleteList.style.display = 'block';
    });

    document.addEventListener('click', function (e) {
        if (e.target !== nameInput) {
            closeAllLists();
        }
    });

    // === 新增：添加 Trip 到时间轴的逻辑 (集成 Route 分配) ===
    function addManualTrip() {
        const name = nameInput.value.trim();
        if (!name) {
            alert("Please enter a name.");
            return;
        }

        const phone = phoneInput.value.trim();
        const currentType = document.querySelector('input[name="tripType"]:checked').value;
        const tripsToAdd = [];
        let prtRow = localPrtMap.get(name.toLowerCase());

        // 步骤 1: 确定 Route ID
        let targetRouteId = 'unschedule';
        const rtNum = prtRow && prtRow['RT#'] ? parseInt(prtRow['RT#'], 10) : NaN;
        
        if (currentType === 'medication') {
            // Medication 强制根据 RT# 分配路由，无 RT# 则为 Route 0
            const medRouteNum = isNaN(rtNum) ? 0 : (rtNum >= 0 && rtNum <= 12 ? rtNum : 0);
            targetRouteId = `Route ${medRouteNum}`;
            
            // 覆盖/创建 PRT 行，确保 Service Type 和 RT# 正确
            prtRow = ensurePrtRowForMedication(name, phone, targetRouteId, bElements.doAddr.value, prtRow);
            localPrtMap.set(name.toLowerCase(), prtRow);
            
        } else if (!isNaN(rtNum) && rtNum >= 0 && rtNum <= 12) {
             // 其他类型：如果 PRT 有有效 RT#，则用它
             targetRouteId = `Route ${rtNum}`;
        } else {
             // 默认 unschedule
             targetRouteId = 'unschedule';
        }

        const targetRoute = routes.find(r => r.id === targetRouteId);

        if (!targetRoute) {
            console.error(`Route '${targetRouteId}' not found!`);
            return;
        }

        // 步骤 2: 构建 Trip 对象
        // 检查 A-Leg
        if (!aElements.pickup.disabled && aElements.pickup.value && aElements.dropoff.value) {
            const tripA = {
                tripId: generateTripId(), 
                id: name,
                status: 'noAction',
                // 使用正确的 leg 标记：Medication 不会有 A-Leg
                leg: currentType === 'daily' ? 'a-leg' : 'a-leg-ext', 
                pickup: aElements.pickup.value,
                dropoff: aElements.dropoff.value,
                puaddress: aElements.puAddr.value,
                doaddress: aElements.doAddr.value,
                note: aElements.note.value,
                phone: phone
            };
            tripsToAdd.push(tripA);
        }

        // 检查 B-Leg
        if (!bElements.pickup.disabled && bElements.pickup.value && bElements.dropoff.value) {
            let legType;
            if (currentType === 'medication') {
                legType = 'b-leg-Med'; // 关键：标记为 Medication Trip
            } else if (currentType === 'daily') {
                legType = 'b-leg';
            } else {
                legType = 'b-leg-ext';
            }
            
            const tripB = {
                tripId: generateTripId(),
                id: name,
                status: 'noAction',
                leg: legType,
                pickup: bElements.pickup.value,
                dropoff: bElements.dropoff.value,
                puaddress: bElements.puAddr.value,
                doaddress: bElements.doAddr.value,
                note: bElements.note.value,
                phone: phone
            };
            tripsToAdd.push(tripB);
        }

        // 步骤 3: 添加并渲染
        let addedCount = 0;
        if (tripsToAdd.length > 0) {
            tripsToAdd.forEach(trip => {
                targetRoute.passengers.push(trip);
                addedCount++;
            });
            
            // 重新渲染时间轴
            if (typeof renderRoutes === 'function') {
                 renderRoutes(localPrtMap, window.darMap, window.date || 'Today');
            }
            
            // 反馈
            const btn = document.getElementById('addTripBtn');
            const originalText = btn.textContent;
            btn.textContent = `Added to ${targetRoute.id}!`;
            btn.style.backgroundColor = "#4CAF50";
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = "";
            }, 1000);

        } else {
            alert("Please enter Pickup and Dropoff times for at least one leg.");
        }
    }

    // 4. 绑定 Add Trip 按钮事件
    if (addTripBtn) {
        addTripBtn.addEventListener('click', addManualTrip);
    }

    // 5. 绑定 Shift + Enter 快捷键
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            addManualTrip();
        }
    });
    
    // 6. 修复 Export All Button 的逻辑 (确保使用正确的 prtMap)
    const exportBtn = document.getElementById('exportAllBtn');
    if (exportBtn) {
        // 克隆按钮以移除所有旧的 Event Listeners
        const newExportBtn = exportBtn.cloneNode(true);
        exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
        
        newExportBtn.addEventListener('click', () => {
             if (typeof exportAllTrips === 'function') {
                 // 确保导出函数使用的是当前最新的 localPrtMap
                 exportAllTrips(window.date, localPrtMap, window.darMap);
             } else {
                 alert("Error: exportAllTrips function not found.");
             }
        });
    }


    // === 辅助函数 ===
    
    // 确保 PRT Row 存在，并覆盖 Medication 需要的字段
    function ensurePrtRowForMedication(name, phone, routeId, doAddress, existingRow) {
        const routeNum = routeId.replace('Route ', '');
        const newRow = existingRow || {
            'Name': name,
            'Phone': phone,
            'RT#': routeNum,
            'MRN': '', 
            'Address': doAddress
        };
        
        // 强制覆盖 Service Type 和 RT#
        newRow['Service Type'] = 'DME & Rx'; 
        newRow['RT#'] = routeNum;
        
        // 如果是新创建的，需要填充地址
        if (!existingRow) {
            newRow['Address'] = doAddress;
        }

        return newRow;
    }


    function fillPassengerInfo(row) {
        if (!row) return;

        if (row['Phone']) {
            phoneInput.value = row['Phone'].replace(/Hm: /g, '').slice(0, 12);
        }

        const homeAddress = row['Address'] || '';
        const currentType = document.querySelector('input[name="tripType"]:checked').value;

        if (currentType === 'daily') {
            aElements.puAddr.value = homeAddress;
            aElements.doAddr.value = IOA_ADDR;
            bElements.puAddr.value = IOA_ADDR;
            bElements.doAddr.value = homeAddress;
        } else if (currentType === 'medication') {
            bElements.puAddr.value = IOA_ADDR;
            bElements.doAddr.value = homeAddress;
        } else {
             // Appointment 或其他类型：填充家庭地址到 PU/DO 方便用户修改
             aElements.puAddr.value = homeAddress;
             bElements.doAddr.value = homeAddress;
        }
    }

    function toggleInputs(elementsObj, enable, hideSection = false) {
        const sectionTitle = elementsObj.pickup.closest('.section-title');
        const sectionContent = sectionTitle ? sectionTitle.nextElementSibling.parentElement : null;

        if (hideSection) {
             if (sectionTitle) sectionTitle.style.display = enable ? 'block' : 'none';
             if (sectionContent) sectionContent.style.display = enable ? 'block' : 'none';
        }

        const keys = ['pickup', 'dropoff', 'puAddr', 'doAddr', 'note'];
        keys.forEach(key => {
            if (elementsObj[key]) {
                elementsObj[key].disabled = !enable;
                if (!enable) {
                    elementsObj[key].style.backgroundColor = '#1a1a1a';
                    elementsObj[key].style.color = '#555';
                } else {
                    elementsObj[key].style.backgroundColor = '#3c3c3c';
                    elementsObj[key].style.color = '#fff';
                }
            }
        });
    }

    function clearInputs(elementsObj) {
        const keys = ['pickup', 'dropoff', 'puAddr', 'doAddr', 'note'];
        keys.forEach(key => {
            if (elementsObj[key]) elementsObj[key].value = '';
        });
    }

    function closeAllLists() {
        autocompleteList.innerHTML = '';
        autocompleteList.style.display = 'none';
    }

    function isCenter(addr) {
        return addr && (addr.includes('3575 Geary') || addr.includes('3595 Geary'));
    }

    // 初始化一次默认状态
    const checkedRadio = document.querySelector('input[name="tripType"]:checked');
    if (checkedRadio) {
        applyTripTypeLogic(checkedRadio.value);
    }
});