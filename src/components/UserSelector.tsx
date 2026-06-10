import type { FamilyMember } from '../types';

interface UserSelectorProps {
  members: FamilyMember[];
  currentUserId: string;
  onSelect: (userId: string) => void;
}

export default function UserSelector(props: UserSelectorProps) {
  return (
    <div class="sidebar-card">
      <h3>切换身份 (演示)</h3>
      <div class="user-selector">
        {props.members.map(member => (
          <div
            class={`user-chip ${member.id === props.currentUserId ? 'active' : ''}`}
            onClick={() => props.onSelect(member.id)}
          >
            {member.name}
            {member.isAdmin && ' 👑'}
          </div>
        ))}
      </div>
    </div>
  );
}
