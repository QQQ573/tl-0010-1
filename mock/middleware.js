module.exports = (req, res, next) => {
  if (req.method === 'GET' && req.path === '/slots/with-bookings') {
    return next();
  }
  
  if (req.method === 'POST' && req.path === '/bookings') {
    const slotId = req.body.slotId;
    const memberId = req.body.memberId;
    
    const slots = req.app.db.get('slots').value();
    const bookings = req.app.db.get('bookings').value();
    const slot = slots.find(s => s.id === slotId);
    
    if (!slot) {
      return res.status(404).json({ success: false, message: '时段不存在' });
    }
    
    const confirmedBookings = bookings.filter(
      b => b.slotId === slotId && b.status === 'confirmed'
    );
    
    const existingBooking = bookings.find(
      b => b.slotId === slotId && b.memberId === memberId
    );
    
    if (existingBooking) {
      return res.status(400).json({ success: false, message: '已预约该时段' });
    }
    
    const isFull = confirmedBookings.length >= slot.maxParticipants;
    
    const newBooking = {
      id: 'b' + Date.now(),
      slotId,
      memberId,
      status: isFull ? 'waitlist' : 'confirmed',
      waitlistPosition: isFull ? (bookings.filter(b => b.slotId === slotId && b.status === 'waitlist').length + 1) : undefined,
      bookedAt: new Date().toISOString()
    };
    
    req.app.db.get('bookings').push(newBooking).write();
    return res.json({ success: true, data: newBooking });
  }
  
  next();
};
