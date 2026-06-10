import { createSignal } from 'solid-js';
import type { CreateSlotRequest } from '../types';

interface CreateSlotModalProps {
  onClose: () => void;
  onCreate: (data: CreateSlotRequest) => void;
  isAdmin: boolean;
}

export default function CreateSlotModal(props: CreateSlotModalProps) {
  const [title, setTitle] = createSignal('');
  const [date, setDate] = createSignal('2026-02-17');
  const [startTime, setStartTime] = createSignal('10:00');
  const [endTime, setEndTime] = createSignal('11:00');
  const [maxParticipants, setMaxParticipants] = createSignal(6);
  const [description, setDescription] = createSignal('');
  const [privateNote, setPrivateNote] = createSignal('');
  
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    
    const startIso = `${date()}T${startTime()}:00+08:00`;
    const endIso = `${date()}T${endTime()}:00+08:00`;
    
    props.onCreate({
      title: title(),
      startIso,
      endIso,
      maxParticipants: maxParticipants(),
      description: description() || undefined,
      privateNote: privateNote() || undefined,
    });
  };
  
  if (!props.isAdmin) {
    return (
      <div class="modal-overlay" onClick={props.onClose}>
        <div class="modal-content" onClick={e => e.stopPropagation()}>
          <div class="modal-header">
            <h2 class="modal-title">权限不足</h2>
            <button class="modal-close" onClick={props.onClose}>×</button>
          </div>
          <p>只有管理员可以创建拜年时段。</p>
        </div>
      </div>
    );
  }
  
  return (
    <div class="modal-overlay" onClick={props.onClose}>
      <div class="modal-content" onClick={e => e.stopPropagation()}>
        <div class="modal-header">
          <h2 class="modal-title">创建拜年时段</h2>
          <button class="modal-close" onClick={props.onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div class="form-group">
            <label>时段标题 *</label>
            <input 
              type="text" 
              value={title()} 
              onInput={e => setTitle(e.target.value)}
              placeholder="如：初一早间拜年"
              required
            />
          </div>
          
          <div class="form-group">
            <label>日期 *</label>
            <input 
              type="date" 
              value={date()} 
              onInput={e => setDate(e.target.value)}
              required
            />
          </div>
          
          <div class="time-picker-row">
            <div class="form-group">
              <label>开始时间 (北京时间) *</label>
              <input 
                type="time" 
                value={startTime()} 
                onInput={e => setStartTime(e.target.value)}
                required
              />
            </div>
            <div class="form-group">
              <label>结束时间 (北京时间) *</label>
              <input 
                type="time" 
                value={endTime()} 
                onInput={e => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div class="form-group">
            <label>最大参与人数</label>
            <input 
              type="number" 
              value={maxParticipants()} 
              onInput={e => setMaxParticipants(parseInt(e.target.value) || 6)}
              min="1"
              max="20"
            />
          </div>
          
          <div class="form-group">
            <label>描述</label>
            <textarea 
              value={description()} 
              onInput={e => setDescription(e.target.value)}
              placeholder="活动描述（所有人可见）"
              rows={3}
            />
          </div>
          
          <div class="form-group">
            <label>私密备注 (仅长辈可见)</label>
            <textarea 
              value={privateNote()} 
              onInput={e => setPrivateNote(e.target.value)}
              placeholder="私密备注，只有长辈角色可以看到"
              rows={2}
            />
          </div>
          
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary btn-large">
              创建
            </button>
            <button type="button" class="btn btn-secondary btn-large" onClick={props.onClose}>
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
