const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (to, code) => {
  await transporter.sendMail({
    from: `"Rentura" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verification code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #ebebeb;border-radius:12px;">
        <h2 style="color:#0F4C5C;">Welcome to Rentura!</h2>
        <p>Your verification code is:</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0F4C5C;padding:16px 0;">${code}</div>
        <p style="color:#888;font-size:13px;">The code expires in 10 minutes.</p>
      </div>
    `,
  });
};

const sendReservationEmailToGuest = async (to, { guestName, title, location, checkIn, checkOut, guests, totalPrice, nights, paymentMethod }) => {
  await transporter.sendMail({
    from: `"Rentura" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Booking confirmed — ${title}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;border:1px solid #ebebeb;border-radius:12px;">
        <h2 style="color:#0F4C5C;margin-top:0;">Booking confirmed! 🎉</h2>
        <p>Hi ${guestName},</p>
        <p>Your reservation is pending host approval. Here are the details:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Property</td><td style="padding:8px 0;font-weight:600;color:#222;">${title}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Location</td><td style="padding:8px 0;color:#222;">${location}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Check-in</td><td style="padding:8px 0;color:#222;">${checkIn}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Check-out</td><td style="padding:8px 0;color:#222;">${checkOut}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Guests</td><td style="padding:8px 0;color:#222;">${guests}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Nights</td><td style="padding:8px 0;color:#222;">${nights}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Payment</td><td style="padding:8px 0;color:#222;">${paymentMethod === 'online' ? 'Online (Stripe)' : 'Pay on arrival'}</td></tr>
          <tr style="border-top:1px solid #ebebeb;">
            <td style="padding:12px 0;font-weight:700;color:#0F4C5C;font-size:16px;">Total</td>
            <td style="padding:12px 0;font-weight:700;color:#0F4C5C;font-size:16px;">$${totalPrice}</td>
          </tr>
        </table>
        <p style="color:#888;font-size:13px;">You can view and manage your booking at <a href="http://localhost:3000/reservations" style="color:#0F4C5C;">My Reservations</a>.</p>
      </div>
    `,
  });
};

const sendReservationEmailToOwner = async (to, { ownerName, guestName, guestEmail, title, checkIn, checkOut, guests, totalPrice, nights }) => {
  await transporter.sendMail({
    from: `"Rentura" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New booking request — ${title}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;border:1px solid #ebebeb;border-radius:12px;">
        <h2 style="color:#0F4C5C;margin-top:0;">New booking request 📩</h2>
        <p>Hi ${ownerName},</p>
        <p>You have a new reservation request for <strong>${title}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Guest</td><td style="padding:8px 0;font-weight:600;color:#222;">${guestName} (${guestEmail})</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Check-in</td><td style="padding:8px 0;color:#222;">${checkIn}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Check-out</td><td style="padding:8px 0;color:#222;">${checkOut}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Guests</td><td style="padding:8px 0;color:#222;">${guests}</td></tr>
          <tr><td style="padding:8px 0;color:#888;font-size:14px;">Nights</td><td style="padding:8px 0;color:#222;">${nights}</td></tr>
          <tr style="border-top:1px solid #ebebeb;">
            <td style="padding:12px 0;font-weight:700;color:#0F4C5C;font-size:16px;">Total</td>
            <td style="padding:12px 0;font-weight:700;color:#0F4C5C;font-size:16px;">$${totalPrice}</td>
          </tr>
        </table>
        <a href="http://localhost:3000/owner/reservations" style="display:inline-block;background:#0F4C5C;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">Manage bookings →</a>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (to, { name, resetToken }) => {
  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
  await transporter.sendMail({
    from: `"Rentura" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset your password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #ebebeb;border-radius:12px;">
        <h2 style="color:#0F4C5C;margin-top:0;">Reset your password</h2>
        <p>Hi ${name},</p>
        <p>Click the button below to reset your password. The link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#0F4C5C;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;margin:16px 0;">Reset password</a>
        <p style="color:#888;font-size:13px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
  sendReservationEmailToGuest,
  sendReservationEmailToOwner,
  sendPasswordResetEmail,
};
