import { Show, For } from 'solid-js';
import type { OverlapSlot, FamilyMember } from '../types';
import { formatSlotDisplay } from '../utils/overlap';

interface RecommendedSlotsProps {
  slots: OverlapSlot[];
  members: FamilyMember[];
  selectedTimezone: string;
  onBookSlot?: (slot: OverlapSlot) => void;
}

export default function RecommendedSlots(props: RecommendedSlotsProps) {
  return (
    <div class="sidebar-card">
      <h3>🔥 推荐时段 Top 3</h3>
      <Show when={props.slots.length > 0} fallback={
        <p class="card-hint">
          暂无足够的空闲时间重叠，请更多成员标记可接听窗口
        </p>
      }>
        <div class="recommended-slots-list">
          <For each={props.slots}>
            {(slot, index) => {
              const display = formatSlotDisplay(slot, props.selectedTimezone, props.members);
              return (
                <div 
                  class="slot-card recommended"
                  onClick={() => props.onBookSlot?.(slot)}
                >
                  <div class="slot-card-header">
                    <span class="slot-time">{display.time}</span>
                    <span class="slot-rank-badge">#{index() + 1}</span>
                  </div>
                  <div class="slot-members">
                    可参加: {display.memberNames.join(', ')}
                  </div>
                  <div class="slot-duration">
                    时长: {display.duration}
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
}
