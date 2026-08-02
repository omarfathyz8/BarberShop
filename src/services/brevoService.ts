const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailData {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  from?: EmailRecipient;
}

if (!BREVO_API_KEY) {
  console.warn('VITE_BREVO_API_KEY is not set in environment variables');
}

export async function sendEmail(data: EmailData): Promise<void> {
  try {
    const payload = {
      to: data.to,
      subject: data.subject,
      htmlContent: data.htmlContent,
      sender: data.from || { email: 'omarfathyyzz8@gmail.com', name: 'BarberHub' }
    };

    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Brevo API error: ${error.message || response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export function generateAppointmentConfirmationEmail(
  customerName: string,
  barberName: string,
  date: string,
  time: string,
  service: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; border: 1px solid #ddd; border-top: none; }
          .details { background-color: #f9fafb; padding: 15px; margin: 15px 0; border-left: 4px solid #3b82f6; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Confirmed</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your appointment has been confirmed!<br>Here are the details:</p>
            <div class="details">
              <p><strong>Barber:</strong> ${barberName}</p>
              <p><strong>Service:</strong> ${service}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
            </div>
            <p>Please arrive 5-10 minutes early. If you need to reschedule or cancel, please contact us as soon as possible.</p>
            <p>Thank you for choosing BarberHub!</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 BarberHub. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
