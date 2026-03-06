/**
 * [Component] 아이템 슬롯 DOM 생성을 담당하는 공통 컴포넌트입니다.
 */
export class SlotRenderer {
    static create(type, index, slotData, label, isHUD, ui) {
        const slot = document.createElement('div');
        if (type === 'container') slot.id = `loot-slot-${index}`;
        
        const baseClass = type === 'quick' ? 'w-10 h-10 md:w-12 md:h-12 text-xl md:text-2xl' : 
                          type === 'stash' ? 'w-8 h-8 md:w-10 md:h-10 text-lg md:text-xl' : 
                          'w-12 h-12 md:w-14 md:h-14 text-2xl md:text-3xl';
        
        // 컨테이너 슬롯 데이터 해석 로직 강화
        let itemObj = slotData;
        let isRevealed = true;
        if (type === 'container' && slotData && typeof slotData === 'object' && 'revealed' in slotData) {
            isRevealed = slotData.revealed;
            itemObj = isRevealed ? slotData.data : null;
        }

        // 미탐색 슬롯 처리
        if (type === 'container' && slotData && !isRevealed) {
            slot.className = `inv-slot bg-gray-800 shadow-inner flex items-center justify-center relative overflow-hidden ${baseClass}`;
            slot.innerHTML = `<span class="text-gray-500 font-bold text-lg animate-pulse">?</span>`;
            const pBar = document.createElement('div');
            pBar.className = "search-bar absolute bottom-0 left-0 h-1 bg-yellow-500 transition-none";
            const progress = slotData.progress || 0;
            pBar.style.width = `${Math.min(100, (progress / 1.5) * 100)}%`;
            slot.appendChild(pBar);
            return slot;
        }

        const isTouch = ui.container.get('InputManager').isTouchDevice;

        if (itemObj) {
            slot.className = `inv-slot bg-gray-700 shadow-inner cursor-pointer hover:bg-gray-500 transition flex items-center justify-center relative ${baseClass}`;
            slot.draggable = true;
            slot.innerHTML = `<span>${itemObj.emoji}</span>`;
            
            // 모든 슬롯(HUD 포함)에 마우스 오버 이벤트 적용
            slot.addEventListener('mouseenter', () => ui.showItemInfo(itemObj));
            slot.addEventListener('mouseleave', () => { if(!ui.selectedMobileSlot) ui.clearItemInfo(); });

            if (isHUD) {
                slot.addEventListener('pointerdown', e => { e.preventDefault(); ui.useItem(type, index); });
            } else {
                // 터치와 마우스 이벤트를 모두 바인딩하여 하이브리드 환경 대응
                if (isTouch) slot.addEventListener('touchstart', e => ui.handleMobileSlotClick(e, type, index), {passive: false});
                
                slot.oncontextmenu = e => { e.preventDefault(); ui.handleRightClickAction(type, index); };
                slot.addEventListener('dragstart', e => ui.handleDragStart(e, type, index));
            }
        } else {
            slot.className = `inv-slot empty flex items-center justify-center relative ${baseClass}`;
            // 빈 슬롯 마우스 오버 시 정보창 닫기 (HUD 포함 모든 슬롯 공통)
            slot.addEventListener('mouseenter', () => { if(!ui.selectedMobileSlot) ui.clearItemInfo(); });
            
            if (isTouch && !isHUD) {
                slot.addEventListener('touchstart', e => ui.handleMobileSlotClick(e, type, index), {passive: false});
            }
        }
        
        if (ui.selectedMobileSlot?.type === type && ui.selectedMobileSlot?.index === index) {
            slot.classList.add('border-blue-500', 'border-4');
        }

        if (label) {
            const lbl = document.createElement('span');
            lbl.className = 'absolute top-0 left-1 text-[9px] md:text-[11px] text-yellow-400 font-bold drop-shadow pointer-events-none';
            lbl.innerText = label;
            slot.appendChild(lbl);
        }
        
        if (!isHUD && !isTouch) {
            slot.addEventListener('dragover', e => e.preventDefault());
            slot.addEventListener('drop', e => ui.handleDrop(e, type, index));
        }
        
        return slot;
    }
}