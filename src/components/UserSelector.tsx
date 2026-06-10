import { createSignal } from 'solid-js';
import type { FamilyMember } from '../types';

interface UserSelectorProps {
  members: FamilyMember[];
  currentUserId: string;
  onSelect: (userId: string) => void;
}

export default function UserSelector(props: UserSelectorProps) {
  const [showDropdown, setShowDropdown] = createSignal(false);
  
  const currentUser = () => props.members.find(m => m.id === props.currentUserId);
  
  const handleSelect = (userId: string) => {
    props.onSelect(userId);
    setShowDropdown(false);
  };
  
  return (
    <div class="user-selector-wrapper">
      <button 
        class="user-selector-trigger"
        onClick={() => setShowDropdown(!showDropdown())}
      >
        <div class="user-avatar-small">
          {currentUser()?.name.charAt(0) || '?'}
        </div>
        <div class="user-selector-info">
          <div class="user-selector-name">
            {currentUser()?.name || '未登录'}
            {currentUser()?.isAdmin && <span class="admin-badge">👑 管理员</span>}
          </div>
          <div class="user-selector-role">
            {currentUser()?.role === 'elder' && '长辈'}
            {currentUser()?.role === 'adult' && '成年'}
            {currentUser()?.role === 'child' && '晚辈'}
            {' · '}
            {currentUser()?.timezone || '未知时区'}
          </div>
        </div>
        <span class="user-selector-arrow">▼</span>
      </button>
      
      {showDropdown() && (
        <div class="user-selector-dropdown">
          <div class="user-selector-dropdown-title">切换身份（演示用）</div>
          <div class="user-selector-list">
            {props.members.map(member => (
              <div
                class={`user-selector-item ${member.id === props.currentUserId ? 'active' : ''}`}
                onClick={() => handleSelect(member.id)}
              >
                <div class="user-avatar-small">
                  {member.name.charAt(0)}
                </div>
                <div class="user-item-info">
                  <div class="user-item-name">
                    {member.name}
                    {member.isAdmin && ' 👑'}
                  </div>
                  <div class="user-item-timezone">
                    {member.timezone}
                    {member.role === 'elder' && ' · 长辈'}
                    {member.role === 'adult' && ' · 成年'}
                    {member.role === 'child' && ' · 晚辈'}
                  </div>
                </div>
                {member.id === props.currentUserId && (
                  <span class="user-item-check">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
