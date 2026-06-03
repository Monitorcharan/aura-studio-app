import os
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def _send_email_async(to_email, otp):
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    # If SMTP_USER or SMTP_PASSWORD is not configured, print error
    if not smtp_user or not smtp_password:
        print("SMTP Warning: SMTP_USER and SMTP_PASSWORD environment variables are not set. E-mail will not be dispatched.")
        return

    try:
        # Create message container
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = to_email
        msg['Subject'] = "Aura Studio - Verify Your Account"

        # HTML Body
        html_content = f"""
        <html>
            <body style="font-family: 'Outfit', sans-serif; background-color: #050505; color: #F5F5F5; padding: 30px; text-align: center; margin: 0;">
                <div style="max-width: 500px; margin: 40px auto; background: #121216; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); text-align: center;">
                    <h2 style="font-family: 'Space Grotesk', sans-serif; color: #00F0FF; margin-bottom: 5px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700;">Aura Studio</h2>
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 30px 0; letter-spacing: 0.1em; text-transform: uppercase;">Elevating Your Aesthetic</p>
                    
                    <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 24px;">
                        <p style="font-size: 15px; line-height: 1.6; color: #d1d5db; margin: 0 0 24px 0;">Welcome to Aura Studio! To complete your registration and activate your account, please use the following One-Time Password (OTP):</p>
                        <div style="font-size: 38px; font-family: 'Space Grotesk', sans-serif; color: #00F0FF; letter-spacing: 6px; margin: 24px 0; background: rgba(0,240,255,0.05); padding: 12px 24px; border-radius: 12px; border: 1px dashed rgba(0,240,255,0.25); display: inline-block; font-weight: bold;">{otp}</div>
                        <p style="font-size: 12px; color: #6b7280; margin: 20px 0 0 0;">This OTP is valid for 10 minutes. If you did not register for an account, please ignore this email.</p>
                    </div>
                </div>
            </body>
        </html>
        """

        msg.attach(MIMEText(html_content, 'html'))

        # Connect to server and send
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())
        server.quit()
        print(f"OTP Email sent successfully to {to_email}")
    except Exception as e:
        print(f"Failed to send OTP Email to {to_email}: {e}")

def send_otp_email(to_email, otp):
    """Sends OTP email in a background thread to prevent blocking request handler."""
    thread = threading.Thread(target=_send_email_async, args=(to_email, otp))
    thread.daemon = True
    thread.start()
