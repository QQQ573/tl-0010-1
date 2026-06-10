import type { FamilyMember } from '../types';
import { getTimezoneDisplay } from '../utils/timezone';

interface MemberListProps {
  members: FamilyMember[];
  currentUserId: string;
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
  
  return (
    <div class="sidebar-card">
      <h3>家族成员</h3>
      <p class="card-hint">点击成员可设置其可接听时间</p>
      <ul class="member-list">
        {props.members.map(member => {
          const tzDisplay = getTimezoneDisplay(member.timezone);
          
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
