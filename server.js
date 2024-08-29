const express = require('express');
const app = express();
app.use(express.json());

// Sample Data Storage
const rooms = [];
const bookings = [];

// Root Route
app.get('/', (req, res) => {
    res.send('Welcome to the Hall Booking API!');
});

// 1. Create a Room
app.post('/rooms', (req, res) => {
    const { numberOfSeats, amenities, pricePerHour } = req.body;

    const newRoom = {
        roomId: rooms.length + 1,
        numberOfSeats,
        amenities,
        pricePerHour,
        bookings: []
    };

    rooms.push(newRoom);
    res.status(201).json({ message: 'Room created successfully', room: newRoom });
});

// 2. Book a Room
app.post('/book', (req, res) => {
    const { customerName, date, startTime, endTime, roomId } = req.body;

    const room = rooms.find(r => r.roomId === roomId);

    if (!room) {
        return res.status(404).json({ message: 'Room not found' });
    }

    // Check for booking conflicts
    const isConflict = room.bookings.some(booking =>
        booking.date === date &&
        ((startTime >= booking.startTime && startTime < booking.endTime) ||
        (endTime > booking.startTime && endTime <= booking.endTime))
    );

    if (isConflict) {
        return res.status(400).json({ message: 'Room is already booked during this time' });
    }

    const newBooking = {
        bookingId: bookings.length + 1,
        customerName,
        date,
        startTime,
        endTime,
        roomId
    };

    room.bookings.push(newBooking);
    bookings.push(newBooking);
    res.status(201).json({ message: 'Room booked successfully', booking: newBooking });
});

// 3. List all Rooms with Booked Data
app.get('/rooms', (req, res) => {
    const roomData = rooms.map(room => ({
        roomName: `Room ${room.roomId}`,
        bookedStatus: room.bookings.length > 0 ? 'Booked' : 'Available',
        bookings: room.bookings.map(booking => ({
            customerName: booking.customerName,
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime
        }))
    }));

    res.json(roomData);
});

// 4. List all Customers with Booked Data
app.get('/customers', (req, res) => {
    const customerData = bookings.map(booking => ({
        customerName: booking.customerName,
        roomName: `Room ${booking.roomId}`,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime
    }));

    res.json(customerData);
});

// 5. List how many times a customer has booked the room
app.get('/customers/:name/bookings', (req, res) => {
    const customerName = req.params.name;

    const customerBookings = bookings.filter(booking => booking.customerName === customerName);

    if (customerBookings.length === 0) {
        return res.status(404).json({ message: 'No bookings found for this customer' });
    }

    const bookingData = customerBookings.map(booking => ({
        roomName: `Room ${booking.roomId}`,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        bookingId: booking.bookingId,
        bookingDate: booking.date, // Assuming booking date is the same as the event date
        bookingStatus: 'Confirmed' // Can be extended with more logic
    }));

    res.json({ customerName, totalBookings: customerBookings.length, bookings: bookingData });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
