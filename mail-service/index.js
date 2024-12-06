const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS for frontend (adjust the origin as needed)
app.use(cors({
  origin: "https://demomail.kubez.cloud", // Allow requests only from your frontend
  methods: "GET,POST,OPTIONS", // Specify allowed HTTP methods
  allowedHeaders: "Content-Type,Authorization", // Specify allowed headers
  credentials: true, // If you need to send cookies or authentication headers
}));

// Middleware to parse JSON body
app.use(express.json());

// In-memory storage for OTPs and verified emails
let otpStore = {};
let verifiedEmails = {};

// Email templates
const otpEmailTemplate = (otp) => `
  <html>
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
        }
        .content {
          font-size: 16px;
          color: #333;
          line-height: 1.6;
          padding: 20px;
          text-align: center;
        }
        .otp-code {
          font-size: 28px;
          font-weight: bold;
          color: #4CAF50;
          padding: 10px 0;
        }
        .footer {
          font-size: 12px;
          text-align: center;
          color: #888;
          margin-top: 20px;
        }
        .footer a {
          color: #4CAF50;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>DemoMail OTP Verification</h2>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p>Your one-time password (OTP) to verify your email address is:</p>
          <p class="otp-code">${otp}</p>
          <p>This OTP is valid for the next 5 minutes. Please use it to complete your verification.</p>
        </div>
        <div class="footer">
          <p>If you did not request this, please ignore this email.</p>
          <p>Need help? <a href="mailto:support@kubez.cloud">Contact us</a>.</p>
        </div>
      </div>
    </body>
  </html>
`;

const verificationEmailTemplate = () => `
  <html>
    <head>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
        }
        .content {
          font-size: 16px;
          color: #333;
          line-height: 1.6;
          padding: 20px;
        }
        .cta-button {
          background-color: #4CAF50;
          color: white;
          padding: 15px 25px;
          text-align: center;
          display: inline-block;
          font-size: 16px;
          font-weight: bold;
          border-radius: 5px;
          text-decoration: none;
        }
        .cta-button:hover {
          background-color: #45a049;
        }
        .footer {
          font-size: 12px;
          text-align: center;
          color: #888;
          margin-top: 20px;
        }
        .greyText {
            color: #888;
        }
        .footer a {
          color: #4CAF50;
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Welcome to DemoMail!</h2>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>Thank you for signing up with DemoMail! We're excited to have you on board and to help you on your Kubernetes learning journey.</p>
          <p>Your email has been successfully verified, and you are now ready to explore My Portfolio <span class="greyText">(It's not complete tho)</span>.</p>
          <p><a href="https://kubez.cloud" class="cta-button">Start Exploring My Portolio </a></p>
        </div>
        <div class="footer">
          <p>If you have any questions, feel free to <a href="mailto:support@kubez.cloud">contact us</a>.</p>
        </div>
      </div>
    </body>
  </html>
`;

// Send OTP to user's email
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send("Email is required");
  }

  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Store the OTP with email (valid for 5 minutes)
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  try {
    // Configure the email transport with Hostinger SMTP settings
    let transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send the OTP email with styling
    await transporter.sendMail({
      from: `"KubeLabs" <mail@kubez.cloud>`, // Updated sender email
      replyTo: "no-reply@kubez.cloud", // No reply email
      to: email,
      subject: "Your OTP Code",
      html: otpEmailTemplate(otp),  // Send the styled OTP email
    });

    res.send("OTP sent successfully!");
    console.log(`Otp to ${email} sent successfully.`)
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send OTP.");
  }
});

// Verify OTP and send verification confirmation email only
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).send("Email and OTP are required");
  }

  const storedOtpData = otpStore[email];

  if (!storedOtpData) {
    return res.status(400).send("No OTP generated for this email.");
  }

  // Check if OTP has expired
  if (Date.now() > storedOtpData.expiresAt) {
    delete otpStore[email]; // Remove expired OTP
    return res.status(400).send("OTP has expired.");
  }

  // Check if the OTP matches
  if (storedOtpData.otp !== otp) {
    return res.status(400).send("Invalid OTP.");
  }

  // OTP is verified, delete OTP from store and mark email as verified
  verifiedEmails[email] = true;
  delete otpStore[email];

  try {
    // Configure the email transport with Hostinger SMTP settings
    let transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send the verification confirmation email with styling
    await transporter.sendMail({
      from: `"KubeLabs" <mail@kubez.cloud>`, // Updated sender email
      replyTo: "no-reply@kubez.cloud", // No reply email
      to: email,
      subject: "Email Verified Successfully!",
      html: verificationEmailTemplate(),  // Send the styled verification email
    });

    res.send("OTP verified and verification email sent successfully!");
    console.log(`OTP verified and verification email sent successfully to ${email}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to send verification email.");
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.warn(`Mail service running on port http://localhost:${PORT} \nFrontend is running on https://demomail.kubez.cloud`));