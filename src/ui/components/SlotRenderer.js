/**
 * [Component] 아이템 슬롯 DOM 생성을 담당하는 공통 컴포넌트입니다.
 * C# Porting: Unity의 UI Slot Prefab 및 그에 연결된 Script에 해당합니다.
 */
export class SlotRenderer {
    /**
     * 슬롯 엘리먼트를 생성하고 이벤트를 바인딩합니다.
     */
    static create(type, index, slotData, label, isHUD, ui) {
        const slot = document.createElement('div');
        if (type === 'container') slot.id = `loot-slot-${index}`;
        
        // 크기 설정 클래스
        const baseClass = type === 'quick' ? 'w-10 h-10 md:w-12 md:h-12 text-xl md:text-2xl' : 
                          type === 'stash' ? 'w-8 h-8 md:w-10 md:h-10 text-lg md:text-xl' : 
                          'w-12 h-12 md:w-14 md:h-14 text-2xl md:text-3xl';
        
        // 데이터 해석 (Loot 컨테이너 대응)
        let itemObj = slotData;
        let isRevealed = true;
        if (type === 'container' && slotData && typeof slotData === 'object' && 'revealed' in slotData) {
            isRevealed = slotData.revealed;
            itemObj = isRevealed ? slotData.data : null;
        }

        // 미탐색 슬롯 처리
        if (type === 'container' && slotData && !isRevealed) {
            slot.className = `inv-slot bg-gray-800 shadow-inner flex items-center justify-center relative overflow-hidden ${baseClass} cursor-wait`;        
            slot.innerHTML = `<span class="text-gray-500 font-bold text-lg animate-pulse">?</span>`;

            const pBar = document.createElement('div');
            pBar.className = "search-bar absolute bottom-0 left-0 h-1 bg-yellow-500 transition-none";
            const progress = slotData.progress || 0;
            pBar.style.width = `${Math.min(100, (progress / 1.5) * 100)}%`;
            slot.appendChild(pBar);

            // 탐색 이벤트 바인딩 (누르고 있기)
            const startAction = (e) => { e.preventDefault(); ui.startSearching(index); };
            const stopAction = () => ui.stopSearching();

            slot.addEventListener('pointerdown', (e) => {
                if (e.button === 0) startAction(e); // 좌클릭 시에만 Hold 탐색
            });
            slot.addEventListener('pointerup', () => {
                // 자동 탐색 중이 아닐 때만 수동 중단
                if (!ui.isAutoSearching) stopAction();
            });
            slot.addEventListener('pointerleave', () => {
                // 자동 탐색 중이 아닐 때만 수동 중단
                if (!ui.isAutoSearching) stopAction();
            });

            // 요구사항 3: 우클릭 시 해당 슬롯 탐색 시작 (과정을 거침)
            slot.oncontextmenu = (e) => {
                e.preventDefault();
                ui.startSearching(index);
            };

            return slot;

        }


        // 입력 장치 확인
        const im = ui.get('InputManager');
        const isTouch = im ? im.isTouchDevice : false;

        if (itemObj) {
            slot.className = `inv-slot bg-gray-700 shadow-inner cursor-pointer hover:bg-gray-500 transition flex items-center justify-center relative ${baseClass}`;
            slot.draggable = true;
            slot.innerHTML = `<span>${itemObj.emoji}</span>`;
            
            // 정보 표시 이벤트
            slot.addEventListener('mouseenter', () => ui.showItemInfo(itemObj));
            slot.addEventListener('mouseleave', () => { if(!ui.selectedMobileSlot) ui.clearItemInfo(); });

            if (isHUD) {
                slot.addEventListener('pointerdown', e => { 
                    e.preventDefault(); 
                    ui.useItem(type, index); 
                });
            } else {
                // 상호작용 바인딩
                if (isTouch) {
                    slot.addEventListener('touchstart', e => ui.handleMobileSlotClick(e, type, index), {passive: false});
                } else {
                    // 마우스 왼쪽 클릭 (장착/사용)
                    slot.addEventListener('click', e => {
                        if (e.button === 0) ui.useItem(type, index);
                    });
                    // 마우스 오른쪽 클릭
                    slot.oncontextmenu = e => { 
                        e.preventDefault(); 
                        ui.handleRightClickAction(type, index); 
                    };
                    // 드래그 시작
                    slot.addEventListener('dragstart', e => ui.handleDragStart(e, type, index));
                }
            }
        } else {
            // 빈 슬롯
            slot.className = `inv-slot empty bg-gray-900 bg-opacity-50 border border-gray-800 flex items-center justify-center relative ${baseClass}`;
            slot.addEventListener('mouseenter', () => { if(!ui.selectedMobileSlot) ui.clearItemInfo(); });
            
            if (isTouch && !isHUD) {
                slot.addEventListener('touchstart', e => ui.handleMobileSlotClick(e, type, index), {passive: false});
            }
        }
        
        // 선택 상태 표시 (모바일)
        if (ui.selectedMobileSlot?.type === type && ui.selectedMobileSlot?.index === index) {
            slot.classList.add('ring-2', 'ring-blue-500', 'z-10');
        }

        // 라벨 표시 (퀵슬롯 번호 등)
        if (label) {
            const lbl = document.createElement('span');
            lbl.className = 'absolute top-0 left-1 text-[9px] md:text-[11px] text-yellow-400 font-bold drop-shadow pointer-events-none';
            lbl.innerText = label;
            slot.appendChild(lbl);
        }
        
        // 드롭 이벤트 바인딩
        if (!isHUD && !isTouch) {
            slot.addEventListener('dragover', e => e.preventDefault());
            slot.addEventListener('drop', e => ui.handleDrop(e, type, index));
        }
        
        return slot;
    }
}
