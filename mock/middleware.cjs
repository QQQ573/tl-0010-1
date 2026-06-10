module.exports = (req, res, next) => {
  if (req.method === 'POST' && req.path === '/bookings') {
    const slotId = req.body.slotId;
    const memberId = req.body.memberId;
    
    const db = req.app.db;
    const slots = db.get('slots').value();
    const bookings = db.get('bookings').value();
    const slot = slots.find(s => s.id === slotId);
    
    if (!slot) {
      return res.status(404).json({ success: false, message: '时段不存在' });
    }
    
    const confirmedBookings = bookings.filter(
      b => b.slotId === slotId && b.status === 'confirmed'
    );
    
    const existingBooking = bookings.find(
      b => b.slotId === slotId && b.memberId === memberId && b.status !== 'cancelled'
    );
    
    if (existingBooking) {
      return res.status(400).json({ success: false, message: '已预约该时段' });
    }
    
    const isFull = confirmedBookings.length >= slot.maxParticipants;
    const waitlistBookings = bookings.filter(
      b => b.slotId === slotId && b.status === 'waitlist'
    );
    
    const newBooking = {
      id: 'b' + Date.now(),
      slotId: slotId,
      memberId: memberId,
      status: isFull ? 'waitlist' : 'confirmed',
      waitlistPosition: isFull ? (waitlistBookings.length + 1) : undefined,
      bookedAt: new Date().toISOString()
    };
    
    db.get('bookings').push(newBooking).write();
    return res.json({ success: true, data: newBooking });
  }
  
  next();
};
