import type { FamilyMember, AvailabilityWindow } from '../types';
import { getTimezoneDisplay } from '../utils/timezone';

interface MemberListProps {
  members: FamilyMember[];
  currentUserId: string;
  availabilities: AvailabilityWindow[];
  onSelectMember: (memberId: string) => void;
}

export default function MemberList(props: MemberListProps) {
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'elder': return '长辈';
      case 'adult': return '成年';
      case 'child': return '晚辈';
      default: return role;
    }
  };

  const getMemberAvailabilityCount = (memberId: string) => {
    return props.availabilities.filter(a => a.memberId === memberId).length;
  };
  
  return (
    <div class="sidebar-card">
      <h3>家族成员</h3>
      <p class="card-hint">点击成员可设置其可接听时间</p>
      <ul class="member-list">
        {props.members.map(member => {
          const tzDisplay = getTimezoneDisplay(member.timezone);
          const availCount = getMemberAvailabilityCount(member.id);
          
          return (
            <li 
              class="member-item"
              onClick={() => props.onSelectMember(member.id)}
            >
              <div class="member-avatar">
                {member.name.charAt(0)}
              </div>
              <div class="member-info">
                <div class="member-name">
                  {member.name}
                  {member.id === props.currentUserId && ' (我)'}
                </div>
                <div class="member-timezone">
                  {tzDisplay.cityName} · {tzDisplay.offset}
                  {tzDisplay.isDST && ' (夏令时)'}
                </div>
                <div class={`member-availability-status ${availCount > 0 ? 'has-avail' : 'no-avail'}`}>
                  {availCount > 0 ? `✓ 已标记 ${availCount} 天` : '○ 未标记'}
                </div>
              </div>
              <span class={`member-role ${member.role}`}>
                {getRoleLabel(member.role)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
